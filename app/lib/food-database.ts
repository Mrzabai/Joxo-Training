import popularDatabaseJson from "../data/popular-fitness-foods.json";
import databaseJson from "../data/swedish-foods.json";

export type FoodAmountUnit = "g" | "kg" | "dl" | "ml" | "st" | "msk" | "tsk" | "portion";

type FoodRecord = {
  id: number;
  name: string;
  group: string | null;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  aliases?: string[];
  brand?: string;
  popular?: boolean;
  basisUnit?: "g" | "ml";
  portionAmount?: number;
  gramsPerDl?: number;
  sourceName?: string;
  sourceUrl?: string;
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
  sourceName?: string;
  sourceUrl?: string;
};

export type FoodCandidate = {
  id: number;
  name: string;
  brand?: string;
  group: string;
  score: number;
  popular: boolean;
  basisUnit: "g" | "ml";
  sourceName: string;
  sourceUrl: string;
  assumptions: string[];
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

type AmountSelection = {
  value: number;
  unit: FoodAmountUnit;
  explicit: boolean;
};

type AmountInfo = {
  basisAmount: number;
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

const popularDatabase = popularDatabaseJson as unknown as {
  version: string;
  description: string;
  foods: FoodRecord[];
};

const GENERIC_ALIASES = new Map<number, string[]>([
  [70, ["keso naturell", "cottage cheese naturell", "grynost"]],
  [3243, ["naturell kvarg", "kvarg naturell", "kvarg 0.2", "mager kvarg"]],
  [6090, ["smaksatt kvarg", "kvarg sötningsmedel", "kvarg med smak"]],
  [702, ["havregryn", "oatmeal", "oats", "gryn havre"]],
  [703, ["fiberhavregryn", "havregryn fiber"]],
  [1170, ["kycklingfilé stekt", "stekt kycklingfilé", "kycklingbröst stekt"]],
  [1173, ["kycklingfilé rå", "rå kycklingfilé", "kycklingbröst rå"]],
  [2205, ["ägg", "kokt ägg", "hönsägg kokt"]],
  [1233, ["stekt ägg", "ägg stekt"]],
  [2515, ["ris kokt", "kokt ris", "basmatiris kokt", "jasminris kokt"]],
  [846, ["pasta kokt", "kokt pasta"]],
  [4458, ["potatis kokt", "kokt potatis"]],
  [5153, ["potatis kokt utan salt"]],
  [951, ["nötfärs 10", "nötfärs rå", "mager nötfärs"]],
  [2101, ["nötfärs stekt", "stekt nötfärs"]],
  [1278, ["tonfisk vatten", "tonfisk på burk", "tonfisk avrunnen"]],
  [1316, ["lax stekt", "stekt lax"]],
  [1255, ["lax rå", "laxfilé rå"]],
  [3765, ["sötpotatis rå"]],
  [3772, ["sötpotatis kokt", "kokt sötpotatis"]],
  [4939, ["broccoli kokt", "kokt broccoli"]],
  [1559, ["jordnötssmör", "peanut butter"]],
  [6903, ["mandeldryck osötad", "mandelmjölk osötad"]],
  [7146, ["grekisk yoghurt 0", "protein yoghurt 0"]],
]);

const officialFoods = database.foods
  .filter((food) => typeof food.kcal === "number" && typeof food.protein === "number")
  .map((food) => ({
    ...food,
    aliases: GENERIC_ALIASES.get(food.id) ?? [],
    popular: GENERIC_ALIASES.has(food.id),
    basisUnit: "g" as const,
    sourceName: `${database.source} ${database.version}`,
    sourceUrl: database.sourceUrl,
  }));

const curatedFoods = popularDatabase.foods
  .filter((food) => typeof food.kcal === "number" && typeof food.protein === "number")
  .map((food) => ({ ...food, popular: true }));

const foods = [...curatedFoods, ...officialFoods];

export const FOOD_DATABASE_META = {
  source: database.source,
  version: database.version,
  basis: database.basis,
  license: database.license,
  sourceUrl: database.sourceUrl,
  count: database.count,
  popularCount: curatedFoods.length,
  popularVersion: popularDatabase.version,
  totalCount: database.count + curatedFoods.length,
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

const UNIT_ALIASES: Record<string, FoodAmountUnit> = {
  g: "g",
  gram: "g",
  kg: "kg",
  dl: "dl",
  ml: "ml",
  st: "st",
  styck: "st",
  stycken: "st",
  msk: "msk",
  matsked: "msk",
  matskedar: "msk",
  tsk: "tsk",
  tesked: "tsk",
  teskedar: "tsk",
  portion: "portion",
  portioner: "portion",
};

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
    .replace(/\b(vanilj|hallon|jordgubb|blabar|citron)kvarg\b/g, "kvarg $1")
    .replace(/\bproteinpudding\b/g, "protein pudding")
    .replace(/\bproteinshake\b/g, "protein shake")
    .replace(/\bproteinyoghurt\b/g, "protein yoghurt")
    .replace(/\bproteinbar\b/g, "protein bar")
    .replace(/\bproteinpulver\b/g, "protein pulver")
    .replace(/\bproteinknacke(?:brod)?\b/g, "protein knackebrod")
    .replace(/\bmandelmjolk\b/g, "mandeldryck")
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

function stripInlineAmount(value: string) {
  return value
    .replace(/(?:^|\s)(\d+(?:[.,]\d+)?|en|ett|två|tva|tre|fyra|fem|sex|sju|åtta|atta|nio|tio|halv(?:a|t)?)\s*(kg|g|gram|dl|ml|st|styck(?:en)?|msk|matsked(?:ar)?|tsk|tesked(?:ar)?|portion(?:er)?)(?=\s|$)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryFrom(value: string) {
  return canonicalize(stripInlineAmount(value))
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

function displayNumber(value: number) {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(round(value));
}

function numericAmount(token: string) {
  const normalized = normalize(token);
  if (NUMBER_WORDS[normalized] !== undefined) return NUMBER_WORDS[normalized];
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function boundedAmount(value: number) {
  return Math.min(100_000, Math.max(0.01, value));
}

function inlineAmountFrom(value: string): AmountSelection | null {
  const match = normalize(value).match(/(?:^|\s)(\d+(?:\.\d+)?|en|ett|tva|tre|fyra|fem|sex|sju|atta|nio|tio|halv(?:a|t)?)\s*(kg|g|gram|dl|ml|st|styck(?:en)?|msk|matsked(?:ar)?|tsk|tesked(?:ar)?|portion(?:er)?)(?:\s|$)/);
  if (!match) return null;
  const amount = numericAmount(match[1]);
  const unit = UNIT_ALIASES[match[2]];
  if (amount === null || !unit) return null;
  return { value: boundedAmount(amount), unit, explicit: true };
}

function amountSelection(value: number | string, unit: string, original?: string): AmountSelection {
  const inline = original ? inlineAmountFrom(original) : null;
  if (inline) return inline;
  const parsedValue = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return {
    value: boundedAmount(Number.isFinite(parsedValue) ? parsedValue : 100),
    unit: UNIT_ALIASES[normalize(unit)] ?? "g",
    explicit: true,
  };
}

function householdWeight(query: string, unit: FoodAmountUnit) {
  if (unit === "st" || unit === "portion") {
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
    if (/\b(?:mjolk|mandeldryck|kvarg|yoghurt|fil)\b/.test(query)) return 100;
  }
  if (unit === "ml") return /olja/.test(query) ? 0.91 : 1;
  return null;
}

function amountForFood(selection: AmountSelection, query: string, food: FoodRecord): AmountInfo {
  const value = selection.value;
  const unit = selection.unit;
  const basisUnit = food.basisUnit ?? "g";

  if (unit === "g") {
    return basisUnit === "g"
      ? { basisAmount: value, label: `${displayNumber(value)} g`, explicit: true }
      : {
          basisAmount: value,
          label: `${displayNumber(value)} g · ca ${displayNumber(value)} ml`,
          explicit: false,
          assumption: "Gram har räknats som samma mängd milliliter för den här drycken.",
        };
  }

  if (unit === "kg") {
    const converted = value * 1_000;
    return basisUnit === "g"
      ? { basisAmount: converted, label: `${displayNumber(value)} kg`, explicit: true }
      : {
          basisAmount: converted,
          label: `${displayNumber(value)} kg · ca ${displayNumber(converted)} ml`,
          explicit: false,
          assumption: "Kilogram har räknats om med antagandet 1 g ≈ 1 ml för den här drycken.",
        };
  }

  if (unit === "ml") {
    if (basisUnit === "ml") return { basisAmount: value, label: `${displayNumber(value)} ml`, explicit: true };
    const grams = value * (food.gramsPerDl ? food.gramsPerDl / 100 : householdWeight(query, "ml") ?? 1);
    return {
      basisAmount: grams,
      label: `${displayNumber(value)} ml · ca ${displayNumber(grams)} g`,
      explicit: false,
      assumption: `${displayNumber(value)} ml har räknats om till cirka ${displayNumber(grams)} g.`,
    };
  }

  if (unit === "dl") {
    if (basisUnit === "ml") {
      return { basisAmount: value * 100, label: `${displayNumber(value)} dl · ${displayNumber(value * 100)} ml`, explicit: true };
    }
    const gramsPerDl = food.gramsPerDl ?? householdWeight(query, "dl") ?? 100;
    const grams = value * gramsPerDl;
    return {
      basisAmount: grams,
      label: `${displayNumber(value)} dl · ca ${displayNumber(grams)} g`,
      explicit: false,
      assumption: `${displayNumber(value)} dl har räknats om till cirka ${displayNumber(grams)} g med produktens eller ett vanligt hushållsmått.`,
    };
  }

  if (unit === "st" || unit === "portion") {
    const each = food.portionAmount ?? householdWeight(query, unit) ?? 100;
    const basisAmount = value * each;
    const unitLabel = unit === "portion" ? (value === 1 ? "portion" : "portioner") : "st";
    const basisLabel = basisUnit === "ml" ? "ml" : "g";
    return {
      basisAmount,
      label: `${displayNumber(value)} ${unitLabel} · ${food.portionAmount ? "" : "ca "}${displayNumber(basisAmount)} ${basisLabel}`,
      explicit: Boolean(food.portionAmount),
      assumption: food.portionAmount
        ? `En ${unit === "portion" ? "portion" : "styckförpackning"} är ${displayNumber(each)} ${basisLabel} enligt produktuppgiften.`
        : `En ${unit === "portion" ? "portion" : "styck"} har antagits väga cirka ${displayNumber(each)} g.`,
    };
  }

  const millilitres = value * (unit === "tsk" ? 5 : 15);
  if (basisUnit === "ml") {
    return {
      basisAmount: millilitres,
      label: `${displayNumber(value)} ${unit} · ${displayNumber(millilitres)} ml`,
      explicit: true,
    };
  }
  const weightFromDl = food.gramsPerDl ? food.gramsPerDl * millilitres / 100 : null;
  const grams = weightFromDl ?? value * (householdWeight(query, unit) ?? (unit === "tsk" ? 5 : 15));
  return {
    basisAmount: grams,
    label: `${displayNumber(value)} ${unit} · ca ${displayNumber(grams)} g`,
    explicit: false,
    assumption: `${displayNumber(value)} ${unit} har räknats om till cirka ${displayNumber(grams)} g med ett hushållsmått.`,
  };
}

function editDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(previous[rightIndex] + 1, current[rightIndex - 1] + 1, substitution);
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function tokenSimilarity(queryToken: string, nameToken: string) {
  if (queryToken === nameToken) return 1;
  if (queryToken.length >= 4 && (nameToken.startsWith(queryToken) || queryToken.startsWith(nameToken))) return 0.82;
  if (queryToken.length < 4 || nameToken.length < 4) return 0;
  const distance = editDistance(queryToken, nameToken);
  const longest = Math.max(queryToken.length, nameToken.length);
  const allowed = longest >= 10 ? 3 : longest >= 6 ? 2 : 1;
  return distance <= allowed ? Math.max(0.58, 1 - distance / longest) : 0;
}

function scorePhrase(query: string, phrase: string) {
  const normalizedPhrase = canonicalize(phrase);
  const compactQuery = query.replace(/\s+/g, "");
  const compactPhrase = normalize(phrase).replace(/\s+/g, "");
  const queryTokens = query.split(" ").filter(Boolean);
  const phraseTokens = normalizedPhrase.split(" ").filter(Boolean);
  if (!queryTokens.length || !phraseTokens.length) return -1_000;

  if (normalizedPhrase !== query && compactQuery.length >= 6 && compactPhrase.length >= 6) {
    const compactDistance = editDistance(compactQuery, compactPhrase);
    const compactAllowed = Math.max(compactQuery.length, compactPhrase.length) >= 10 ? 3 : 2;
    if (compactDistance <= compactAllowed) return 720 - compactDistance * 35;
  }

  let score = 0;
  if (normalizedPhrase === query) score += 1_200;
  else if (normalizedPhrase.startsWith(`${query} `)) score += 520;
  else if (normalizedPhrase.includes(query)) score += 360;
  else if (query.includes(normalizedPhrase) && normalizedPhrase.length >= 4) score += 180;

  const similarities = queryTokens.map((queryToken) => Math.max(...phraseTokens.map((phraseToken) => tokenSimilarity(queryToken, phraseToken))));
  const matched = similarities.filter((similarity) => similarity >= 0.58);
  if (matched.length / queryTokens.length < 0.65) return -1_000;
  score += similarities.reduce((sum, similarity) => sum + similarity * 100, 0);
  score -= Math.max(0, phraseTokens.length - queryTokens.length) * 3;
  return score;
}

function scoreFood(query: string, food: FoodRecord) {
  const nameScore = scorePhrase(query, food.name);
  const aliasScore = Math.max(-1_000, ...(food.aliases ?? []).map((alias) => scorePhrase(query, alias) + 170));
  const popularBoost = food.popular ? 24 : 0;
  return Math.max(nameScore, aliasScore) + popularBoost;
}

function exactFoodMatch(query: string, food: FoodRecord) {
  return [food.name, ...(food.aliases ?? [])].some((term) => canonicalize(term) === query);
}

function candidatesFor(query: string, selection: AmountSelection): FoodCandidate[] {
  return foods
    .map((food) => ({ food, score: scoreFood(query, food) }))
    .filter(({ score }) => score > 40)
    .sort((left, right) => right.score - left.score || Number(Boolean(right.food.popular)) - Number(Boolean(left.food.popular)) || left.food.name.length - right.food.name.length)
    .slice(0, 8)
    .map(({ food, score }) => {
      const amount = amountForFood(selection, query, food);
      const factor = amount.basisAmount / 100;
      const displayName = food.brand ? `${food.brand} ${food.name}` : food.name.trim();
      return {
        id: food.id,
        name: food.name.trim(),
        brand: food.brand,
        group: food.group?.trim() || "Övrigt",
        score,
        popular: Boolean(food.popular),
        basisUnit: food.basisUnit ?? "g",
        sourceName: food.sourceName ?? database.source,
        sourceUrl: food.sourceUrl ?? database.sourceUrl,
        assumptions: amount.assumption ? [amount.assumption] : [],
        per100: {
          calories: food.kcal ?? 0,
          protein: food.protein ?? 0,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
        },
        item: {
          foodId: food.id,
          name: displayName,
          amount: amount.label,
          grams: round(amount.basisAmount),
          calories: Math.round((food.kcal ?? 0) * factor),
          protein: round((food.protein ?? 0) * factor),
          carbs: scaled(food.carbs, factor),
          fat: scaled(food.fat, factor),
          fiber: scaled(food.fiber, factor),
          sourceName: food.sourceName,
          sourceUrl: food.sourceUrl,
        },
      };
    });
}

function groupForSearch(original: string, selection: AmountSelection): FoodMatchGroup | null {
  const query = queryFrom(original);
  if (!query) return null;
  const candidates = candidatesFor(query, selection);
  if (!candidates.length) return null;

  const first = candidates[0];
  const food = foods.find((candidate) => candidate.id === first.id);
  const second = candidates[1];
  const exact = food ? exactFoodMatch(query, food) : false;
  const clearWinner = first.score >= 430 && (!second || first.score - second.score >= 65);
  const selectedId = exact || clearWinner ? first.id : null;
  return {
    query,
    original,
    amount: `${displayNumber(selection.value)} ${selection.unit}`,
    grams: first.item.grams,
    selectedId,
    confidence: selectedId && first.assumptions.length === 0 ? "high" : selectedId ? "medium" : "low",
    assumptions: first.assumptions,
    candidates,
  };
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
  const selectedCandidates = groups.flatMap((group) => {
    const selected = group.candidates.find((candidate) => candidate.id === group.selectedId);
    return selected ? [selected] : [];
  });
  const items = selectedCandidates.map((candidate) => candidate.item);
  const amountAssumptions = selectedCandidates.flatMap((candidate) => candidate.assumptions);
  const usesProductData = selectedCandidates.some((candidate) => candidate.sourceUrl !== database.sourceUrl);
  return {
    title: items.length === 1 ? items[0].name : description.trim().slice(0, 160) || "Måltid",
    calories: items.reduce((sum, item) => sum + item.calories, 0),
    protein: round(items.reduce((sum, item) => sum + item.protein, 0)),
    confidence: groups.every((group) => group.confidence === "high") ? "high" : groups.some((group) => group.confidence === "low") ? "low" : "medium",
    assumptions: [
      ...amountAssumptions,
      usesProductData
        ? `Produktvärden kontrollerade ${FOOD_DATABASE_META.popularVersion}; övriga värden från ${FOOD_DATABASE_META.source} ${FOOD_DATABASE_META.version}.`
        : `${FOOD_DATABASE_META.source} version ${FOOD_DATABASE_META.version}; ursprungliga värden per 100 g.`,
      "Recept och produkter kan ändras; kontrollera förpackningen innan du sparar.",
    ],
    items,
  };
}

export function analyzeFoodSearch(description: string, amount: number | string = 100, unit: string = "g"):
  | { kind: "choices"; groups: FoodMatchGroup[] }
  | { kind: "not-found"; query: string } {
  const selection = amountSelection(amount, unit, description);
  const group = groupForSearch(description, selection);
  if (!group) return { kind: "not-found", query: queryFrom(description) || description };
  return { kind: "choices", groups: [group] };
}

export function analyzeFoodDescription(description: string):
  | { kind: "estimate"; estimate: DatabaseNutritionEstimate }
  | { kind: "choices"; groups: FoodMatchGroup[] }
  | { kind: "not-found"; query: string } {
  const segments = splitDescription(description);
  if (!segments.length) return { kind: "not-found", query: description };

  const groups: FoodMatchGroup[] = [];
  for (const segment of segments) {
    const selection = amountSelection(100, "g", segment);
    const group = groupForSearch(segment, selection);
    if (!group) return { kind: "not-found", query: queryFrom(segment) || segment };
    groups.push(group);
  }

  if (groups.every((group) => group.selectedId !== null)) {
    return { kind: "estimate", estimate: buildEstimate(description, groups) };
  }
  return { kind: "choices", groups };
}
