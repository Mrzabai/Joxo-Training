import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { userSnapshots } from "../../../db/schema";

export const dynamic = "force-dynamic";

function ownerFrom(request: Request) {
  return request.headers.get("oai-authenticated-user-email") ?? "jocke@local";
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Okänt fel";
  if (message.includes("no such table")) {
    return "Databasen håller på att förberedas. Försök igen om en liten stund.";
  }
  return message;
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(userSnapshots)
      .where(eq(userSnapshots.owner, ownerFrom(request)))
      .limit(1);

    return Response.json({ state: row ? JSON.parse(row.stateJson) : null });
  } catch (error) {
    return Response.json({ state: null, error: errorMessage(error) }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 700_000) {
      return Response.json({ error: "För mycket data i samma sparning." }, { status: 413 });
    }
    const payload = JSON.parse(raw) as { state?: unknown };
    if (!payload.state || typeof payload.state !== "object" || Array.isArray(payload.state)) {
      return Response.json({ error: "Ogiltig appdata." }, { status: 400 });
    }

    const owner = ownerFrom(request);
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
