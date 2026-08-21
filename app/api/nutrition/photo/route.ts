import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

type RuntimeEnv = {
  BUCKET?: R2Bucket;
};

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function ownerFrom(request: Request) {
  return request.headers.get("oai-authenticated-user-email") ?? "jocke@local";
}

function bucket() {
  const value = (env as unknown as RuntimeEnv).BUCKET;
  if (!value) throw new Error("BUCKET saknas");
  return value;
}

function validKey(value: string | null): value is string {
  return Boolean(value && /^nutrition\/[a-f0-9-]+\.(jpg|png|webp)$/.test(value));
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return Response.json({ error: "Ingen bild valdes." }, { status: 400 });
    if (!allowedTypes[image.type]) return Response.json({ error: "Använd JPEG, PNG eller WebP." }, { status: 415 });
    if (image.size > 6_000_000) return Response.json({ error: "Bilden får vara högst 6 MB." }, { status: 413 });

    const key = `nutrition/${crypto.randomUUID()}.${allowedTypes[image.type]}`;
    await bucket().put(key, await image.arrayBuffer(), {
      httpMetadata: { contentType: image.type },
      customMetadata: { owner: ownerFrom(request), uploadedAt: new Date().toISOString() },
    });

    return Response.json({ key, url: `/api/nutrition/photo?key=${encodeURIComponent(key)}`, type: image.type });
  } catch {
    return Response.json({ error: "Bilden kunde inte sparas just nu." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!validKey(key)) return new Response("Ogiltig bild", { status: 400 });
    const object = await bucket().get(key);
    if (!object || object.customMetadata?.owner !== ownerFrom(request)) return new Response("Bilden hittades inte", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("ETag", object.httpEtag);
    return new Response(object.body, { headers });
  } catch {
    return new Response("Bilden kunde inte hämtas", { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!validKey(key)) return Response.json({ error: "Ogiltig bild." }, { status: 400 });
    const object = await bucket().head(key);
    if (!object || object.customMetadata?.owner !== ownerFrom(request)) return Response.json({ deleted: true });
    await bucket().delete(key);
    return Response.json({ deleted: true });
  } catch {
    return Response.json({ error: "Bilden kunde inte tas bort." }, { status: 503 });
  }
}
