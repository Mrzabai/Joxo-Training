import { RECIPES } from "./recipes";

export type LocalNutritionEstimate = {
  title: string;
  calories: number;
  protein: number;
  confidence: "high";
  assumptions: string[];
  items: Array<{ name: string; amount: string; calories: number; protein: number }>;
};

const aliases: Record<string, string[]> = {
  "carnivore-chips": ["carnivore chips", "bellas chips", "protein chips"],
  ostkaka: ["ostkaka", "ostkaka matilda"],
  "protein-matmuffin": ["protein matmuffin", "proteinmuffin", "matmuffin", "muffin 19april"],
  rakpizza: ["rakpizza", "rak pizza", "rakpizzan", "pizza med rakor"],
  "grot-joxo": ["grot a la joxo", "joxo grot", "joxogrot"],
  "overnight-oats-blabar": ["overnight oats", "overnight oat", "overnight oats med blabar"],
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("sv-SE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function amountFrom(description: string, basis: "serving" | "100g", fallback: number) {
  const normalized = description
    .toLocaleLowerCase("sv-SE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, ".")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();
  if (basis === "100g") {
    const grams = normalized.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:g|gram)(?:\s|$)/);
    return grams ? Math.max(0, Number(grams[1])) : fallback;
  }
  if (/\bhalv(?:a|t)?\b/.test(normalized)) return 0.5;
  const portions = normalized.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:portion|portioner|port)(?:\s|$)/);
  return portions ? Math.max(0, Number(portions[1])) : fallback;
}

export function matchSavedRecipe(description: string): LocalNutritionEstimate | null {
  const query = normalize(description);
  if (query.length < 4) return null;

  const recipe = RECIPES.find((candidate) => {
    const name = normalize(candidate.name);
    const names = [name, ...(aliases[candidate.id] ?? [])];
    return names.some((alias) => query.includes(alias) || (query.length >= 6 && alias.includes(query)));
  });
  if (!recipe) return null;

  const amount = amountFrom(description, recipe.nutrition.basis, recipe.nutrition.defaultAmount);
  const factor = recipe.nutrition.basis === "100g" ? amount / 100 : amount;
  const calories = Math.round(recipe.nutrition.calories * factor);
  const protein = Math.round(recipe.nutrition.protein * factor * 10) / 10;
  const unit = recipe.nutrition.unit === "portioner" && amount === 1 ? "portion" : recipe.nutrition.unit;
  const amountLabel = `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(amount)} ${unit}`;

  return {
    title: recipe.name,
    calories,
    protein,
    confidence: "high",
    assumptions: [
      `Matchat mot ditt sparade recept: ${amountLabel}.`,
      recipe.nutrition.note,
    ],
    items: [{ name: recipe.name, amount: amountLabel, calories, protein }],
  };
}
