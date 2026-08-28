import { createAdminClient } from "@supabase/server/core";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const bucket = "Public Bucket Files";
const folder = "Free Trackers";

function displayName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const readableName = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (/resource\s+navigation/i.test(readableName)) return "Resource Navigation Tracker";
  return readableName;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  response.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

  try {
    const supabase = createAdminClient();
    const { data: objects, error } = await supabase.storage
      .from(bucket)
      .list(folder, { limit: 100, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;

    const resources = (objects ?? [])
      .filter((object) => object.id && object.name && !object.name.startsWith("."))
      .map((object) => {
        const path = `${folder}/${object.name}`;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path, { download: object.name });
        return {
          id: object.id,
          name: displayName(object.name),
          fileName: object.name,
          url: data.publicUrl,
          size: typeof object.metadata?.size === "number" ? object.metadata.size : null,
        };
      });

    return response.status(200).json({ resources });
  } catch (error) {
    console.error("Free resources could not be listed:", error instanceof Error ? error.message : error);
    return response.status(500).json({ error: "The free resources could not be loaded." });
  }
}
