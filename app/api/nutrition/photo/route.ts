import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { nutritionPhotos } from "../../../../db/schema";
import { ownerFrom } from "../../../lib/owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function validKey(value: string | null): value is string {
  return Boolean(value && /^nutrition\/[a-f0-9-]+\.(jpg|png|webp)$/.test(value));
}

export async function POST(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return Response.json({ error: "Enheten kunde inte identifieras." }, { status: 401 });

  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return Response.json({ error: "Ingen bild valdes." }, { status: 400 });
    if (!allowedTypes[image.type]) return Response.json({ error: "Använd JPEG, PNG eller WebP." }, { status: 415 });
    if (image.size > 2_500_000) return Response.json({ error: "Bilden blev för stor efter komprimering. Välj en mindre bild." }, { status: 413 });

    const key = `nutrition/${crypto.randomUUID()}.${allowedTypes[image.type]}`;
    const dataBase64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    await getDb().insert(nutritionPhotos).values({
      key,
      owner,
      contentType: image.type,
      dataBase64,
      byteSize: image.size,
    });

    return Response.json({ key, url: `/api/nutrition/photo?key=${encodeURIComponent(key)}`, type: image.type });
  } catch {
    return Response.json({ error: "Bilden kunde inte sparas just nu." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return new Response("Enheten kunde inte identifieras", { status: 401 });

  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!validKey(key)) return new Response("Ogiltig bild", { status: 400 });
    const [photo] = await getDb()
      .select()
      .from(nutritionPhotos)
      .where(and(eq(nutritionPhotos.key, key), eq(nutritionPhotos.owner, owner)))
      .limit(1);
    if (!photo) return new Response("Bilden hittades inte", { status: 404 });

    return new Response(new Uint8Array(Buffer.from(photo.dataBase64, "base64")), {
      headers: {
        "Content-Type": photo.contentType,
        "Content-Length": String(photo.byteSize),
        "Cache-Control": "private, max-age=3600",
        ETag: `"${photo.key}"`,
      },
    });
  } catch {
    return new Response("Bilden kunde inte hämtas", { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return Response.json({ error: "Enheten kunde inte identifieras." }, { status: 401 });

  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!validKey(key)) return Response.json({ error: "Ogiltig bild." }, { status: 400 });
    await getDb()
      .delete(nutritionPhotos)
      .where(and(eq(nutritionPhotos.key, key), eq(nutritionPhotos.owner, owner)));
    return Response.json({ deleted: true });
  } catch {
    return Response.json({ error: "Bilden kunde inte tas bort." }, { status: 503 });
  }
}
