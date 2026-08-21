import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { userSnapshots } from "../../../db/schema";
import { ownerFrom } from "../../lib/owner";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Okänt fel";
  if (message.includes("does not exist")) {
    return "Databasen håller på att förberedas. Försök igen om en liten stund.";
  }
  if (message.includes("DATABASE_URL")) return "Molnsynkningen är inte ansluten ännu. Appen sparar lokalt på enheten.";
  return message;
}

export async function GET(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return Response.json({ state: null, error: "Enheten kunde inte identifieras." }, { status: 401 });
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(userSnapshots)
      .where(eq(userSnapshots.owner, owner))
      .limit(1);

    return Response.json({ state: row ? JSON.parse(row.stateJson) : null });
  } catch (error) {
    return Response.json({ state: null, error: errorMessage(error) }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return Response.json({ error: "Enheten kunde inte identifieras." }, { status: 401 });
  try {
    const raw = await request.text();
    if (raw.length > 700_000) {
      return Response.json({ error: "För mycket data i samma sparning." }, { status: 413 });
    }
    const payload = JSON.parse(raw) as { state?: unknown };
    if (!payload.state || typeof payload.state !== "object" || Array.isArray(payload.state)) {
      return Response.json({ error: "Ogiltig appdata." }, { status: 400 });
    }

    const stateJson = JSON.stringify(payload.state);
    const now = new Date().toISOString();
    const db = getDb();
    await db
      .insert(userSnapshots)
      .values({ owner, stateJson, updatedAt: now })
      .onConflictDoUpdate({
        target: userSnapshots.owner,
        set: { stateJson, updatedAt: now },
      });

    return Response.json({ saved: true, savedAt: now });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 503 });
  }
}
