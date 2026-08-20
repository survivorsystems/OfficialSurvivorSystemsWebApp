import { createAdminClient } from "@supabase/server/core";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const allowedAnswerKeys = new Set([
  "contactedWhen", "helpSought", "reachedAgency", "outcome", "denialReasons", "listingAccuracy",
  "feltListenedTo", "treatedWithRespect", "optionsExplained", "feltJudged", "barriers", "supportImpact",
  "overallRating", "recommendation", "agencyDidWell", "agencyCouldChange", "survivorShouldKnow", "investigate",
  "investigateWhy", "directoryIssues", "directoryExplanation", "experienceNarrative", "afterwardNarrative",
  "additionalSurvivorNote",
]);

type SubmissionInsert = {
  state: string;
  agency_name: string;
  branch_location: string | null;
  answers: Record<string, string | string[]>;
  publication_permission: string | null;
  follow_up_allowed: boolean;
  follow_up_contact: string | null;
  questionnaire_version: number;
};

type AgencyReviewDatabase = {
  public: {
    Tables: {
      agency_experience_submissions: {
        Row: SubmissionInsert & { id: number; moderation_status: string; created_at: string };
        Insert: SubmissionInsert;
        Update: Partial<SubmissionInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanAnswers(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const answers: Record<string, string | string[]> = {};
  for (const [key, answer] of Object.entries(value)) {
    if (!allowedAnswerKeys.has(key)) continue;
    answers[key] = Array.isArray(answer)
      ? answer.filter((item): item is string => typeof item === "string").slice(0, 30).map((item) => item.trim().slice(0, 160))
      : cleanText(answer, 3000);
  }
  return answers;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }
  response.setHeader("Cache-Control", "no-store");
  const body = request.body && typeof request.body === "object" ? request.body : {};
  if (cleanText(body.website, 100)) return response.status(200).json({ ok: true });

  const state = cleanText(body.state, 80);
  const agencyName = cleanText(body.agencyName, 200);
  const publicationPermission = cleanText(body.publicationPermission, 80);
  if (!state || !agencyName) return response.status(400).json({ error: "Please name the agency you are reviewing." });
  if (body.privacyAcknowledged !== true) return response.status(400).json({ error: "Please confirm the privacy reminder before submitting." });

  try {
    const supabase = createAdminClient<AgencyReviewDatabase>();
    const { error } = await supabase.from("agency_experience_submissions").insert({
      state,
      agency_name: agencyName,
      branch_location: cleanText(body.branchLocation, 200) || null,
      answers: cleanAnswers(body.answers),
      publication_permission: publicationPermission || null,
      follow_up_allowed: body.followUpAllowed === true,
      follow_up_contact: body.followUpAllowed === true ? cleanText(body.followUpContact, 250) || null : null,
      questionnaire_version: 1,
    });
    if (error) throw error;
    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error("Agency review submission failed:", error instanceof Error ? error.message : "Unknown error");
    return response.status(500).json({ error: "Your review could not be submitted right now. Please try again." });
  }
}
