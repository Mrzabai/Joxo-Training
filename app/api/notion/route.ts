import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

const DEFAULT_DATA_SOURCE_ID = "4a57eb40-6100-41bf-babe-5b863753c11f";
const NOTION_VERSION = "2026-03-11";

function runtimeValue(key: string) {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  return runtimeEnv[key] ?? process.env[key];
}

type NotionProperty = {
  type?: string;
  title?: Array<{ plain_text?: string }>;
  rich_text?: Array<{ plain_text?: string }>;
  select?: { name?: string } | null;
  number?: number | null;
};

type NotionPage = {
  id: string;
  url?: string;
  properties?: Record<string, NotionProperty>;
};

function propertyText(property?: NotionProperty): string | number | null {
  if (!property) return "";
  if (property.type === "title") return property.title?.map((item) => item.plain_text ?? "").join("") ?? "";
  if (property.type === "rich_text") return property.rich_text?.map((item) => item.plain_text ?? "").join("") ?? "";
  if (property.type === "select") return property.select?.name ?? "";
  if (property.type === "number") return property.number ?? null;
  return "";
}

function parseGoal(goal: string) {
  const setMatch = goal.match(/(\d+)\s*[×x]/i);
  const repMatch = goal.match(/[×x]\s*(\d+)\s*[–-]\s*(\d+)/i);
  return {
    sets: setMatch ? Number(setMatch[1]) : 3,
    minReps: repMatch ? Number(repMatch[1]) : 8,
    maxReps: repMatch ? Number(repMatch[2]) : 12,
  };
}

function mapPage(page: NotionPage) {
  const p = page.properties ?? {};
  const goal = String(propertyText(p["Mål"]) ?? "");
  const parsed = parseGoal(goal);
  const weightValue = propertyText(p["Set 1 kg"]);
  return {
    id: page.id.replaceAll("-", ""),
    notionUrl: page.url ?? "",
    name: String(propertyText(p["Övning"]) ?? "Övning"),
    pass: String(propertyText(p["Pass"]) ?? ""),
    muscle: String(propertyText(p["Muskelgrupp"]) ?? "Övrigt"),
    order: Number(propertyText(p["Ordning"]) ?? 99),
    goal,
    ...parsed,
    weight: typeof weightValue === "number" ? weightValue : null,
    startReps: Number(propertyText(p["Set 1 reps"]) ?? parsed.minReps),
    technique: String(propertyText(p["Teknik"]) ?? ""),
    note: String(propertyText(p["Kommentar"]) ?? ""),
    nextAdvice: String(propertyText(p["Nästa gång"]) ?? ""),
  };
}

export async function GET() {
  return Response.json({
    configured: Boolean(runtimeValue("NOTION_TOKEN")),
    dataSourceConfigured: Boolean(runtimeValue("NOTION_DATA_SOURCE_ID") || DEFAULT_DATA_SOURCE_ID),
    importedAt: "2026-08-17T15:15:00.000Z",
    importedExercises: 27,
  });
}

export async function POST() {
  const token = runtimeValue("NOTION_TOKEN");
  const dataSourceId = runtimeValue("NOTION_DATA_SOURCE_ID") ?? DEFAULT_DATA_SOURCE_ID;
  if (!token) {
    return Response.json(
      {
        error: "Automatisk synk behöver NOTION_TOKEN i appens hemliga miljövariabler.",
        setupRequired: true,
        importedExercises: 27,
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100 }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Notion svarade ${response.status}: ${detail.slice(0, 180)}`);
    }

    const body = (await response.json()) as { results?: NotionPage[] };
    const exercises = (body.results ?? []).map(mapPage).sort((a, b) => {
      const pass = a.pass.localeCompare(b.pass, "sv");
      return pass === 0 ? a.order - b.order : pass;
    });
    return Response.json({
      connected: true,
      syncedAt: new Date().toISOString(),
      importedExercises: exercises.length,
      exercises,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Notion-synken misslyckades." },
      { status: 502 },
    );
  }
}
