import databaseJson from "../data/swedish-foods.json";

type FoodRecord = {
  id: number;
  name: string;
  group: string | null;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
};

type NutritionItem = {
  foodId: number;
  name: string;
  amount: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
};

export type FoodCandidate = {
  id: number;
  name: string;
  group: string;
  score: number;
  per100: {
    calories: number;
    protein: number;
    carbs: number | null;
    fat: number | null;
    fiber: number | null;
  };
  item: NutritionItem;
};

export type FoodMatchGroup = {
  query: string;
  original: string;
  amount: string;
  grams: number;
  selectedId: number | null;
  confidence: "low" | "medium" | "high";
  assumptions: string[];
  candidates: FoodCandidate[];
};

export type DatabaseNutritionEstimate = {
  title: string;
  calories: number;
  protein: number;
  confidence: "low" | "medium" | "high";
  assumptions: string[];
  items: NutritionItem[];
};

type AmountInfo = {
  grams: number;
  label: string;
  explicit: boolean;
  assumption?: string;
};

const database = databaseJson as unknown as {
  source: string;
  version: string;
  basis: string;
  license: string;
  sourceUrl: string;
  count: number;
  foods: FoodRecord[];
};
const foods = database.foods.filter((food) => typeof food.kcal === "number" && typeof food.protein === "number");

export const FOOD_DATABASE_META = {
  source: database.source,
  version: database.version,
  basis: database.basis,
  license: database.license,
  sourceUrl: database.sourceUrl,
  count: database.count,
} as const;

const NUMBER_WORDS: Record<string, number> = {
  en: 1,
  ett: 1,
  tva: 2,
  tre: 3,
  fyra: 4,
  fem: 5,
  sex: 6,
  sju: 7,
  atta: 8,
  nio: 9,
  tio: 10,
  halv: 0.5,
  halva: 0.5,
  halvt: 0.5,
};

const STOP_WORDS = new Set([
  "at",
  "jag",
  "cirka",
  "ca",
  "ungefar",
  "typ",
  "gram",
  "g",
  "kg",
  "st",
  "styck",
  "stycken",
  "dl",
  "ml",
  "msk",
  "tsk",
  "portion",
  "portioner",
  ...Object.keys(NUMBER_WORDS),
]);

function normalize(value: string) {
  return value
    .toLocaleLowerCase("sv-SE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, ".")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();
}

function canonicalize(value: string) {
  return normalize(value)
    .replace(/\bkycklingfile(?:er|n)?\b/g, "kyckling brostfile")
    .replace(/\bpotatisar\b/g, "potatis")
    .replace(/\bbananer\b/g, "banan")
    .replace(/\bapplen\b/g, "apple")
    .replace(/\btomater\b/g, "tomat")
    .replace(/\bagg(?:en)?\b/g, "agg")
    .replace(/\butan\b/g, "u")
    .replace(/\bekologisk(?:a|t)?\b/g, "eko")
    .replace(/\s+/g, " ")
    .trim();
}

function queryFrom(value: string) {
  return canonicalize(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token) && !/^\d+(?:\.\d+)?$/.test(token))
    .join(" ");
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function scaled(value: number | null, factor: number) {
  return typeof value === "number" ? round(value * factor) : null;
}

function householdWeight(query: string, unit: string) {
  if (unit === "st" || unit === "styck" || unit === "stycken") {
    if (/\bagg\b/.test(query)) return 55;
    if (/\bbanan\b/.test(query)) return 120;
    if (/\bapple\b/.test(query)) return 150;
    if (/\bpotatis\b/.test(query)) return 150;
    if (/\bavokado\b/.test(query)) return 140;
    if (/\btomat\b/.test(query)) return 100;
    if (/\bknackebrod\b/.test(query)) return 12;
    if (/\bbrod\b/.test(query)) return 35;
  }
  if (unit === "msk" || unit === "tsk") {
    const tablespoon = /olja/.test(query) ? 13.5 : /\bsmor\b/.test(query) ? 14 : 15;
    return unit === "tsk" ? tablespoon / 3 : tablespoon;
  }
  if (unit === "dl") {
    if (/\bhavregryn\b/.test(query)) return 35;
    if (/\b(?:ris|bulgur|couscous)\b/.test(query)) return 85;
    if (/\bmjol\b/.test(query)) return 60;
    if (/\bsocker\b/.test(query)) return 85;
    if (/\b(?:bar|hallon|blabar|jordgubb)\b/.test(query)) return 60;
    if (/\b(?:mjolk|kvarg|yoghurt|fil)\b/.test(query)) return 100;
  }
  if (unit === "ml") return /olja/.test(query) ? 0.91 : 1;
  return null;
}

function numericAmount(token: string) {
  if (NUMBER_WORDS[token] !== undefined) return NUMBER_WORDS[token];
  const number = Number(token.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function amountFrom(segment: string, query: string): AmountInfo {
  const normalized = canonicalize(segment);
  const metric = normalized.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(kg|g|gram)(?:\s|$)/);
  if (metric) {
    const amount = Math.max(0, Number(metric[1]));
    const grams = metric[2] === "kg" ? amount * 1_000 : amount;
    return { grams, label: `${round(grams)} g`, explicit: true };
  }

  const household = normalized.match(/(?:^|\s)(\d+(?:\.\d+)?|en|ett|tva|tre|fyra|fem|sex|sju|atta|nio|tio|halv(?:a|t)?)\s*(st|styck|stycken|dl|ml|msk|tsk)(?:\s|$)/);
  if (household) {
    const amount = numericAmount(household[1]);
    const unitWeight = householdWeight(query, household[2]);
    if (amount !== null && unitWeight !== null) {
      const grams = amount * unitWeight;
      return {
        grams,
        label: `${round(amount)} ${household[2]} · ca ${round(grams)} g`,
        explicit: false,
        assumption: `${round(amount)} ${household[2]} har räknats om till cirka ${round(grams)} g med ett standardmått.`,
      };
    }
  }

  const leadingCount = normalized.match(/^(\d+(?:\.\d+)?|en|ett|tva|tre|fyra|fem|sex|sju|atta|nio|tio|halv(?:a|t)?)\b/);
  if (leadingCount) {
    const amount = numericAmount(leadingCount[1]);
    const unitWeight = householdWeight(query, "st");
    if (amount !== null && unitWeight !== null) {
      const grams = amount * unitWeight;
      return {
        grams,
        label: `${round(amount)} st · ca ${round(grams)} g`,
        explicit: false,
        assumption: `${round(amount)} stycken har räknats om till cirka ${round(grams)} g med en standardstorlek.`,
      };
    }
  }

  return {
    grams: 100,
    label: "100 g",
    explicit: false,
    assumption: "Ingen säker vikt hittades, därför visas värdet för 100 g. Ändra sökningen till exempelvis ‘200 g’ för rätt mängd.",
  };
}

function scoreFood(query: string, food: FoodRecord) {
  const name = canonicalize(food.name);
  const queryTokens = query.split(" ").filter(Boolean);
  const nameTokens = name.split(" ").filter(Boolean);
  if (!queryTokens.length) return -1_000;

  let score = 0;
  if (name === query) score += 1_000;
  else if (name.startsWith(`${query} `)) score += 420;
  else if (name.includes(query)) score += 260;

  let matched = 0;
  for (const queryToken of queryTokens) {
    if (nameTokens.includes(queryToken)) {
      score += 70;
      matched += 1;
      continue;
    }
    if (queryToken.length >= 4 && nameTokens.some((nameToken) => nameToken.startsWith(queryToken) || queryToken.startsWith(nameToken))) {
      score += 28;
      matched += 0.7;
      continue;
    }
    score -= 90;
  }
  if (matched / queryTokens.length < 0.65) return -1_000;
  score -= Math.max(0, nameTokens.length - queryTokens.length) * 2;
  return score;
}

function candidatesFor(query: string, amount: AmountInfo): FoodCandidate[] {
  const factor = amount.grams / 100;
  return foods
    .map((food) => ({ food, score: scoreFood(query, food) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.food.name.length - right.food.name.length)
    .slice(0, 6)
    .map(({ food, score }) => {
      const calories = Math.round((food.kcal ?? 0) * factor);
      const protein = round((food.protein ?? 0) * factor);
      return {
        id: food.id,
        name: food.name.trim(),
        group: food.group?.trim() || "Övrigt",
        score,
        per100: {
          calories: food.kcal ?? 0,
          protein: food.protein ?? 0,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
        },
        item: {
          foodId: food.id,
          name: food.name.trim(),
          amount: amount.label,
          grams: round(amount.grams),
          calories,
          protein,
          carbs: scaled(food.carbs, factor),
          fat: scaled(food.fat, factor),
          fiber: scaled(food.fiber, factor),
        },
      };
    });
}

function splitDescription(description: string) {
  return description
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+och\s+(?=(?:cirka\s+|ca\s+)?(?:\d|en\b|ett\b|två\b|tre\b|fyra\b))/gi, ";")
    .split(/\n|;|,(?!\d)|\s+\+\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function buildEstimate(description: string, groups: FoodMatchGroup[]): DatabaseNutritionEstimate {
  const items = groups.flatMap((group) => {
    const selected = group.candidates.find((candidate) => candidate.id === group.selectedId);
    return selected ? [selected.item] : [];
  });
  const amountAssumptions = groups.flatMap((group) => group.assumptions);
  return {
    title: items.length === 1 ? items[0].name : description.trim().slice(0, 160) || "Måltid",
    calories: items.reduce((sum, item) => sum + item.calories, 0),
    protein: round(items.reduce((sum, item) => sum + item.protein, 0)),
    confidence: groups.every((group) => group.confidence === "high") ? "high" : groups.some((group) => group.confidence === "low") ? "low" : "medium",
    assumptions: [
      ...amountAssumptions,
      `${FOOD_DATABASE_META.source} version ${FOOD_DATABASE_META.version}; ursprungliga värden per 100 g.`,
      "Kontrollera tillagningssätt, produkt och ätbar mängd innan du sparar.",
    ],
    items,
  };
}

export function analyzeFoodDescription(description: string):
  | { kind: "estimate"; estimate: DatabaseNutritionEstimate }
  | { kind: "choices"; groups: FoodMatchGroup[] }
  | { kind: "not-found"; query: string } {
  const segments = splitDescription(description);
  if (!segments.length) return { kind: "not-found", query: description };

  const groups: FoodMatchGroup[] = [];
  for (const segment of segments) {
    const query = queryFrom(segment);
    if (!query) return { kind: "not-found", query: segment };
    const amount = amountFrom(segment, query);
    const candidates = candidatesFor(query, amount);
    if (!candidates.length) return { kind: "not-found", query: segment };

    const first = candidates[0];
    const second = candidates[1];
    const exact = canonicalize(first.name) === query;
    const queryTokens = query.split(" ").length;
    const clearWinner = queryTokens >= 2 && first.score >= 190 && (!second || first.score - second.score >= 35);
    const selectedId = exact || clearWinner ? first.id : null;
    groups.push({
      query,
      original: segment,
      amount: amount.label,
      grams: round(amount.grams),
      selectedId,
      confidence: selectedId && amount.explicit ? "high" : selectedId ? "medium" : "low",
      assumptions: amount.assumption ? [amount.assumption] : [],
      candidates,
    });
  }

  if (groups.every((group) => group.selectedId !== null)) {
    return { kind: "estimate", estimate: buildEstimate(description, groups) };
  }
  return { kind: "choices", groups };
}
