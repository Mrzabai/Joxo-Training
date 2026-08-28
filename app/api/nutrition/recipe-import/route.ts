import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";

type JsonLd = Record<string, unknown>;

function privateIp(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

async function safeUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Receptlänken måste använda https.");
  if (["localhost", "localhost.localdomain"].includes(url.hostname.toLowerCase())) throw new Error("Den adressen kan inte hämtas.");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => privateIp(entry.address))) throw new Error("Den adressen kan inte hämtas.");
  return url;
}

async function fetchHtml(initial: string) {
  let url = await safeUrl(initial);
  for (let redirects = 0; redirects < 4; redirects += 1) {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "JoxoTraining/1.0 recipe importer" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Receptsidan skickade en ogiltig omdirigering.");
      url = await safeUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error("Receptsidan kunde inte hämtas.");
    if (!(response.headers.get("content-type") ?? "").includes("text/html")) throw new Error("Länken verkar inte gå till en receptsida.");
    const announcedSize = Number(response.headers.get("content-length") ?? 0);
    if (announcedSize > 1_500_000) throw new Error("Receptsidan är för stor för import.");
    const html = await response.text();
    if (html.length > 1_500_000) throw new Error("Receptsidan är för stor för import.");
    return { html, finalUrl: url.toString() };
  }
  throw new Error("Receptsidan omdirigerade för många gånger.");
}

function hasRecipeType(value: unknown) {
  const types = Array.isArray(value) ? value : [value];
  return types.some((type) => typeof type === "string" && type.toLowerCase().endsWith("recipe"));
}

function findRecipe(value: unknown): JsonLd | null {
  if (Array.isArray(value)) {
    for (const item of value) { const found = findRecipe(item); if (found) return found; }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as JsonLd;
  if (hasRecipeType(record["@type"])) return record;
  return findRecipe(record["@graph"]);
}

function numeric(value: unknown) {
  const match = String(value ?? "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function clean(value: unknown, max = 200) {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function GET(request: Request) {
  const requestedUrl = new URL(request.url).searchParams.get("url") ?? "";
  try {
    const { html, finalUrl } = await fetchHtml(requestedUrl);
    const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let recipe: JsonLd | null = null;
    for (const script of scripts) {
      try { recipe = findRecipe(JSON.parse(script[1])); } catch { recipe = null; }
      if (recipe) break;
    }
    if (!recipe) return Response.json({ error: "Sidan innehåller ingen läsbar strukturerad receptdata. Klistra i stället in ingredienserna eller logga manuellt." }, { status: 422 });
    const nutrition = recipe.nutrition && typeof recipe.nutrition === "object" ? recipe.nutrition as JsonLd : {};
    const ingredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient.map((item) => clean(item, 160)).filter(Boolean).slice(0, 50) : [];
    const calories = Math.max(0, Math.round(numeric(nutrition.calories)));
    const protein = Math.max(0, Math.round(numeric(nutrition.proteinContent) * 10) / 10);
    const title = clean(recipe.name, 160) || "Importerat recept";
    return Response.json({ estimate: {
      title,
      calories,
      protein,
      confidence: calories || protein ? "medium" : "low",
      assumptions: [
        clean(recipe.recipeYield) ? `Receptsidan anger mängden ${clean(recipe.recipeYield)}.` : "Kontrollera hur många portioner näringsvärdet gäller.",
        calories || protein ? "Näringsvärdena är lästa från receptsidans strukturerade data." : "Receptsidan saknade kcal eller protein; fyll i värdena före sparning.",
        `Importerad från ${new URL(finalUrl).hostname}.`,
      ],
      items: ingredients.map((ingredient) => ({ name: ingredient, amount: "enligt recept", calories: 0, protein: 0 })),
    } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Receptet kunde inte importeras." }, { status: 400 });
  }
}
