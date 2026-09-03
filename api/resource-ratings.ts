import { createAdminClient } from "@supabase/server/core";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type RatingValue = "trusted" | "not_helpful" | "possibly_dangerous";

type RatingRow = {
  resource_key: string;
  public_rating: RatingValue | null;
};

type RatingsDatabase = {
  public: {
    Tables: {
      agency_experience_submissions: {
        Row: RatingRow & { state: string; moderation_status: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function cleanState(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const state = cleanState(request.query.state);
  if (!state) return response.status(400).json({ error: "A state is required." });

  try {
    const supabase = createAdminClient<RatingsDatabase>();
    const { data, error } = await supabase
      .from("agency_experience_submissions")
      .select("resource_key,public_rating")
      .eq("state", state)
      .in("moderation_status", ["pending", "reviewed"]);
    if (error) throw error;

    const totals = new Map<string, Record<RatingValue, number>>();
    for (const row of (data ?? []) as RatingRow[]) {
      if (!row.public_rating) continue;
      const counts = totals.get(row.resource_key) ?? { trusted: 0, not_helpful: 0, possibly_dangerous: 0 };
      counts[row.public_rating] += 1;
      totals.set(row.resource_key, counts);
    }

    const ratings = Array.from(totals, ([resourceKey, counts]) => ({
      resourceKey,
      total: counts.trusted + counts.not_helpful + counts.possibly_dangerous,
      counts,
    }));
    response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return response.status(200).json({ ratings });
  } catch (error) {
    console.error("Public resource ratings failed:", error instanceof Error ? error.message : "Unknown error");
    return response.status(500).json({ error: "Community ratings could not be loaded right now." });
  }
}
