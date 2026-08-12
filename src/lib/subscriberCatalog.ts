export type SubscriberCatalogItem = {
  id: string;
  title: string;
  category: string;
  format: string;
  fileSizeBytes: number | null;
  preview: string;
  access: string;
};

type CatalogRow = {
  id: string;
  title: string;
  category: string;
  format: string;
  file_size_bytes: number | null;
  preview: string;
  access_note: string;
};

const titleAliases: Record<string, string> = {
  survivorspeckledweeklypages: "Survivor Speckled Weekly Pages",
  dismantlingthepatriarchyathomeguidedjournal2026: "Dismantling the Patriarchy at Home Guided Journal 2026",
  emotionalautonomyrestorationworkbook2026: "Emotional Autonomy Restoration Workbook 2026",
  financialautonomyrestorationworkbook2026: "Financial Autonomy Restoration Workbook 2026",
  sexualautonomyrestorationworkbook2026: "Sexual Autonomy Restoration Workbook 2026",
  totalautonomyrestorationworkbook2026: "Total Autonomy Restoration Workbook 2026",
  dvfundinginfographic2: "Domestic Violence Funding Infographic 2",
  intimatepartnerterrorism: "Intimate Partner Terrorism",
  c1dismantlingthepatriarchyathomec1: "Course 1: Dismantling the Patriarchy at Home",
  c2dismantlingthepatriarchyathomec2: "Course 2: Dismantling the Patriarchy at Home",
  c3dismantlingthepatriarchyemotionc3: "Course 3: Dismantling the Patriarchy and Emotion",
  c4dismantlingthepatriarchyemotionsc4: "Course 4: Dismantling the Patriarchy and Emotions",
  c5dismantlingthepatriarchyemotionsc5: "Course 5: Dismantling the Patriarchy and Emotions",
};

function formatCatalogTitle(value: string) {
  const compact = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (titleAliases[compact]) return titleAliases[compact];
  const formatted = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return formatted === formatted.toLowerCase()
    ? formatted.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    : formatted;
}

function titleFromCatalogRow(row: CatalogRow) {
  const fileName = row.id.split("/").pop();
  if (!fileName) return formatCatalogTitle(row.title);
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").replace(/\s*\([0-9]+\)$/, "");
  return formatCatalogTitle(withoutExtension.replace(/[_-]+/g, " "));
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "https://nwpqdpfhburdeprbfkqi.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cHFkcGZoYnVyZGVwcmJma3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0Mjk5MzUsImV4cCI6MjA5ODAwNTkzNX0.1hK1CB-1kbN_iuTKLg3R-OF2wQBXFludE3sOFLJJT_k";

export async function fetchSubscriberCatalog(signal?: AbortSignal): Promise<SubscriberCatalogItem[]> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/library_public_catalog?select=id,title,category,format,file_size_bytes,preview,access_note&is_published=eq.true&order=sort_order.asc`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Catalog request failed with status ${response.status}.`);
  }

  const rows = await response.json() as CatalogRow[];
  return rows.map((row) => ({
    id: row.id,
    title: titleFromCatalogRow(row),
    category: row.category,
    format: row.format,
    fileSizeBytes: row.file_size_bytes,
    preview: row.preview,
    access: row.access_note,
  }));
}

export function formatCatalogFileSize(bytes: number | null) {
  if (!bytes || bytes < 1) return "Size unavailable";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
