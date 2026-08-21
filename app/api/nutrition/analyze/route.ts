import { analyzeFoodDescription, analyzeFoodSearch, FOOD_DATABASE_META } from "../../../lib/food-database";
import { matchSavedRecipe } from "../../../lib/nutrition-matcher";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const separatedSearch = form.has("query");
    const description = String(form.get(separatedSearch ? "query" : "description") ?? "").trim().slice(0, 1_000);
    const amount = String(form.get("amount") ?? "100").trim().slice(0, 20);
    const unit = String(form.get("unit") ?? "g").trim().slice(0, 20);
    if (!description) {
      return Response.json({
        error: "Skriv ett livsmedel, till exempel ‘vaniljkvarg’, och välj mängd och enhet.",
      }, { status: 400 });
    }

    const savedRecipe = matchSavedRecipe(description);
    if (savedRecipe) return Response.json({ estimate: savedRecipe, engine: "saved-recipe" });

    const result = separatedSearch
      ? analyzeFoodSearch(description, amount, unit)
      : analyzeFoodDescription(description);
    if (result.kind === "not-found") {
      return Response.json({
        code: "food_not_found",
        error: `Ingen säker träff hittades för “${result.query}”. Prova produktnamn, varumärke eller ett enklare ord.`,
        database: FOOD_DATABASE_META,
      }, { status: 404 });
    }
    if (result.kind === "choices") {
      return Response.json({ groups: result.groups, engine: "food-database", database: FOOD_DATABASE_META });
    }
    return Response.json({ estimate: result.estimate, engine: "food-database", database: FOOD_DATABASE_META });
  } catch {
    return Response.json({ error: "Sökningen i matdatabasen kunde inte genomföras." }, { status: 500 });
  }
}
