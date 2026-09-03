import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend, type Attachment, type EmailReceivedEvent } from "resend";

export const config = { api: { bodyParser: false } };
export const maxDuration = 60;

const allowedRecipients = new Set([
  "admin@survivorsystems.org",
  "help@survivorsystems.org",
  "info@survivorsystems.org",
  "krista@survivorsystems.org",
]);

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function readRawBody(request: VercelRequest) {
  let body = "";
  for await (const chunk of request) {
    body += typeof chunk === "string" ? chunk : chunk.toString("utf8");
  }
  return body;
}

function header(request: VercelRequest, name: string) {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function mailbox(value: string) {
  const match = value.match(/<([^<>]+)>\s*$/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

function routedRecipient(event: EmailReceivedEvent) {
  const recipients = [...event.data.to, ...event.data.cc, ...event.data.bcc, ...event.data.received_for];
  return recipients.map(mailbox).find((address) => allowedRecipients.has(address));
}

async function downloadAttachments(resend: Resend, emailId: string): Promise<Attachment[]> {
  const { data, error } = await resend.emails.receiving.attachments.list({ emailId });
  if (error) throw new Error(`Could not list inbound attachments: ${error.message}`);

  return Promise.all(
    (data?.data ?? []).map(async (attachment) => {
      const result = await fetch(attachment.download_url);
      if (!result.ok) throw new Error(`Could not download inbound attachment: ${result.status}`);
      return {
        content: Buffer.from(await result.arrayBuffer()),
        filename: attachment.filename,
        contentType: attachment.content_type,
        contentId: attachment.content_id,
      };
    }),
  );
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  response.setHeader("Cache-Control", "no-store");

  try {
    const resend = new Resend(requiredEnvironment("RESEND_INBOUND_API"));
    const rawBody = await readRawBody(request);
    const event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: header(request, "svix-id") ?? "",
        timestamp: header(request, "svix-timestamp") ?? "",
        signature: header(request, "svix-signature") ?? "",
      },
      webhookSecret: requiredEnvironment("RESEND_WEBHOOK_SECRET"),
    });

    if (event.type !== "email.received") {
      return response.status(200).json({ received: true });
    }

    const recipient = routedRecipient(event);
    if (!recipient) {
      console.info("Ignored inbound email for an unconfigured Survivor Systems address.");
      return response.status(200).json({ received: true });
    }

    const { data: email, error: emailError } = await resend.emails.receiving.get(event.data.email_id, {
      html_format: "cid",
    });
    if (emailError || !email) throw new Error(`Could not retrieve inbound email: ${emailError?.message ?? "unknown error"}`);

    const attachments = await downloadAttachments(resend, event.data.email_id);
    const content = email.html
      ? { html: email.html, text: email.text ?? "" }
      : { text: email.text ?? "(This email did not include a readable message body.)" };
    const { error: sendError } = await resend.emails.send(
      {
        from: "Survivor Systems Mail <info@survivorsystems.org>",
        to: requiredEnvironment("CONTACT_TO_EMAIL"),
        replyTo: email.reply_to?.length ? email.reply_to : email.from,
        subject: `[${recipient}] ${email.subject || "No subject"}`,
        attachments,
        headers: { "X-Survivor-Systems-Original-Recipient": recipient },
        ...content,
      },
      { idempotencyKey: `inbound-${event.data.email_id}` },
    );
    if (sendError) throw new Error(`Could not forward inbound email: ${sendError.message}`);

    return response.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown inbound email error";
    console.error("Resend inbound forwarding failed:", message);
    return response.status(400).json({ error: "Inbound email processing failed" });
  }
}
