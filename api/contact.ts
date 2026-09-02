import type { VercelRequest, VercelResponse } from "@vercel/node";

const allowedTopics = new Set(["General question", "Article submission", "Resource correction", "Store support"]);

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function cleanText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  response.setHeader("Cache-Control", "no-store");
  const name = cleanText(request.body?.name, 100);
  const email = cleanText(request.body?.email, 254).toLowerCase();
  const topic = cleanText(request.body?.topic, 50);
  const message = cleanText(request.body?.message, 5000);
  const website = cleanText(request.body?.website, 200);

  if (website) return response.status(200).json({ sent: true });
  if (!validEmail(email) || !allowedTopics.has(topic) || message.length < 10) {
    return response.status(400).json({ error: "Please enter a valid email, choose a topic, and include a message." });
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requiredEnvironment("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
        "User-Agent": "SurvivorSystemsWebsite/1.0",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL?.trim() || "Survivor Systems <website@survivorsystems.org>",
        to: [requiredEnvironment("CONTACT_TO_EMAIL")],
        reply_to: email,
        subject: `[Survivor Systems] ${topic}`,
        text: [`Topic: ${topic}`, `From: ${name || "Not provided"}`, `Reply email: ${email}`, "", message].join("\n"),
      }),
    });

    if (!resendResponse.ok) {
      const details = await resendResponse.text();
      console.error("Resend contact delivery failed:", resendResponse.status, details.slice(0, 500));
      throw new Error("Resend rejected the message.");
    }
    return response.status(200).json({ sent: true });
  } catch (error) {
    console.error("Contact form failed:", error instanceof Error ? error.message : error);
    return response.status(500).json({ error: "Your message could not be sent right now. Please try again shortly." });
  }
}
