import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { nutritionEntries } from "../../../../db/schema";
import { ownerFrom } from "../../../lib/owner";

export const dynamic = "force-dynamic";

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
  const owner = ownerFrom(request);
  if (!owner) return Response.json({ entries: [], error: "Enheten kunde inte identifieras." }, { status: 401 });
  try {
    const requestedLimit = Number(new URL(request.url).searchParams.get("limit"));
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(5000, Math.floor(requestedLimit))
      : 5000;
    const rows = await getDb()
      .select()
      .from(nutritionEntries)
      .where(eq(nutritionEntries.owner, owner))
      .orderBy(desc(nutritionEntries.loggedAt))
      .limit(limit);

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

class EntryInputError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function normalizedEntry(request: Request, owner: string) {
  const raw = await request.text();
  if (raw.length > 30_000) throw new EntryInputError("Måltiden innehåller för mycket data.", 413);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new EntryInputError("Måltidsdatan är ogiltig.", 400);
  }

  const id = cleanText(payload.id, 80) || crypto.randomUUID();
  const name = cleanText(payload.name, 160);
  const mealType = cleanText(payload.meal, 40) || "Mellanmål";
  const loggedAt = cleanText(payload.loggedAt, 40) || new Date().toISOString();
  if (!name) throw new EntryInputError("Måltiden behöver ett namn.", 400);
  if (Number.isNaN(Date.parse(loggedAt))) throw new EntryInputError("Ogiltigt datum.", 400);

  return {
    payload,
    entry: {
      id,
      owner,
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
    },
  };
}

function mutableEntryFields(entry: Awaited<ReturnType<typeof normalizedEntry>>["entry"]) {
  return {
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
  };
}

function saveErrorResponse(error: unknown) {
  if (error instanceof EntryInputError) return Response.json({ error: error.message }, { status: error.status });
  return Response.json({ error: errorMessage(error) }, { status: 503 });
}

export async function POST(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return Response.json({ error: "Enheten kunde inte identifieras." }, { status: 401 });
  try {
    const { payload, entry } = await normalizedEntry(request, owner);

    await getDb().insert(nutritionEntries).values(entry).onConflictDoUpdate({
      target: nutritionEntries.id,
      set: mutableEntryFields(entry),
    });

    return Response.json({ saved: true, entry: { ...payload, ...entry, meal: entry.mealType } });
  } catch (error) {
    return saveErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return Response.json({ error: "Enheten kunde inte identifieras." }, { status: 401 });
  try {
    const { payload, entry } = await normalizedEntry(request, owner);
    const updated = await getDb()
      .update(nutritionEntries)
      .set(mutableEntryFields(entry))
      .where(and(eq(nutritionEntries.id, entry.id), eq(nutritionEntries.owner, owner)))
      .returning({ id: nutritionEntries.id });

    if (!updated.length) return Response.json({ error: "Måltiden finns inte längre i matloggen." }, { status: 404 });
    return Response.json({ saved: true, entry: { ...payload, ...entry, meal: entry.mealType } });
  } catch (error) {
    return saveErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return Response.json({ error: "Enheten kunde inte identifieras." }, { status: 401 });
  try {
    const id = cleanText(new URL(request.url).searchParams.get("id"), 80);
    if (!id) return Response.json({ error: "Måltids-id saknas." }, { status: 400 });

    await getDb()
      .delete(nutritionEntries)
      .where(and(eq(nutritionEntries.id, id), eq(nutritionEntries.owner, owner)));

    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 503 });
  }
}
