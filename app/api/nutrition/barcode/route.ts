export const runtime = "nodejs";

type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
};

function numberFrom(value: number | string | undefined) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!/^\d{7,14}$/.test(code)) return Response.json({ error: "Streckkoden ska innehålla 7–14 siffror." }, { status: 400 });

  try {
    const fields = "code,product_name,brands,serving_size,nutriments";
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`, {
      headers: { "User-Agent": "JoxoTraining/1.0 (https://joxo-training.vercel.app)" },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) throw new Error("Tjänsten svarade inte.");
    const body = await response.json() as { status?: number; product?: OpenFoodFactsProduct };
    if (body.status !== 1 || !body.product) return Response.json({ error: "Produkten hittades inte i Open Food Facts. Fyll i den manuellt." }, { status: 404 });
    const product = body.product;
    const nutrients = product.nutriments ?? {};
    const calories = Math.round(numberFrom(nutrients["energy-kcal_100g"]));
    const protein = Math.round(numberFrom(nutrients.proteins_100g) * 10) / 10;
    const title = [product.product_name, product.brands].filter(Boolean).join(" · ").slice(0, 160) || `Produkt ${code}`;
    return Response.json({
      estimate: {
        title,
        calories,
        protein,
        confidence: calories || protein ? "medium" : "low",
        assumptions: [
          "Näringsvärdena gäller 100 g eller 100 ml om inget annat anges.",
          product.serving_size ? `Förpackningen anger portionsstorleken ${product.serving_size}.` : "Kontrollera mängden mot förpackningen.",
          "Produktuppgifter kommer från Open Food Facts och kan vara användarinmatade.",
        ],
        items: [{
          name: title,
          amount: "100 g/ml",
          calories,
          protein,
          carbs: Math.round(numberFrom(nutrients.carbohydrates_100g) * 10) / 10,
          fat: Math.round(numberFrom(nutrients.fat_100g) * 10) / 10,
          fiber: Math.round(numberFrom(nutrients.fiber_100g) * 10) / 10,
          sourceName: "Open Food Facts",
          sourceUrl: `https://world.openfoodfacts.org/product/${code}`,
        }],
      },
    });
  } catch {
    return Response.json({ error: "Streckkodstjänsten är inte tillgänglig just nu. Fyll i produkten manuellt." }, { status: 503 });
  }
}
