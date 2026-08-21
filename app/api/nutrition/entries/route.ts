import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { nutritionEntries } from "../../../../db/schema";

export const dynamic = "force-dynamic";

function ownerFrom(request: Request) {
  return request.headers.get("oai-authenticated-user-email") ?? "jocke@local";
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanNumber(value: unknown, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : 0;
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Okänt fel";
  if (message.includes("no such table")) return "Matloggen håller på att förberedas. Försök igen om en liten stund.";
  return "Matloggen kunde inte nås just nu.";
}

function parseDetails(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  try {
    const rows = await getDb()
      .select()
      .from(nutritionEntries)
      .where(eq(nutritionEntries.owner, ownerFrom(request)))
      .orderBy(desc(nutritionEntries.loggedAt))
      .limit(500);

    return Response.json({
      entries: rows.map((row) => ({
        id: row.id,
        name: row.name,
        meal: row.mealType,
        calories: row.calories,
        protein: row.protein,
        loggedAt: row.loggedAt,
        source: row.source,
        confidence: row.confidence,
        description: row.description,
        imageKey: row.imageKey,
        imageType: row.imageType,
        details: parseDetails(row.detailsJson),
      })),
    });
  } catch (error) {
    return Response.json({ entries: [], error: errorMessage(error) }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 30_000) return Response.json({ error: "Måltiden innehåller för mycket data." }, { status: 413 });

    const payload = JSON.parse(raw) as Record<string, unknown>;
    const id = cleanText(payload.id, 80) || crypto.randomUUID();
    const name = cleanText(payload.name, 160);
    const mealType = cleanText(payload.meal, 40) || "Mellanmål";
    const loggedAt = cleanText(payload.loggedAt, 40) || new Date().toISOString();
    if (!name) return Response.json({ error: "Måltiden behöver ett namn." }, { status: 400 });
    if (Number.isNaN(Date.parse(loggedAt))) return Response.json({ error: "Ogiltigt datum." }, { status: 400 });

    const entry = {
      id,
      owner: ownerFrom(request),
      loggedAt,
      mealType,
      name,
      description: cleanText(payload.description, 2_000),
      calories: Math.round(cleanNumber(payload.calories, 10_000)),
      protein: Math.round(cleanNumber(payload.protein, 1_000) * 10) / 10,
      source: cleanText(payload.source, 30) || "manual",
      confidence: cleanText(payload.confidence, 20) || null,
      imageKey: cleanText(payload.imageKey, 220) || null,
      imageType: cleanText(payload.imageType, 80) || null,
      detailsJson: JSON.stringify(payload.details ?? {}).slice(0, 12_000),
      updatedAt: new Date().toISOString(),
    };

    await getDb().insert(nutritionEntries).values(entry).onConflictDoUpdate({
      target: nutritionEntries.id,
      set: {
        loggedAt: entry.loggedAt,
        mealType: entry.mealType,
        name: entry.name,
        description: entry.description,
        calories: entry.calories,
        protein: entry.protein,
        source: entry.source,
        confidence: entry.confidence,
        imageKey: entry.imageKey,
        imageType: entry.imageType,
        detailsJson: entry.detailsJson,
        updatedAt: entry.updatedAt,
      },
    });

    return Response.json({ saved: true, entry: { ...payload, ...entry, meal: entry.mealType } });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = cleanText(new URL(request.url).searchParams.get("id"), 80);
    if (!id) return Response.json({ error: "Måltids-id saknas." }, { status: 400 });

    await getDb()
      .delete(nutritionEntries)
      .where(and(eq(nutritionEntries.id, id), eq(nutritionEntries.owner, ownerFrom(request))));

    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 503 });
  }
}
