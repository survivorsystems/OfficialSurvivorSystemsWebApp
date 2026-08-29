import { createAdminClient } from "@supabase/server/core";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const bucket = "Free Trackers";

type StorageObject = {
  id?: string | null;
  name: string;
  metadata?: { size?: number } | null;
};

type LocatedObject = {
  object: StorageObject;
  path: string;
};

async function locateFreeResources(supabase: ReturnType<typeof createAdminClient>) {
  const located: LocatedObject[] = [];

  async function walk(path = "", depth = 0): Promise<void> {
    if (depth > 6) return;

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, { limit: 1000, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;

    for (const item of (data ?? []) as StorageObject[]) {
      if (!item.name || item.name.startsWith(".")) continue;
      const itemPath = path ? `${path}/${item.name}` : item.name;

      const isFolder = item.id == null && item.metadata == null;
      if (isFolder) {
        await walk(itemPath, depth + 1);
      } else {
        located.push({ object: item, path: itemPath });
      }
    }
  }

  await walk();

  return Array.from(new Map(located.map((item) => [item.path, item])).values());
}

function displayName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)$/, "");
  const readableName = withoutExtension
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/resource\s+navigation/i.test(readableName)) return "Resource Navigation Tracker";
  return readableName;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createAdminClient();
    const objects = await locateFreeResources(supabase);
    const resources = objects
      .map(({ object, path }) => {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path, { download: object.name });
        return {
          id: object.id,
          name: displayName(object.name),
          fileName: object.name,
          url: data.publicUrl,
          size: typeof object.metadata?.size === "number" ? object.metadata.size : null,
        };
      });

    response.setHeader(
      "Cache-Control",
      resources.length > 0 ? "public, max-age=60, s-maxage=300, stale-while-revalidate=600" : "no-store",
    );

    return response.status(200).json({ resources });
  } catch (error) {
    console.error("Free resources could not be listed:", error instanceof Error ? error.message : error);
    return response.status(500).json({ error: "The free resources could not be loaded." });
  }
}
