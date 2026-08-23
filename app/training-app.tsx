"use client";

import Image from "next/image";
import {
  Activity,
  Apple,
  ArrowRight,
  BarChart3,
  Brain,
  BookOpen,
  Camera,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Cloud,
  CloudOff,
  Database,
  Dumbbell,
  Flame,
  Gauge,
  HeartPulse,
  Home,
  ImagePlus,
  Info,
  Lightbulb,
  LoaderCircle,
  Minus,
  Moon,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Trophy,
  UserRound,
  Utensils,
  Waves,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PROGRAM, getExerciseAdvice, type Exercise, type WorkoutDay } from "./lib/program";
import { RECIPES, type Recipe } from "./lib/recipes";

type TabId = "today" | "plan" | "workout" | "nutrition" | "progress" | "profile";

type SetEntry = {
  weight: number | null;
  reps: number;
  rpe: number;
  done: boolean;
  pain: boolean;
};

type HistoryEntry = {
  id: string;
  passId: string;
  name: string;
  date: string;
  duration: number;
  volume: number;
  completedSets: number;
  prCount: number;
};

type FoodEntry = {
  id: string;
  name: string;
  meal: string;
  calories: number;
  protein: number;
  loggedAt?: string;
  source?: "manual" | "ai-text" | "ai-image" | "recipe" | "database";
  confidence?: "low" | "medium" | "high" | null;
  description?: string;
  imageKey?: string | null;
  imageType?: string | null;
  details?: {
    assumptions?: string[];
    items?: NutritionItem[];
    recipeId?: string;
    amount?: number;
    unit?: string;
    daySummary?: boolean;
  };
};

type NutritionItem = {
  foodId?: number;
  name: string;
  amount: string;
  quantity?: number;
  unit?: string;
  grams?: number;
  calories: number;
  protein: number;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sourceName?: string;
  sourceUrl?: string;
};

type NutritionEstimate = {
  title: string;
  calories: number;
  protein: number;
  confidence: "low" | "medium" | "high";
  assumptions: string[];
  items: NutritionItem[];
};

type FoodCandidate = {
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

type FoodMatchGroup = {
  query: string;
  original: string;
  amount: string;
  grams: number;
  selectedId: number | null;
  confidence: "low" | "medium" | "high";
  assumptions: string[];
  candidates: FoodCandidate[];
};

type NutritionEngine = "manual" | "saved-recipe" | "food-database";

type NutritionDaySummary = {
  date: string;
  calories: number;
  protein: number;
  entryCount: number;
};

type EditableNutritionItem = NutritionItem & {
  editorId: string;
  quantityText: string;
  unitValue: string;
};

type BulkMacroParseResult = {
  items: NutritionItem[];
  ignoredLines: string[];
};

type BulkDaySummaryRow = {
  date: string;
  calories: number;
  protein: number;
};

type BulkDayParseResult = {
  rows: BulkDaySummaryRow[];
  ignoredLines: string[];
};

const QUICK_FOODS = ["Vaniljkvarg", "Lågkalori hallonsylt", "Kycklingfilé", "Havregryn", "Ägg", "KESO", "Wasa Protein+", "ProPud", "Barebells"];

type PersistedState = {
  theme: "dark" | "light";
  nextPassId: string;
  activePassId: string | null;
  sessionStartedAt: string | null;
  logs: Record<string, SetEntry[]>;
  history: HistoryEntry[];
  readiness: {
    sleep: number;
    energy: number;
    soreness: number;
    motivation: number;
    pain: boolean;
  };
  nutrition: {
    calorieTarget: number;
    proteinTarget: number;
    waterMl: number;
    entries: FoodEntry[];
  };
  profile: {
    name: string;
    birthDate: string;
    heightCm: number;
    weightKg: number;
    goal: string;
    weeklyGoal: number;
  };
  weightHistory: Array<{ date: string; weight: number }>;
};

type Summary = {
  name: string;
  duration: number;
  volume: number;
  sets: number;
};

const initialState: PersistedState = {
  theme: "dark",
  nextPassId: "lower-a",
  activePassId: null,
  sessionStartedAt: null,
  logs: {},
  history: [],
  readiness: { sleep: 7, energy: 4, soreness: 2, motivation: 4, pain: false },
  nutrition: { calorieTarget: 2500, proteinTarget: 180, waterMl: 0, entries: [] },
  profile: {
    name: "Jocke",
    birthDate: "1988-04-08",
    heightCm: 190,
    weightKg: 105,
    goal: "Starkare och mer muskler",
    weeklyGoal: 4,
  },
  weightHistory: [{ date: "2026-08-20", weight: 105 }],
};

const navItems: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: "today", label: "Idag", icon: Home },
  { id: "plan", label: "Schema", icon: CalendarDays },
  { id: "workout", label: "Träna", icon: Dumbbell },
  { id: "nutrition", label: "Mat", icon: Apple },
  { id: "progress", label: "Framsteg", icon: BarChart3 },
  { id: "profile", label: "Profil", icon: UserRound },
];

const weekdayLabels = ["M", "T", "O", "T", "F", "L", "S"];
const STORAGE_KEY = "joxo-training-offline-v1";
const FOOD_STORAGE_KEY = "joxo-food-log-v2";
const THEME_STORAGE_KEY = "joxo-theme";
const OWNER_STORAGE_KEY = "joxo-owner-token-v1";
const OWNER_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ensureOwnerToken() {
  let token = window.localStorage.getItem(OWNER_STORAGE_KEY);
  if (!token || !OWNER_TOKEN_PATTERN.test(token)) {
    token = crypto.randomUUID();
    window.localStorage.setItem(OWNER_STORAGE_KEY, token);
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `joxo_owner=${encodeURIComponent(token)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  return token;
}

function mergeState(saved: Partial<PersistedState>): PersistedState {
  return {
    theme: saved.theme === "light" ? "light" : "dark",
    nextPassId: saved.nextPassId ?? initialState.nextPassId,
    activePassId: saved.activePassId ?? initialState.activePassId,
    sessionStartedAt: saved.sessionStartedAt ?? initialState.sessionStartedAt,
    readiness: { ...initialState.readiness, ...saved.readiness },
    nutrition: { ...initialState.nutrition, ...saved.nutrition },
    profile: { ...initialState.profile, ...saved.profile },
    logs: saved.logs ?? {},
    history: saved.history ?? [],
    weightHistory: saved.weightHistory?.length ? saved.weightHistory : initialState.weightHistory,
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(value);
}

function formatClock(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function createSets(exercise: Exercise): SetEntry[] {
  return Array.from({ length: exercise.sets }, () => ({
    weight: exercise.weight,
    reps: exercise.startReps,
    rpe: 8,
    done: false,
    pain: false,
  }));
}

function totalNutrition(entries: FoodEntry[]) {
  return entries.reduce(
    (sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein }),
    { calories: 0, protein: 0 },
  );
}

function stockholmDateKey(value: string | Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function entryDate(entry: FoodEntry, fallback: string) {
  return entry.loggedAt ? stockholmDateKey(entry.loggedAt) : fallback;
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function shiftMonth(month: string, months: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year, monthNumber - 1 + months, 1, 12));
  return value.toISOString().slice(0, 7);
}

function calendarDates(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1, 12)).getUTCDay();
  const leadingDays = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0, 12)).getUTCDate();
  return [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`),
  ];
}

function nutritionDaySummaries(entries: FoodEntry[], fallback: string): NutritionDaySummary[] {
  const summaries = new Map<string, NutritionDaySummary>();
  entries.forEach((entry) => {
    const date = entryDate(entry, fallback);
    const current = summaries.get(date) ?? { date, calories: 0, protein: 0, entryCount: 0 };
    summaries.set(date, {
      date,
      calories: current.calories + entry.calories,
      protein: Math.round((current.protein + entry.protein) * 10) / 10,
      entryCount: current.entryCount + 1,
    });
  });
  return [...summaries.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function nutritionDateLabel(date: string, todayKey: string, long = false) {
  if (date === todayKey) return "Idag";
  return new Intl.DateTimeFormat("sv-SE", long
    ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    : { day: "numeric", month: "short" })
    .format(new Date(`${date}T12:00:00.000Z`));
}

function nutritionDifference(value: number, unit: string) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${formatNumber(rounded)} ${unit}`;
}

function NutritionCalendar({
  month,
  selectedDate,
  todayKey,
  savedDays,
  onMonthChange,
  onSelect,
  onClose,
}: {
  month: string;
  selectedDate: string;
  todayKey: string;
  savedDays: NutritionDaySummary[];
  onMonthChange: (month: string) => void;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const monthDates = calendarDates(month);
  const savedByDate = new Map(savedDays.map((day) => [day.date, day]));
  const monthLabel = new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric" })
    .format(new Date(`${month}-01T12:00:00.000Z`));

  return (
    <div className="nutrition-calendar" role="dialog" aria-modal="false" aria-label="Välj en dag för matloggen">
      <div className="nutrition-calendar-head">
        <button type="button" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Föregående månad"><ChevronLeft size={17} /></button>
        <strong>{monthLabel}</strong>
        <button type="button" disabled={month >= todayKey.slice(0, 7)} onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Nästa månad"><ChevronRight size={17} /></button>
      </div>
      <div className="nutrition-calendar-weekdays" aria-hidden="true">
        {weekdayLabels.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}
      </div>
      <div className="nutrition-calendar-grid">
        {monthDates.map((date, index) => {
          if (!date) return <span className="empty" key={`empty-${index}`} />;
          const summary = savedByDate.get(date);
          const isFuture = date > todayKey;
          const isSelected = date === selectedDate;
          return (
            <button
              className={`${summary ? "has-log " : ""}${isSelected ? "active" : ""}`.trim()}
              type="button"
              key={date}
              disabled={isFuture}
              aria-label={`${nutritionDateLabel(date, todayKey, true)}${summary ? `, ${summary.entryCount} loggade ${summary.entryCount === 1 ? "måltid" : "måltider"}` : ", ingen mat loggad"}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(date)}
            >
              <span>{Number(date.slice(-2))}</span>
              {summary && <i aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div className="nutrition-calendar-footer">
        <span><i /> Dagar med sparade loggar</span>
        <div><button type="button" onClick={() => onSelect(todayKey)}>Idag</button><button type="button" onClick={onClose}>Stäng</button></div>
      </div>
    </div>
  );
}

const SWEDISH_MONTHS: Record<string, number> = {
  jan: 1, januari: 1,
  feb: 2, februari: 2,
  mar: 3, mars: 3,
  apr: 4, april: 4,
  maj: 5,
  jun: 6, juni: 6,
  jul: 7, juli: 7,
  aug: 8, augusti: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function localizedNumber(value: string) {
  const compact = value.replace(/[\s\u00a0\u202f]/g, "");
  if (compact.includes(",")) return Number(compact.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(?:\.\d{3})+$/.test(compact)) return Number(compact.replace(/\./g, ""));
  return Number(compact);
}

function validDateKey(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

function parseBulkDaySummary(value: string, todayKey: string): BulkDayParseResult {
  const parsedByDate = new Map<string, BulkDaySummaryRow>();
  const ignoredLines: string[] = [];
  const todayYear = Number(todayKey.slice(0, 4));
  const monthNames = Object.keys(SWEDISH_MONTHS).sort((a, b) => b.length - a.length).join("|");

  value.replace(/\r/g, "").split("\n").forEach((rawLine) => {
    const line = rawLine
      .replace(/\*\*|__|`/g, "")
      .replace(/^\s*[-–—•▪︎◦]+\s*/, "")
      .replace(/\|/g, " ")
      .replace(/[\u00a0\u202f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!line || /^[-–—\s]+$/.test(line) || (/datum/i.test(line) && /(kalor|kcal|protein)/i.test(line))) return;

    let date: string | null = null;
    const isoDate = line.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    const namedDate = line.match(new RegExp(`^(\\d{1,2})\\s+(${monthNames})\\.?(?:\\s*,?\\s*(\\d{4}))?`, "i"));
    const numericDate = line.match(/^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/);

    if (isoDate) {
      date = validDateKey(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]));
    } else if (namedDate || numericDate) {
      const day = Number((namedDate ?? numericDate)?.[1]);
      const month = namedDate
        ? SWEDISH_MONTHS[namedDate[2].toLocaleLowerCase("sv-SE").replace(/\.$/, "")]
        : Number(numericDate?.[2]);
      const suppliedYear = (namedDate ?? numericDate)?.[3];
      let year = suppliedYear ? Number(suppliedYear) : todayYear;
      if (year < 100) year += 2000;
      date = validDateKey(year, month, day);
      if (date && !suppliedYear && date > todayKey) date = validDateKey(year - 1, month, day);
    }

    const calorieMatch = line.match(/(\d[\d\s.,]*)\s*(?:kcal|kalorier?)\b/i);
    const proteinMatch = line.match(/(\d[\d\s.,]*)\s*g(?:ram)?(?:\s*protein)?\b/i);
    const calories = calorieMatch ? localizedNumber(calorieMatch[1]) : Number.NaN;
    const protein = proteinMatch ? localizedNumber(proteinMatch[1]) : Number.NaN;

    if (!date || date > todayKey || !Number.isFinite(calories) || !Number.isFinite(protein)) {
      ignoredLines.push(line);
      return;
    }

    parsedByDate.set(date, {
      date,
      calories: Math.max(0, Math.round(calories)),
      protein: Math.max(0, Math.round(protein * 10) / 10),
    });
  });

  return { rows: [...parsedByDate.values()].sort((a, b) => a.date.localeCompare(b.date)), ignoredLines };
}

function parseBulkMacroText(value: string): BulkMacroParseResult {
  const items: NutritionItem[] = [];
  const ignoredLines: string[] = [];

  value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\*\*|__|`/g, "").replace(/^\s*[-–—•▪︎◦]+\s*/, "").trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const calorieMatch = line.match(/(\d+(?:[.,]\d+)?)\s*kcal\b/i);
      const proteinMatch = line.match(/(\d+(?:[.,]\d+)?)\s*g(?:ram)?\s*(?:protein|prot\.?)(?:\b|$)/i);
      if (!calorieMatch || !proteinMatch) {
        ignoredLines.push(line);
        return;
      }

      const macroStart = Math.min(calorieMatch.index ?? line.length, proteinMatch.index ?? line.length);
      const itemLabel = line
        .slice(0, macroStart)
        .replace(/(?:\s*[:;,–—-]?\s*)?ca\.?\s*$/i, "")
        .replace(/[\s:;,–—-]+$/g, "")
        .trim();
      const amountMatch = itemLabel.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|dl|ml|st(?:yck)?|portion(?:er)?|msk|tsk)\s+(.+)$/i);
      const quantityText = amountMatch?.[1]?.replace(",", ".");
      const quantity = quantityText ? Number(quantityText) : undefined;
      const rawUnit = amountMatch?.[2]?.toLowerCase();
      const unit = rawUnit?.startsWith("st") ? "st" : rawUnit?.startsWith("portion") ? "portion" : rawUnit;
      const rawName = (amountMatch?.[3] ?? itemLabel ?? `Råvara ${index + 1}`).replace(/[\s:;,–—-]+$/g, "").trim();
      const name = rawName ? `${rawName.charAt(0).toUpperCase()}${rawName.slice(1)}` : `Råvara ${index + 1}`;
      const calories = Number(calorieMatch[1].replace(",", "."));
      const protein = Number(proteinMatch[1].replace(",", "."));
      const grams = quantity && unit === "g" ? quantity : quantity && unit === "kg" ? quantity * 1000 : undefined;

      items.push({
        name,
        amount: quantity && unit ? `${quantityText} ${unit}` : "Angiven makromängd",
        quantity,
        unit,
        grams,
        calories: Math.max(0, Math.round(calories * 10) / 10),
        protein: Math.max(0, Math.round(protein * 10) / 10),
      });
    });

  return { items, ignoredLines };
}

function editableNutritionItem(item: NutritionItem, index: number): EditableNutritionItem {
  const match = item.amount?.replace(",", ".").match(/([\d.]+)\s*(kg|g|dl|ml|st|styck|portion|msk|tsk)?/i);
  const quantity = Number(item.quantity ?? match?.[1] ?? item.grams ?? 0);
  const rawUnit = item.unit ?? match?.[2] ?? (item.grams ? "g" : "g");
  return {
    ...item,
    editorId: `${item.foodId ?? "item"}-${index}-${item.name}`,
    quantityText: Number.isFinite(quantity) && quantity > 0 ? String(quantity) : "",
    unitValue: rawUnit.toLowerCase() === "styck" ? "st" : rawUnit.toLowerCase(),
  };
}

export default function TrainingApp({ todayLabel, greeting, nowIso }: { todayLabel: string; greeting: string; nowIso: string }) {
  const [tab, setTab] = useState<TabId>("today");
  const [state, setState] = useState<PersistedState>(initialState);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const program = PROGRAM;
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"loading" | "saved" | "offline" | "saving">("loading");
  const [openDay, setOpenDay] = useState<string>("lower-a");
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachResponse, setCoachResponse] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rest, setRest] = useState<{ remaining: number; total: number } | null>(null);
  const [guideExercise, setGuideExercise] = useState<Exercise | null>(null);
  const saveAbort = useRef<AbortController | null>(null);

  const nextPass = useMemo(
    () => program.find((day) => day.id === state.nextPassId) ?? program[0],
    [program, state.nextPassId],
  );
  const activePass = useMemo(
    () => program.find((day) => day.id === state.activePassId) ?? null,
    [program, state.activePassId],
  );
  const todayKey = useMemo(() => stockholmDateKey(nowIso), [nowIso]);
  const nutritionTotals = useMemo(
    () => totalNutrition(foodEntries.filter((entry) => entryDate(entry, todayKey) === todayKey)),
    [foodEntries, todayKey],
  );

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      ensureOwnerToken();
      let local: Partial<PersistedState> | null = null;
      let localFood: FoodEntry[] = [];
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        local = raw ? (JSON.parse(raw) as Partial<PersistedState>) : null;
        const foodRaw = window.localStorage.getItem(FOOD_STORAGE_KEY);
        localFood = foodRaw ? (JSON.parse(foodRaw) as FoodEntry[]) : [];
      } catch {
        local = null;
        localFood = [];
      }

      try {
        const [stateResult, foodResult] = await Promise.allSettled([
          fetch("/api/state", { cache: "no-store" }),
          fetch("/api/nutrition/entries?limit=5000", { cache: "no-store" }),
        ]);
        const response = stateResult.status === "fulfilled" ? stateResult.value : null;
        const body = response ? (await response.json()) as { state?: Partial<PersistedState> | null } : { state: null };
        const merged = mergeState(body.state ?? local ?? {});
        const legacyFood = (merged.nutrition.entries ?? []).map((entry) => ({
          ...entry,
          loggedAt: entry.loggedAt ?? nowIso,
          source: entry.source ?? "manual" as const,
        }));
        let serverFood: FoodEntry[] = [];
        if (foodResult.status === "fulfilled") {
          const foodBody = (await foodResult.value.json()) as { entries?: FoodEntry[] };
          if (foodResult.value.ok && Array.isArray(foodBody.entries)) serverFood = foodBody.entries;
        }
        const resolvedFood = serverFood.length ? serverFood : localFood.length ? localFood : legacyFood;
        if (!cancelled) {
          setState({ ...merged, nutrition: { ...merged.nutrition, entries: resolvedFood.slice(0, 500) } });
          setFoodEntries(resolvedFood);
          setSaveStatus(response?.ok ? "saved" : "offline");
        }
      } catch {
        if (!cancelled) {
          const merged = mergeState(local ?? {});
          const fallbackFood = localFood.length ? localFood : merged.nutrition.entries.map((entry) => ({ ...entry, loggedAt: entry.loggedAt ?? nowIso }));
          setState({ ...merged, nutrition: { ...merged.nutrition, entries: fallbackFood.slice(0, 500) } });
          setFoodEntries(fallbackFood);
          setSaveStatus("offline");
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [nowIso]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const timeout = window.setTimeout(async () => {
      setSaveStatus("saving");
      saveAbort.current?.abort();
      const controller = new AbortController();
      saveAbort.current = controller;
      try {
        const response = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state }),
          signal: controller.signal,
        });
        setSaveStatus(response.ok ? "saved" : "offline");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setSaveStatus("offline");
      }
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(foodEntries.slice(0, 1000)));
  }, [foodEntries, hydrated]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    if (hydrated) window.localStorage.setItem(THEME_STORAGE_KEY, state.theme);
  }, [hydrated, state.theme]);

  async function saveFoodEntry(draft: FoodEntry, image: Blob | null = null) {
    let entry = { ...draft };
    let uploadedImageKey: string | null = null;
    if (image) {
      const form = new FormData();
      form.append("image", image, "meal.jpg");
      const uploadResponse = await fetch("/api/nutrition/photo", { method: "POST", body: form });
      const upload = (await uploadResponse.json()) as { key?: string; type?: string; error?: string };
      if (!uploadResponse.ok || !upload.key) throw new Error(upload.error || "Bilden kunde inte sparas.");
      uploadedImageKey = upload.key;
      entry = { ...entry, imageKey: upload.key, imageType: upload.type ?? "image/jpeg" };
    }

    const isExisting = foodEntries.some((item) => item.id === entry.id);
    const requestBody = JSON.stringify(entry);
    let response: Response | null = null;
    try {
      response = await fetch("/api/nutrition/entries", {
        method: isExisting ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });
      if (isExisting && response.status === 404) {
        response = await fetch("/api/nutrition/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        });
      }
    } catch {
      response = null;
    }

    const body = response ? await response.json().catch(() => ({} as { error?: string })) : {};
    if (response && !response.ok && response.status < 500) {
      if (uploadedImageKey) void fetch(`/api/nutrition/photo?key=${encodeURIComponent(uploadedImageKey)}`, { method: "DELETE" });
      throw new Error(body.error || "Måltiden kunde inte sparas.");
    }
    if (!response?.ok) setSaveStatus("offline");

    setFoodEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
    setState((current) => ({
      ...current,
      nutrition: { ...current.nutrition, entries: [entry, ...current.nutrition.entries.filter((item) => item.id !== entry.id)].slice(0, 500) },
    }));
  }

  async function deleteFoodEntry(entry: FoodEntry) {
    const response = await fetch(`/api/nutrition/entries?id=${encodeURIComponent(entry.id)}`, { method: "DELETE" });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(body.error || "Måltiden kunde inte tas bort.");
    if (entry.imageKey) void fetch(`/api/nutrition/photo?key=${encodeURIComponent(entry.imageKey)}`, { method: "DELETE" });
    setFoodEntries((current) => current.filter((item) => item.id !== entry.id));
    setState((current) => ({
      ...current,
      nutrition: { ...current.nutrition, entries: current.nutrition.entries.filter((item) => item.id !== entry.id) },
    }));
  }

  useEffect(() => {
    if (!rest) return;
    if (rest.remaining <= 0) {
      if ("vibrate" in navigator) navigator.vibrate([180, 90, 180]);
      return;
    }
    const timer = window.setInterval(() => {
      setRest((current) => (current ? { ...current, remaining: Math.max(0, current.remaining - 1) } : null));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [rest]);

  function startWorkout(day: WorkoutDay) {
    setState((current) => {
      const logs = { ...current.logs };
      day.exercises.forEach((exercise) => {
        if (!logs[exercise.id]) logs[exercise.id] = createSets(exercise);
      });
      return {
        ...current,
        activePassId: day.id,
        sessionStartedAt: current.activePassId === day.id && current.sessionStartedAt ? current.sessionStartedAt : new Date().toISOString(),
        logs,
      };
    });
    setTab("workout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateSet(exerciseId: string, index: number, patch: Partial<SetEntry>) {
    setState((current) => ({
      ...current,
      logs: {
        ...current.logs,
        [exerciseId]: (current.logs[exerciseId] ?? []).map((set, setIndex) =>
          setIndex === index ? { ...set, ...patch } : set,
        ),
      },
    }));
  }

  function toggleSet(exercise: Exercise, index: number) {
    const set = state.logs[exercise.id]?.[index];
    const nextDone = !set?.done;
    updateSet(exercise.id, index, { done: nextDone });
    if (nextDone) {
      setRest({ remaining: exercise.restSeconds, total: exercise.restSeconds });
      if ("vibrate" in navigator) navigator.vibrate(45);
    }
  }

  function resetWorkout() {
    if (!activePass) return;
    setState((current) => {
      const logs = { ...current.logs };
      activePass.exercises.forEach((exercise) => {
        logs[exercise.id] = createSets(exercise);
      });
      return { ...current, logs, sessionStartedAt: new Date().toISOString() };
    });
  }

  function finishWorkout() {
    if (!activePass) return;
    const completed = activePass.exercises.flatMap((exercise) => state.logs[exercise.id] ?? []).filter((set) => set.done);
    if (completed.length === 0) return;
    const volume = completed.reduce((sum, set) => sum + (set.weight ?? 0) * set.reps, 0);
    const duration = Math.max(
      1,
      Math.round((Date.now() - new Date(state.sessionStartedAt ?? Date.now()).getTime()) / 60_000),
    );
    const historyEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      passId: activePass.id,
      name: activePass.name,
      date: new Date().toISOString(),
      duration,
      volume,
      completedSets: completed.length,
      prCount: 0,
    };
    const nextIndex = activePass.number % program.length;
    setState((current) => ({
      ...current,
      activePassId: null,
      sessionStartedAt: null,
      nextPassId: program[nextIndex].id,
      history: [historyEntry, ...current.history].slice(0, 40),
    }));
    setRest(null);
    setSummary({ name: activePass.name, duration, volume, sets: completed.length });
    setTab("today");
  }

  function askCoach(question: string) {
    const readiness = state.readiness;
    if (question.includes("höja")) {
      setCoachResponse("Höj först när du når övre delen av repsintervallet i alla arbetsset med bra teknik och ungefär RPE 8 eller lägre. Bänkpressen har just nu målet 80 kg × 8 i tre set innan 82,5 kg.");
    } else if (question.includes("sov")) {
      setCoachResponse(readiness.sleep < 6 ? "Kör gärna, men sänk förväntningen: håll 2–3 reps i tanken, kapa ett isolationsset vid behov och jaga inga personbästan idag." : "Din sömn ser tillräcklig ut för ett normalt pass. Låt uppvärmningen avgöra om dagens vikter känns rätt.");
    } else if (question.includes("protein")) {
      const remaining = Math.max(0, state.nutrition.proteinTarget - nutritionTotals.protein);
      setCoachResponse(`Du har ${formatNumber(remaining)} g protein kvar till dagens startmål. Fördela det gärna över resten av dagens måltider.`);
    } else {
      setCoachResponse(`${nextPass.name} står näst i ordningen. Börja kontrollerat, håll ungefär 1–3 reps i tanken och logga varje arbetsset så justerar vi nästa pass efter riktig data.`);
    }
    setCoachOpen(true);
  }

  const saveLabel =
    saveStatus === "saved" ? "Sparat" : saveStatus === "offline" ? "Offline-sparat" : saveStatus === "loading" ? "Laddar" : "Sparar";
  const SaveIcon = saveStatus === "offline" ? CloudOff : saveStatus === "saved" ? Cloud : LoaderCircle;

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <button className="brand" type="button" onClick={() => setTab("today")} aria-label="Gå till startsidan">
          <span className="brand-mark"><Image src="/icon.svg" alt="" width={38} height={38} unoptimized /></span>
          <span><strong>JOXO</strong><small>TRAINING</small></span>
        </button>
        <div className={`save-state ${saveStatus}`}>
          <SaveIcon size={14} className={saveStatus === "saving" || saveStatus === "loading" ? "spin" : ""} />
          {saveLabel}
        </div>
        <button className="avatar" type="button" onClick={() => setTab("profile")} aria-label="Öppna profil">JE</button>
      </header>

      <main className="main-content">
        {tab === "today" && (
          <TodayView
            state={state}
            nextPass={nextPass}
            todayLabel={todayLabel}
            greeting={greeting}
            nowIso={nowIso}
            nutritionTotals={nutritionTotals}
            onStart={() => startWorkout(nextPass)}
            onReadiness={(key, value) => setState((current) => ({
              ...current,
              readiness: { ...current.readiness, [key]: value },
            }))}
            onNutrition={() => {
              setTab("nutrition");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onCoach={askCoach}
            onPlan={() => setTab("plan")}
          />
        )}

        {tab === "plan" && (
          <PlanView
            program={program}
            openDay={openDay}
            setOpenDay={setOpenDay}
            nextPassId={state.nextPassId}
            onStart={startWorkout}
            onGuide={setGuideExercise}
          />
        )}

        {tab === "workout" && (
          <WorkoutView
            activePass={activePass}
            nextPass={nextPass}
            logs={state.logs}
            onStart={startWorkout}
            onUpdateSet={updateSet}
            onToggleSet={toggleSet}
            onFinish={finishWorkout}
            onReset={resetWorkout}
            onGuide={setGuideExercise}
          />
        )}

        {tab === "nutrition" && (
          <NutritionView
            entries={foodEntries}
            nutrition={state.nutrition}
            todayKey={todayKey}
            onSave={saveFoodEntry}
            onDelete={deleteFoodEntry}
            onAddWater={() => setState((current) => ({
              ...current,
              nutrition: { ...current.nutrition, waterMl: current.nutrition.waterMl + 250 },
            }))}
          />
        )}

        {tab === "progress" && <ProgressView state={state} program={program} />}

        {tab === "profile" && <ProfileView state={state} setState={setState} />}
      </main>

      {rest && (
        <RestTimer
          remaining={rest.remaining}
          total={rest.total}
          onAdd={() => setRest((current) => current ? { ...current, remaining: current.remaining + 30, total: current.total + 30 } : null)}
          onClose={() => setRest(null)}
        />
      )}

      <nav className="bottom-nav" aria-label="Huvudmeny">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={active ? "active" : ""}
              onClick={() => {
                setTab(item.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <span className="nav-icon"><Icon size={20} strokeWidth={active ? 2.5 : 1.8} /></span>
              <span>{item.label}</span>
              {item.id === "workout" && activePass && <i />}
            </button>
          );
        })}
      </nav>

      {coachOpen && (
        <CoachSheet
          response={coachResponse}
          onQuestion={askCoach}
          onClose={() => setCoachOpen(false)}
        />
      )}

      {guideExercise && <ExerciseGuideSheet exercise={guideExercise} onClose={() => setGuideExercise(null)} />}

      {summary && <SummarySheet summary={summary} onClose={() => setSummary(null)} />}
    </div>
  );
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="page-intro">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function TodayView({
  state,
  nextPass,
  todayLabel,
  greeting,
  nowIso,
  nutritionTotals,
  onStart,
  onReadiness,
  onNutrition,
  onCoach,
  onPlan,
}: {
  state: PersistedState;
  nextPass: WorkoutDay;
  todayLabel: string;
  greeting: string;
  nowIso: string;
  nutritionTotals: { calories: number; protein: number };
  onStart: () => void;
  onReadiness: (key: "energy" | "soreness" | "motivation", value: number) => void;
  onNutrition: () => void;
  onCoach: (question: string) => void;
  onPlan: () => void;
}) {
  const todayStamp = Date.parse(nowIso);
  const completedThisWeek = state.history.filter((entry) => todayStamp - new Date(entry.date).getTime() < 7 * 86400000).length;
  const readinessScore = Math.round(
    Math.min(100, (state.readiness.sleep / 8) * 35 + (state.readiness.energy / 5) * 25 + ((6 - state.readiness.soreness) / 5) * 20 + (state.readiness.motivation / 5) * 20),
  );
  const caloriePct = Math.min(100, Math.round((nutritionTotals.calories / state.nutrition.calorieTarget) * 100));
  const proteinPct = Math.min(100, Math.round((nutritionTotals.protein / state.nutrition.proteinTarget) * 100));

  return (
    <>
      <section className="greeting-row">
        <div>
          <span className="eyebrow">{todayLabel}</span>
          <h1>{greeting}, {state.profile.name}</h1>
          <p>Nästa pass väntar. Du behöver bara dyka upp.</p>
        </div>
        <div className="readiness-orb" style={{ "--score": `${readinessScore * 3.6}deg` } as React.CSSProperties}>
          <strong>{readinessScore}</strong><small>redo</small>
        </div>
      </section>

      <section className="workout-hero">
        <div className="hero-grid" />
        <div className="hero-kicker"><span>PASS {String(nextPass.number).padStart(2, "0")}</span><span>{nextPass.duration}</span></div>
        <div className="hero-copy">
          <span className="hero-icon"><Dumbbell size={34} /></span>
          <div>
            <p>NÄSTA I ORDNING</p>
            <h2>{nextPass.name}</h2>
            <span>{nextPass.focus}</span>
          </div>
        </div>
        <div className="hero-meta">
          <div><strong>{nextPass.exercises.length}</strong><span>övningar</span></div>
          <div><strong>{nextPass.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)}</strong><span>arbetsset</span></div>
          <div><strong>1–3</strong><span>reps kvar</span></div>
        </div>
        <button className="primary-action" type="button" onClick={onStart}><Play size={18} fill="currentColor" /> Starta passet</button>
        <button className="text-action" type="button" onClick={onPlan}>Se hela schemat <ArrowRight size={16} /></button>
      </section>

      <section className="week-strip card-surface">
        <div className="section-heading compact">
          <div><span>VECKAN</span><h3>{completedThisWeek} av {state.profile.weeklyGoal} pass</h3></div>
          <strong>{Math.round((completedThisWeek / state.profile.weeklyGoal) * 100)}%</strong>
        </div>
        <div className="week-days">
          {weekdayLabels.map((day, index) => (
            <div key={`${day}-${index}`} className={index === 3 ? "today" : index < completedThisWeek ? "done" : ""}>
              <span>{day}</span><i>{index < completedThisWeek ? <Check size={12} /> : index === 3 ? <Dumbbell size={12} /> : null}</i>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="card-surface checkin-card">
          <div className="section-heading"><div><span>DAGSFORM</span><h3>Hur känns kroppen?</h3></div><Gauge size={20} /></div>
          <CheckinRow icon={Zap} label="Energi" value={state.readiness.energy} onChange={(value) => onReadiness("energy", value)} />
          <CheckinRow icon={Waves} label="Träningsvärk" value={state.readiness.soreness} onChange={(value) => onReadiness("soreness", value)} reverse />
          <CheckinRow icon={Flame} label="Motivation" value={state.readiness.motivation} onChange={(value) => onReadiness("motivation", value)} />
          <div className="sleep-note"><Moon size={16} /><span>{state.readiness.sleep} h sömn</span><small>Redigeras i profil</small></div>
        </article>

        <button className="card-surface nutrition-card" type="button" onClick={onNutrition}>
          <div className="section-heading"><div><span>KOST IDAG</span><h3>Energi & protein</h3></div><Apple size={20} /></div>
          <div className="nutrition-rings">
            <ProgressRing value={caloriePct} label="kcal" main={`${nutritionTotals.calories}`} sub={`/ ${state.nutrition.calorieTarget}`} />
            <ProgressRing value={proteinPct} label="protein" main={`${formatNumber(nutritionTotals.protein)} g`} sub={`/ ${state.nutrition.proteinTarget} g`} />
          </div>
          <div className="card-link">Öppna kostloggen <ChevronRight size={16} /></div>
        </button>
      </section>

      <button className="coach-card" type="button" onClick={() => onCoach("Vad ska jag träna idag?")}>
        <span className="coach-avatar"><Brain size={24} /></span>
        <span className="coach-copy"><small>JOXO PT</small><strong>{state.readiness.energy <= 2 ? "Ta ett smartare, inte hårdare, pass idag." : `${nextPass.name} ser helt rätt ut idag.`}</strong><p>{state.readiness.energy <= 2 ? "Håll 2–3 reps i tanken och skala bort ett set om uppvärmningen känns tung." : "Börja lugnt och låt de första arbetsseten styra dagsformen."}</p></span>
        <ChevronRight size={20} />
      </button>
    </>
  );
}

function CheckinRow({ icon: Icon, label, value, onChange, reverse = false }: { icon: LucideIcon; label: string; value: number; onChange: (value: number) => void; reverse?: boolean }) {
  return (
    <div className="checkin-row">
      <span className="checkin-label"><Icon size={16} />{label}</span>
      <div className="score-pills" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button key={score} type="button" className={score === value ? "active" : ""} onClick={() => onChange(score)} aria-label={`${label} ${score} av 5`}>
            {reverse ? 6 - score : score}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProgressRing({ value, label, main, sub }: { value: number; label: string; main: string; sub: string }) {
  return (
    <div className="ring-item">
      <div className="mini-ring" style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties}><span>{value}%</span></div>
      <div><small>{label}</small><strong>{main}</strong><span>{sub}</span></div>
    </div>
  );
}

function PlanView({ program, openDay, setOpenDay, nextPassId, onStart, onGuide }: { program: WorkoutDay[]; openDay: string; setOpenDay: (id: string) => void; nextPassId: string; onStart: (day: WorkoutDay) => void; onGuide: (exercise: Exercise) => void }) {
  return (
    <>
      <PageIntro eyebrow="DITT 4-DAGARSPROGRAM" title="Ditt träningsschema" description="Fortsätt bara på nästa pass i ordningen när veckan förändras." />
      <div className="sequence-line">
        {program.map((day, index) => (
          <div key={day.id}>
            <span className={day.id === nextPassId ? "active" : ""}>{day.number}</span>
            {index < program.length - 1 ? <i /> : null}
          </div>
        ))}
      </div>
      <section className="plan-list">
        {program.map((day) => {
          const expanded = openDay === day.id;
          const isNext = nextPassId === day.id;
          return (
            <article className={`plan-card ${expanded ? "expanded" : ""}`} key={day.id}>
              <button className="plan-card-head" type="button" onClick={() => setOpenDay(expanded ? "" : day.id)}>
                <span className="plan-number">0{day.number}</span>
                <span className="plan-title"><small>{isNext ? "NÄSTA PASS" : day.style.toUpperCase()}</small><strong>{day.name}</strong><p>{day.focus}</p></span>
                <span className="plan-stats"><small>{day.duration}</small><strong>{day.exercises.length} övningar</strong></span>
                <ChevronDown size={20} className={expanded ? "rotated" : ""} />
              </button>
              {expanded && (
                <div className="plan-card-body">
                  {day.exercises.map((exercise) => (
                    <button key={exercise.id} className="plan-exercise" type="button" onClick={() => onGuide(exercise)} aria-label={`Visa övningsguide för ${exercise.name}`}>
                      <span>{String(exercise.order).padStart(2, "0")}</span>
                      <span className="plan-exercise-thumb" aria-hidden="true">
                        <Image src={exercise.imageStart} alt="" width={96} height={96} sizes="52px" unoptimized />
                      </span>
                      <div className="plan-exercise-copy"><strong>{exercise.name}</strong><small>{exercise.muscle} · {exercise.sets} × {exercise.minReps}–{exercise.maxReps}</small></div>
                      <div className="target-weight">{exercise.weight ? `${exercise.weight} kg` : "Startvikt"}</div>
                      <Info size={15} />
                    </button>
                  ))}
                  <button className="primary-action" type="button" onClick={() => onStart(day)}><Play size={18} fill="currentColor" /> Starta {day.name}</button>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}

function WorkoutView({ activePass, nextPass, logs, onStart, onUpdateSet, onToggleSet, onFinish, onReset, onGuide }: { activePass: WorkoutDay | null; nextPass: WorkoutDay; logs: Record<string, SetEntry[]>; onStart: (day: WorkoutDay) => void; onUpdateSet: (exerciseId: string, index: number, patch: Partial<SetEntry>) => void; onToggleSet: (exercise: Exercise, index: number) => void; onFinish: () => void; onReset: () => void; onGuide: (exercise: Exercise) => void }) {
  if (!activePass) {
    return (
      <div className="empty-workout">
        <span className="empty-icon"><Dumbbell size={38} /></span>
        <small>REDO NÄR DU ÄR</small>
        <h1>Starta nästa pass</h1>
        <p>{nextPass.name} · {nextPass.exercises.length} övningar · {nextPass.duration}</p>
        <button className="primary-action" type="button" onClick={() => onStart(nextPass)}><Play size={18} fill="currentColor" /> Starta passet</button>
      </div>
    );
  }

  const allSets = activePass.exercises.flatMap((exercise) => logs[exercise.id] ?? []);
  const doneSets = allSets.filter((set) => set.done).length;
  const progress = allSets.length ? Math.round((doneSets / allSets.length) * 100) : 0;

  return (
    <>
      <section className="active-workout-head">
        <div><span>AKTIVT PASS · {progress}%</span><h1>{activePass.name}</h1><p>{doneSets} av {allSets.length} arbetsset klara</p></div>
        <button type="button" className="icon-button" onClick={onReset} aria-label="Återställ pass"><RotateCcw size={18} /></button>
        <div className="workout-progress"><i style={{ width: `${progress}%` }} /></div>
      </section>

      <section className="exercise-list">
        {activePass.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            sets={logs[exercise.id] ?? createSets(exercise)}
            onUpdate={(index, patch) => onUpdateSet(exercise.id, index, patch)}
            onToggle={(index) => onToggleSet(exercise, index)}
            onGuide={() => onGuide(exercise)}
          />
        ))}
      </section>

      <section className="finish-panel">
        <div><Trophy size={22} /><span><strong>{doneSets} set klara</strong><small>Alla ändringar autosparas.</small></span></div>
        <button className="primary-action" type="button" disabled={doneSets === 0} onClick={onFinish}>Avsluta passet <Check size={18} /></button>
      </section>
    </>
  );
}

function ExerciseCard({ exercise, sets, onUpdate, onToggle, onGuide }: { exercise: Exercise; sets: SetEntry[]; onUpdate: (index: number, patch: Partial<SetEntry>) => void; onToggle: (index: number) => void; onGuide: () => void }) {
  const [expanded, setExpanded] = useState(exercise.order === 1);
  const last = sets[sets.length - 1] ?? { weight: exercise.weight, reps: exercise.startReps, rpe: 8 };
  const advice = getExerciseAdvice(exercise, last.reps, last.rpe, last.weight);
  const complete = sets.filter((set) => set.done).length;

  return (
    <article className={`exercise-card ${complete === sets.length ? "complete" : ""}`}>
      <button
        className="exercise-visual"
        type="button"
        onClick={onGuide}
        aria-label={`Öppna övningsguide för ${exercise.name}`}
      >
        <span className="exercise-motion" aria-hidden="true">
          <span className="exercise-frame">
            <Image src={exercise.imageStart} alt="" fill sizes="(max-width: 1000px) 50vw, 500px" unoptimized />
            <span>START</span>
          </span>
          <span className="exercise-frame">
            <Image src={exercise.imageEnd} alt="" fill sizes="(max-width: 1000px) 50vw, 500px" unoptimized />
            <span>SLUT</span>
          </span>
        </span>
        <span className="visual-number">{String(exercise.order).padStart(2, "0")}</span>
        <span className="muscle-chip">{exercise.muscle}</span>
        <span className="exercise-guide-cue"><Info size={14} /> Visa guide</span>
      </button>
      <div className="exercise-title-row">
        <div><small>{exercise.sets} × {exercise.minReps}–{exercise.maxReps} · vila {Math.round(exercise.restSeconds / 15) * 15} sek</small><h2>{exercise.name}</h2></div>
        <button className="exercise-toggle" type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-label={`${expanded ? "Dölj" : "Visa"} set för ${exercise.name}`}>
          <span>{complete}/{sets.length}</span>
          <ChevronDown size={17} className={expanded ? "rotated" : ""} />
        </button>
      </div>

      <div className="recommendation-strip"><Sparkles size={16} /><span><small>NÄSTA MÅL</small><strong>{advice}</strong></span></div>

      {expanded && (
        <div className="exercise-details">
          <div className="set-table-head"><span>SET</span><span>KG</span><span>REPS</span><span>RPE</span><span>KLAR</span></div>
          {sets.map((set, index) => (
            <div className={`set-row ${set.done ? "done" : ""}`} key={`${exercise.id}-set-${index}`}>
              <span className="set-number">{index + 1}</span>
              <NumberControl value={set.weight} step={2.5} min={0} label={`Vikt set ${index + 1}`} onChange={(weight) => onUpdate(index, { weight })} />
              <NumberControl value={set.reps} step={1} min={0} label={`Reps set ${index + 1}`} onChange={(reps) => onUpdate(index, { reps: reps ?? 0 })} />
              <input className="rpe-input" type="number" inputMode="decimal" min="1" max="10" step="0.5" value={set.rpe} aria-label={`RPE set ${index + 1}`} onChange={(event) => onUpdate(index, { rpe: Math.min(10, Math.max(1, Number(event.target.value))) })} />
              <button type="button" className="done-button" onClick={() => onToggle(index)} aria-label={`Markera set ${index + 1} ${set.done ? "inte klart" : "klart"}`}><Check size={18} /></button>
            </div>
          ))}
          <div className="technique-note"><Target size={17} /><span><small>TEKNIK</small>{exercise.technique}</span></div>
          <div className="exercise-note"><CircleAlert size={15} />{exercise.note}</div>
        </div>
      )}
    </article>
  );
}

function NumberControl({ value, step, min, label, onChange }: { value: number | null; step: number; min: number; label: string; onChange: (value: number | null) => void }) {
  const numeric = value ?? 0;
  return (
    <div className="number-control">
      <button type="button" onClick={() => onChange(Math.max(min, numeric - step))} aria-label={`Minska ${label}`}><Minus size={13} /></button>
      <input type="number" inputMode="decimal" min={min} step={step} value={value ?? ""} placeholder="–" aria-label={label} onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} />
      <button type="button" onClick={() => onChange(numeric + step)} aria-label={`Öka ${label}`}><Plus size={13} /></button>
    </div>
  );
}

function ProgressView({ state, program }: { state: PersistedState; program: WorkoutDay[] }) {
  const totalVolume = state.history.reduce((sum, entry) => sum + entry.volume, 0);
  const maxVolume = Math.max(1, ...state.history.slice(0, 8).map((entry) => entry.volume));
  const muscleSets = new Map<string, number>();
  program.forEach((day) => day.exercises.forEach((exercise) => muscleSets.set(exercise.muscle, (muscleSets.get(exercise.muscle) ?? 0) + exercise.sets)));
  const maxMuscleSets = Math.max(...muscleSets.values());

  return (
    <>
      <PageIntro eyebrow="DIN UTVECKLING" title="Framsteg" description="Styrka byggs i små, konsekventa steg. Här ser du dem." />
      <section className="metric-grid">
        <MetricCard icon={Dumbbell} label="Genomförda pass" value={String(state.history.length)} note="sedan appstart" />
        <MetricCard icon={Activity} label="Total volym" value={`${formatNumber(totalVolume / 1000)} t`} note="loggad träningsvolym" />
        <MetricCard icon={Scale} label="Kroppsvikt" value={`${formatNumber(state.profile.weightKg)} kg`} note="senast registrerad" />
        <MetricCard icon={Flame} label="Träningssvit" value={`${Math.min(state.history.length, 7)} pass`} note="utan avbrott" />
      </section>

      <section className="card-surface chart-card">
        <div className="section-heading"><div><span>TRÄNINGSVOLYM</span><h3>Senaste passen</h3></div><BarChart3 size={20} /></div>
        {state.history.length ? (
          <div className="volume-chart">
            {state.history.slice(0, 8).reverse().map((entry) => (
              <div key={entry.id} className="bar-column"><strong>{formatNumber(entry.volume / 1000)}</strong><i style={{ height: `${Math.max(10, (entry.volume / maxVolume) * 100)}%` }} /><span>{entry.name.replace("kropp", "")}</span></div>
            ))}
          </div>
        ) : (
          <div className="chart-empty"><BarChart3 size={34} /><strong>Din första kurva börjar efter nästa pass</strong><p>Bänkpressens importerade startmål är 80 kg × 7.</p></div>
        )}
      </section>

      <section className="card-surface muscle-card">
        <div className="section-heading"><div><span>PROGRAMVOLYM</span><h3>Set per muskelgrupp</h3></div><Target size={20} /></div>
        <div className="muscle-list">
          {[...muscleSets.entries()].sort((a, b) => b[1] - a[1]).map(([muscle, sets]) => (
            <div key={muscle}><span>{muscle}</span><i><b style={{ width: `${(sets / maxMuscleSets) * 100}%` }} /></i><strong>{sets}</strong></div>
          ))}
        </div>
      </section>

      <section className="baseline-card">
        <span><Trophy size={24} /></span>
        <div><small>IMPORTERAD STARTNIVÅ</small><h3>Bänkpress · 80 kg × 7</h3><p>Målet är 3 × 8 med bra teknik och högst ungefär RPE 8. Därefter 82,5 kg.</p></div>
      </section>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return <article className="metric-card"><span><Icon size={19} /></span><small>{label}</small><strong>{value}</strong><p>{note}</p></article>;
}

function ProfileView({ state, setState }: { state: PersistedState; setState: React.Dispatch<React.SetStateAction<PersistedState>> }) {
  const updateProfile = (key: keyof PersistedState["profile"], value: string | number) => setState((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
  const addWeight = () => setState((current) => ({ ...current, weightHistory: [{ date: new Date().toISOString(), weight: current.profile.weightKg }, ...current.weightHistory].slice(0, 100) }));

  return (
    <>
      <PageIntro eyebrow="PERSONLIGT UPPLÄGG" title="Profil & inställningar" description="Målen styr coachningen, men du bestämmer alltid." />
      <section className="profile-hero">
        <span className="large-avatar">JE</span>
        <div><small>TRÄNAR 4× / VECKA</small><h2>{state.profile.name}</h2><p>{state.profile.goal}</p></div>
        <span className="profile-badge"><BadgeCheckIcon /> Aktiv</span>
      </section>

      <section className="settings-card appearance-card">
        <div className="section-heading"><div><span>UTSEENDE</span><h3>Ljust eller mörkt</h3></div>{state.theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}</div>
        <div className="theme-switch" role="group" aria-label="Välj färgläge">
          <button type="button" className={state.theme === "dark" ? "active" : ""} onClick={() => setState((current) => ({ ...current, theme: "dark" }))}><Moon size={17} /><span><strong>Mörkt</strong><small>Lugnare på kvällen</small></span><Check size={16} /></button>
          <button type="button" className={state.theme === "light" ? "active" : ""} onClick={() => setState((current) => ({ ...current, theme: "light" }))}><Sun size={17} /><span><strong>Ljust</strong><small>Tydligt i dagsljus</small></span><Check size={16} /></button>
        </div>
      </section>

      <section className="settings-card">
        <div className="section-heading"><div><span>GRUNDUPPGIFTER</span><h3>Din profil</h3></div><UserRound size={20} /></div>
        <div className="form-grid">
          <label><span>Namn</span><input value={state.profile.name} onChange={(event) => updateProfile("name", event.target.value)} /></label>
          <label><span>Födelsedatum</span><input type="date" value={state.profile.birthDate} onChange={(event) => updateProfile("birthDate", event.target.value)} /></label>
          <label><span>Längd</span><div className="input-unit"><input type="number" value={state.profile.heightCm} onChange={(event) => updateProfile("heightCm", Number(event.target.value))} /><i>cm</i></div></label>
          <label><span>Vikt</span><div className="input-unit"><input type="number" step="0.1" value={state.profile.weightKg} onChange={(event) => updateProfile("weightKg", Number(event.target.value))} /><i>kg</i></div></label>
          <label className="wide"><span>Huvudmål</span><select value={state.profile.goal} onChange={(event) => updateProfile("goal", event.target.value)}><option>Starkare och mer muskler</option><option>Tappa fett och behålla muskler</option><option>Bygga muskler</option><option>Förbättra hälsan</option></select></label>
        </div>
        <button className="secondary-action" type="button" onClick={addWeight}><Scale size={17} /> Spara dagens vikt</button>
      </section>

      <section className="settings-card">
        <div className="section-heading"><div><span>KOSTMÅL</span><h3>Dagliga startmål</h3></div><Utensils size={20} /></div>
        <div className="form-grid two">
          <label><span>Kalorier</span><div className="input-unit"><input type="number" value={state.nutrition.calorieTarget} onChange={(event) => setState((current) => ({ ...current, nutrition: { ...current.nutrition, calorieTarget: Number(event.target.value) } }))} /><i>kcal</i></div></label>
          <label><span>Protein</span><div className="input-unit"><input type="number" value={state.nutrition.proteinTarget} onChange={(event) => setState((current) => ({ ...current, nutrition: { ...current.nutrition, proteinTarget: Number(event.target.value) } }))} /><i>g</i></div></label>
        </div>
        <p className="fine-print">Startmål är uppskattningar, inte medicinska råd. Justera efter vikttrend, prestation, hunger och hur livet faktiskt fungerar.</p>
      </section>
    </>
  );
}

function BadgeCheckIcon() {
  return <Check size={13} />;
}

function ExerciseGuideSheet({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop guide-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet guide-sheet" role="dialog" aria-modal="true" aria-labelledby={`guide-title-${exercise.id}`}>
        <div className="sheet-handle" />
        <div className="sheet-head guide-head">
          <div><small>ÖVNINGSGUIDE · {exercise.muscle.toUpperCase()}</small><h2 id={`guide-title-${exercise.id}`}>{exercise.name}</h2></div>
          <button type="button" onClick={onClose} aria-label="Stäng övningsguiden"><X size={20} /></button>
        </div>

        <div className="guide-media" aria-label={`${exercise.name}, start- och slutläge`}>
          <span className="guide-frame">
            <Image src={exercise.imageStart} alt={`${exercise.name}, startläge`} fill sizes="(max-width: 720px) 50vw, 360px" unoptimized />
            <span>STARTLÄGE</span>
          </span>
          <span className="guide-frame">
            <Image src={exercise.imageEnd} alt={`${exercise.name}, slutläge`} fill sizes="(max-width: 720px) 50vw, 360px" unoptimized />
            <span>SLUTLÄGE</span>
          </span>
        </div>

        <div className="guide-summary"><Info size={18} /><p>{exercise.guide.summary}</p></div>

        <section className="guide-section">
          <div className="guide-section-head"><span><Target size={18} /></span><div><small>GÖR SÅ HÄR</small><h3>Steg för steg</h3></div></div>
          <ol>
            {exercise.guide.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}
          </ol>
        </section>

        <section className="guide-section guide-tips">
          <div className="guide-section-head"><span><Lightbulb size={18} /></span><div><small>PT-TIPS</small><h3>Få mer av övningen</h3></div></div>
          <ul>{exercise.guide.tips.map((tip) => <li key={tip}><Check size={15} /><span>{tip}</span></li>)}</ul>
        </section>

        <section className="guide-section guide-avoid">
          <div className="guide-section-head"><span><ShieldAlert size={18} /></span><div><small>VANLIGA MISSTAG</small><h3>Undvik det här</h3></div></div>
          <ul>{exercise.guide.avoid.map((mistake) => <li key={mistake}><X size={15} /><span>{mistake}</span></li>)}</ul>
        </section>

        <div className="guide-technique"><Target size={17} /><span><small>SNABBNYCKEL</small>{exercise.technique}</span></div>
        <p className="guide-safety">Rörelsen ska kännas stabil och kontrollerad. Avbryt vid skarp eller ovanlig smärta och anpassa rörelse, vikt eller övning.</p>
      </section>
    </div>
  );
}

function RestTimer({ remaining, total, onAdd, onClose }: { remaining: number; total: number; onAdd: () => void; onClose: () => void }) {
  const progress = total ? Math.max(0, (remaining / total) * 100) : 0;
  return (
    <div className={`rest-timer ${remaining === 0 ? "finished" : ""}`}>
      <div className="rest-progress"><i style={{ width: `${progress}%` }} /></div>
      <span><Clock3 size={18} /><small>{remaining === 0 ? "VILAN ÄR KLAR" : "VILOTIMER"}</small><strong>{formatClock(remaining)}</strong></span>
      <button type="button" onClick={onAdd}>+30</button>
      <button type="button" onClick={onClose} aria-label="Stäng vilotimer"><X size={18} /></button>
    </div>
  );
}

async function prepareFoodImage(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Bilden kunde inte öppnas."));
      element.src = objectUrl;
    });
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Bilden kunde inte förberedas.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Bilden kunde inte komprimeras.")), "image/jpeg", 0.84);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function NutritionView({
  entries,
  nutrition,
  todayKey,
  onSave,
  onDelete,
  onAddWater,
}: {
  entries: FoodEntry[];
  nutrition: PersistedState["nutrition"];
  todayKey: string;
  onSave: (entry: FoodEntry, image?: Blob | null) => Promise<void>;
  onDelete: (entry: FoodEntry) => Promise<void>;
  onAddWater: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [description, setDescription] = useState("");
  const [foodAmount, setFoodAmount] = useState("150");
  const [foodUnit, setFoodUnit] = useState("g");
  const [meal, setMeal] = useState("Mellanmål");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [estimate, setEstimate] = useState<NutritionEstimate | null>(null);
  const [estimateEngine, setEstimateEngine] = useState<NutritionEngine>("manual");
  const [matchGroups, setMatchGroups] = useState<FoodMatchGroup[]>([]);
  const [status, setStatus] = useState<"idle" | "preparing" | "analyzing" | "saving">("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [visibleHistoryDays, setVisibleHistoryDays] = useState(14);
  const [compareDateA, setCompareDateA] = useState(todayKey);
  const [compareDateB, setCompareDateB] = useState(shiftDate(todayKey, -1));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(todayKey.slice(0, 7));
  const [bulkDayOpen, setBulkDayOpen] = useState(false);
  const [bulkDayText, setBulkDayText] = useState("");
  const [bulkDayRows, setBulkDayRows] = useState<BulkDaySummaryRow[]>([]);
  const [bulkDayIgnoredLines, setBulkDayIgnoredLines] = useState<string[]>([]);
  const [bulkMacroOpen, setBulkMacroOpen] = useState(false);
  const [bulkMacroText, setBulkMacroText] = useState("");
  const [bulkIgnoredLines, setBulkIgnoredLines] = useState<string[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const savedDays = useMemo(() => nutritionDaySummaries(entries, todayKey), [entries, todayKey]);
  const dayEntries = useMemo(
    () => entries.filter((entry) => entryDate(entry, todayKey) === selectedDate),
    [entries, selectedDate, todayKey],
  );
  const totals = useMemo(() => totalNutrition(dayEntries), [dayEntries]);
  const caloriePct = Math.min(100, Math.round((totals.calories / Math.max(1, nutrition.calorieTarget)) * 100));
  const proteinPct = Math.min(100, Math.round((totals.protein / Math.max(1, nutrition.proteinTarget)) * 100));
  const dateLabel = new Intl.DateTimeFormat("sv-SE", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${selectedDate}T12:00:00.000Z`));
  const effectiveCompareDateA = savedDays.some((day) => day.date === compareDateA) ? compareDateA : savedDays[0]?.date ?? compareDateA;
  const effectiveCompareDateB = savedDays.some((day) => day.date === compareDateB && day.date !== effectiveCompareDateA)
    ? compareDateB
    : savedDays.find((day) => day.date !== effectiveCompareDateA)?.date ?? effectiveCompareDateA;
  const comparisonA = savedDays.find((day) => day.date === effectiveCompareDateA) ?? null;
  const comparisonB = savedDays.find((day) => day.date === effectiveCompareDateB) ?? null;

  async function selectImage(file: File | undefined) {
    if (!file) return;
    setError("");
    setSuccess("");
    setStatus("preparing");
    try {
      const blob = await prepareFoodImage(file);
      setImageBlob(blob);
      setImagePreview(URL.createObjectURL(blob));
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Bilden kunde inte öppnas.");
    } finally {
      setStatus("idle");
    }
  }

  function clearImage() {
    setImageBlob(null);
    setImagePreview("");
    if (cameraInput.current) cameraInput.current.value = "";
    if (galleryInput.current) galleryInput.current.value = "";
  }

  async function analyzeMeal() {
    if (!description.trim()) {
      setError("Skriv ett livsmedel eller en produkt, till exempel vaniljkvarg.");
      return;
    }
    if (!Number.isFinite(Number(foodAmount.replace(",", "."))) || Number(foodAmount.replace(",", ".")) <= 0) {
      setError("Ange en mängd större än noll.");
      return;
    }
    setError("");
    setSuccess("");
    setMatchGroups([]);
    setStatus("analyzing");
    try {
      const form = new FormData();
      form.append("query", description.trim());
      form.append("amount", foodAmount.replace(",", "."));
      form.append("unit", foodUnit);
      const response = await fetch("/api/nutrition/analyze", { method: "POST", body: form });
      const body = (await response.json()) as { estimate?: NutritionEstimate; groups?: FoodMatchGroup[]; engine?: NutritionEngine; error?: string };
      if (!response.ok) throw new Error(body.error || "Livsmedlet hittades inte i matdatabasen.");
      if (body.groups?.length) {
        setEstimate(null);
        setEstimateEngine("food-database");
        setMatchGroups(body.groups);
        return;
      }
      if (!body.estimate) throw new Error(body.error || "Näringsvärdet kunde inte hämtas.");
      setEstimate(body.estimate);
      setEstimateEngine(body.engine ?? "food-database");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Sökningen i matdatabasen misslyckades.");
    } finally {
      setStatus("idle");
    }
  }

  function chooseCandidate(groupIndex: number, candidateId: number) {
    setMatchGroups((current) => current.map((group, index) => index === groupIndex
      ? { ...group, selectedId: candidateId, confidence: "medium" }
      : group));
    setError("");
  }

  function useFoodChoices() {
    const chosen = matchGroups.map((group) => group.candidates.find((candidate) => candidate.id === group.selectedId));
    if (chosen.some((candidate) => !candidate)) {
      setError("Välj ett alternativ för varje del av måltiden.");
      return;
    }
    const items = chosen.flatMap((candidate) => candidate ? [candidate.item] : []);
    const assumptions = chosen.flatMap((candidate) => candidate?.assumptions ?? []);
    const sources = [...new Set(chosen.flatMap((candidate) => candidate?.sourceName ? [candidate.sourceName] : []))];
    setEstimate({
      title: items.length === 1 ? items[0].name : description.trim().slice(0, 160) || "Måltid",
      calories: items.reduce((sum, item) => sum + item.calories, 0),
      protein: Math.round(items.reduce((sum, item) => sum + item.protein, 0) * 10) / 10,
      confidence: matchGroups.some((group) => group.confidence === "low") ? "low" : "medium",
      assumptions: [
        ...assumptions,
        sources.length ? `Näringsvärden från ${sources.join(" samt ")}.` : "Näringsvärden från den lokala matdatabasen.",
        "Produkter och recept kan ändras; kontrollera förpackningen innan du sparar.",
      ],
      items,
    });
    setEstimateEngine("food-database");
    setMatchGroups([]);
    setError("");
  }

  function startManualEntry() {
    setError("");
    setSuccess("");
    setMatchGroups([]);
    setEstimateEngine("manual");
    setEstimate({
      title: description.trim() || "Måltid",
      calories: 0,
      protein: 0,
      confidence: "low",
      assumptions: [],
      items: [],
    });
  }

  function prepareBulkMacroEntry() {
    const parsed = parseBulkMacroText(bulkMacroText);
    setError("");
    setSuccess("");
    setBulkIgnoredLines(parsed.ignoredLines);
    setMatchGroups([]);

    if (!parsed.items.length) {
      setEstimate(null);
      setError("Jag kunde inte hitta både kcal och protein på någon rad. Prova formatet: 200 g lax: 400 kcal och 40 g protein.");
      return;
    }

    const title = parsed.items.length <= 3
      ? parsed.items.map((item) => item.name).join(" + ")
      : `Måltid med ${parsed.items.length} råvaror`;
    setDescription(parsed.items.map((item) => `${item.amount} ${item.name}`).join(", "));
    setEstimateEngine("manual");
    setEstimate({
      title,
      calories: Math.round(parsed.items.reduce((sum, item) => sum + item.calories, 0)),
      protein: Math.round(parsed.items.reduce((sum, item) => sum + item.protein, 0) * 10) / 10,
      confidence: "high",
      assumptions: ["Kcal och protein är hämtade direkt från de inklistrade värdena."],
      items: parsed.items,
    });
  }

  function prepareBulkDayEntries() {
    const parsed = parseBulkDaySummary(bulkDayText, todayKey);
    setError("");
    setSuccess("");
    setBulkDayRows(parsed.rows);
    setBulkDayIgnoredLines(parsed.ignoredLines);
    if (!parsed.rows.length) setError("Jag kunde inte hitta rader med datum, kcal och protein. Prova formatet: 13 aug 500 kcal 40 g.");
  }

  async function logBulkDayEntries() {
    if (!bulkDayRows.length) return;
    setStatus("saving");
    setError("");
    setSuccess("");
    let savedCount = 0;
    try {
      for (const row of bulkDayRows) {
        await onSave({
          id: `bulk-day-summary-${row.date}`,
          name: "Importerad dagssumma",
          meal: "Mellanmål",
          calories: row.calories,
          protein: row.protein,
          loggedAt: `${row.date}T12:00:00.000Z`,
          source: "manual",
          confidence: "high",
          description: `Dagssumma importerad för ${nutritionDateLabel(row.date, todayKey, true)}.`,
          details: {
            daySummary: true,
            assumptions: ["Kalorier och protein är hämtade direkt från den inklistrade dagssammanfattningen."],
          },
        });
        savedCount += 1;
      }
      const latestDate = bulkDayRows[bulkDayRows.length - 1].date;
      setSelectedDate(latestDate);
      setBulkDayText("");
      setBulkDayRows([]);
      setBulkDayIgnoredLines([]);
      setBulkDayOpen(false);
      setSuccess(`${savedCount} ${savedCount === 1 ? "dag är" : "dagar är"} bulkloggade. Kalendern och historiken är uppdaterade.`);
    } catch (saveError) {
      setError(`${savedCount} av ${bulkDayRows.length} dagar sparades. ${saveError instanceof Error ? saveError.message : "Resten kunde inte sparas."}`);
    } finally {
      setStatus("idle");
    }
  }

  async function logEstimate() {
    if (!estimate?.title.trim()) return;
    setStatus("saving");
    setError("");
    try {
      const loggedAt = selectedDate === todayKey ? new Date().toISOString() : `${selectedDate}T12:00:00.000Z`;
      await onSave({
        id: crypto.randomUUID(),
        name: estimate.title.trim(),
        meal,
        calories: Math.max(0, Math.round(estimate.calories)),
        protein: Math.max(0, Math.round(estimate.protein * 10) / 10),
        loggedAt,
        source: estimateEngine === "saved-recipe" ? "recipe" : estimateEngine === "food-database" ? "database" : "manual",
        confidence: estimate.confidence,
        description: description.trim(),
        details: { assumptions: estimate.assumptions, items: estimate.items },
      }, imageBlob);
      setDescription("");
      setEstimate(null);
      setEstimateEngine("manual");
      setMatchGroups([]);
      setBulkMacroText("");
      setBulkIgnoredLines([]);
      setBulkMacroOpen(false);
      clearImage();
      setSuccess("Måltiden är sparad och inräknad i dagens summa.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Måltiden kunde inte sparas.");
    } finally {
      setStatus("idle");
    }
  }

  async function removeEntry(entry: FoodEntry) {
    setError("");
    try {
      await onDelete(entry);
      setSuccess(`${entry.name} togs bort.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Måltiden kunde inte tas bort.");
    }
  }

  async function saveEditedEntry(entry: FoodEntry) {
    await onSave(entry);
    const savedDate = entryDate(entry, todayKey);
    setSelectedDate(savedDate);
    setSuccess(`${entry.name} uppdaterades.`);
    setEditingEntry(null);
  }

  const meals = ["Frukost", "Lunch", "Middag", "Mellanmål"];

  return (
    <>
      <PageIntro eyebrow="MATLOGG & RECEPT" title="Mat som räknar med dig" description="Sök svenska livsmedel, ange mängden och välj rätt variant. Bilder kan sparas med måltiden som dokumentation." />

      <section className="nutrition-dashboard card-surface">
        <div className="nutrition-date-row">
          <button className="nutrition-date-nav" type="button" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} aria-label="Föregående dag"><ChevronLeft size={18} /></button>
          <button className="nutrition-date-trigger" type="button" aria-expanded={calendarOpen} onClick={() => { setCalendarMonth(selectedDate.slice(0, 7)); setCalendarOpen((current) => !current); }} aria-label="Öppna kalender">
            <small>{selectedDate === todayKey ? "IDAG" : "VALD DAG"}</small>
            <strong>{dateLabel}<CalendarDays size={16} /></strong>
          </button>
          <button className="nutrition-date-nav" type="button" disabled={selectedDate >= todayKey} onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} aria-label="Nästa dag"><ChevronRight size={18} /></button>
        </div>
        {calendarOpen && (
          <NutritionCalendar
            month={calendarMonth}
            selectedDate={selectedDate}
            todayKey={todayKey}
            savedDays={savedDays}
            onMonthChange={setCalendarMonth}
            onSelect={(date) => { setSelectedDate(date); setCalendarMonth(date.slice(0, 7)); setCalendarOpen(false); }}
            onClose={() => setCalendarOpen(false)}
          />
        )}
        <div className="nutrition-hero-metrics">
          <div className="nutrition-goal"><ProgressRing value={caloriePct} label="energi" main={`${totals.calories} kcal`} sub={`/ ${nutrition.calorieTarget} kcal`} /><p>{Math.max(0, nutrition.calorieTarget - totals.calories)} kcal kvar</p></div>
          <div className="nutrition-goal"><ProgressRing value={proteinPct} label="protein" main={`${formatNumber(totals.protein)} g`} sub={`/ ${nutrition.proteinTarget} g`} /><p>{formatNumber(Math.max(0, nutrition.proteinTarget - totals.protein))} g kvar</p></div>
          <div className="water-goal"><span><Waves size={20} /></span><small>VATTEN</small><strong>{selectedDate === todayKey ? formatNumber(nutrition.waterMl / 1000) : "–"} l</strong><button type="button" disabled={selectedDate !== todayKey} onClick={onAddWater}>+ 250 ml</button></div>
        </div>
      </section>

      <section className="nutrition-history card-surface">
        <div className="section-heading">
          <div><span>SPARADE DAGAR</span><h3>{savedDays.length ? savedDays.length === 1 ? "1 loggad dag" : `${savedDays.length} loggade dagar` : "Historiken börjar här"}</h3></div>
          <CalendarDays size={20} />
        </div>
        <p className="nutrition-history-intro">Varje måltid sparas på sitt datum. Öppna en dag för att se eller ändra loggen, och jämför sedan kalorier och protein mellan två dagar.</p>
        {savedDays.length === 0 ? (
          <div className="nutrition-history-empty"><Cloud size={18} /><span>Din första sparade dag visas här automatiskt.</span></div>
        ) : (
          <>
            <div className="nutrition-day-list" aria-label="Sparade matdagar">
              {savedDays.slice(0, visibleHistoryDays).map((day) => (
                <button className={day.date === selectedDate ? "active" : ""} type="button" key={day.date} aria-pressed={day.date === selectedDate} onClick={() => setSelectedDate(day.date)}>
                  <small>{nutritionDateLabel(day.date, todayKey)}</small>
                  <strong>{day.calories} kcal</strong>
                  <span>{formatNumber(day.protein)} g protein · {day.entryCount} {day.entryCount === 1 ? "post" : "poster"}</span>
                </button>
              ))}
            </div>
            <div className="nutrition-history-actions">
              {savedDays.length > visibleHistoryDays && <button type="button" onClick={() => setVisibleHistoryDays((current) => current + 30)}>Visa fler dagar</button>}
              <button className={compareOpen ? "active" : ""} type="button" onClick={() => setCompareOpen((current) => !current)}><BarChart3 size={15} /> {compareOpen ? "Dölj jämförelse" : "Jämför dagar"}<ChevronDown size={15} /></button>
            </div>
          </>
        )}

        {compareOpen && savedDays.length < 2 && (
          <div className="nutrition-history-empty"><Info size={18} /><span>Logga mat på minst två olika dagar för att kunna jämföra dem.</span></div>
        )}

        {compareOpen && savedDays.length >= 2 && comparisonA && comparisonB && (
          <div className="nutrition-comparison">
            <div className="nutrition-comparison-selects">
              <label><span>Dag A</span><select value={effectiveCompareDateA} onChange={(event) => { const next = event.target.value; setCompareDateA(next); if (next === effectiveCompareDateB) setCompareDateB(savedDays.find((day) => day.date !== next)?.date ?? effectiveCompareDateB); }}>{savedDays.map((day) => <option value={day.date} key={`a-${day.date}`}>{nutritionDateLabel(day.date, todayKey, true)}</option>)}</select></label>
              <label><span>Dag B</span><select value={effectiveCompareDateB} onChange={(event) => { const next = event.target.value; setCompareDateB(next); if (next === effectiveCompareDateA) setCompareDateA(savedDays.find((day) => day.date !== next)?.date ?? effectiveCompareDateA); }}>{savedDays.map((day) => <option value={day.date} key={`b-${day.date}`}>{nutritionDateLabel(day.date, todayKey, true)}</option>)}</select></label>
            </div>
            <div className="nutrition-comparison-cards">
              {[comparisonA, comparisonB].map((day, index) => (
                <button type="button" key={day.date} onClick={() => setSelectedDate(day.date)}>
                  <small>DAG {index === 0 ? "A" : "B"} · {nutritionDateLabel(day.date, todayKey)}</small>
                  <strong>{day.calories} kcal</strong>
                  <span>{formatNumber(day.protein)} g protein</span>
                  <i>{day.entryCount} {day.entryCount === 1 ? "måltid" : "måltider"}</i>
                </button>
              ))}
            </div>
            <div className="nutrition-comparison-delta"><span>Skillnad A mot B</span><strong>{nutritionDifference(comparisonA.calories - comparisonB.calories, "kcal")}</strong><strong>{nutritionDifference(comparisonA.protein - comparisonB.protein, "g protein")}</strong></div>
          </div>
        )}
      </section>

      <section className="meal-composer card-surface">
        <div className="section-heading"><div><span>MATLOGG</span><h3>Vad åt du?</h3></div><Database size={20} /></div>
        <div className="food-database-status">
          <Database size={17} />
          <span><strong>2 644 livsmedel</strong><small>2 606 basvaror + 38 träningsfavoriter · utan externt API</small></span>
          <a href="https://soknaringsinnehall.livsmedelsverket.se/" target="_blank" rel="noreferrer">Basdata</a>
        </div>
        <button className={`bulk-macro-toggle${bulkDayOpen ? " active" : ""}`} type="button" aria-expanded={bulkDayOpen} onClick={() => { setBulkDayOpen((current) => !current); setBulkMacroOpen(false); setError(""); setSuccess(""); }}>
          <span><CalendarDays size={17} /><span><strong>Bulklogga flera dagar</strong><small>Klistra in datum, kalorier och protein för flera dagar</small></span></span>
          <ChevronDown size={17} />
        </button>
        {bulkDayOpen && (
          <div className="bulk-macro-panel bulk-day-panel">
            <label>
              <span>Klistra in dagssammanfattningen</span>
              <textarea
                value={bulkDayText}
                onChange={(event) => { setBulkDayText(event.target.value); setBulkDayRows([]); setBulkDayIgnoredLines([]); setError(""); }}
                placeholder={"Datum    Kalorier    Protein\n13 aug   500 kcal    40 g\n14 aug   500 kcal    40 g\n22 aug, hittills   1 005 kcal    82,2 g"}
                autoFocus
              />
            </label>
            <p>Årtal som saknas tolkas som det senaste datumet. Rubriker, “hittills”, tusentalsmellanslag och svenska decimalkomman går bra.</p>
            {bulkDayIgnoredLines.length > 0 && <div className="bulk-macro-warning"><CircleAlert size={15} /><span>{bulkDayIgnoredLines.length} {bulkDayIgnoredLines.length === 1 ? "rad kunde" : "rader kunde"} inte läsas och hoppas över.</span></div>}
            {bulkDayRows.length === 0 ? (
              <button className="primary-action" type="button" disabled={status !== "idle" || !bulkDayText.trim()} onClick={prepareBulkDayEntries}><Check size={18} /> Läs in dagar</button>
            ) : (
              <>
                <div className="bulk-day-preview">
                  <div className="bulk-day-preview-head"><strong>{bulkDayRows.length} {bulkDayRows.length === 1 ? "dag hittad" : "dagar hittade"}</strong><span>Kontrollera före sparning</span></div>
                  {bulkDayRows.map((row) => {
                    const otherEntries = entries.filter((entry) => entryDate(entry, todayKey) === row.date && entry.id !== `bulk-day-summary-${row.date}`);
                    return (
                      <div className="bulk-day-preview-row" key={row.date}>
                        <span><strong>{nutritionDateLabel(row.date, todayKey, true)}</strong>{otherEntries.length > 0 && <small>{otherEntries.length} befintliga {otherEntries.length === 1 ? "logg" : "loggar"}</small>}</span>
                        <b>{row.calories} kcal</b>
                        <b>{formatNumber(row.protein)} g</b>
                      </div>
                    );
                  })}
                </div>
                {bulkDayRows.some((row) => entries.some((entry) => entryDate(entry, todayKey) === row.date && entry.id !== `bulk-day-summary-${row.date}`)) && (
                  <div className="bulk-day-existing-note"><Info size={15} /><span>Dagar med befintliga måltider behålls. Den importerade dagssumman läggs till, så kontrollera att totalsumman inte blir dubbel.</span></div>
                )}
                <button className="primary-action" type="button" disabled={status === "saving"} onClick={() => void logBulkDayEntries()}>{status === "saving" ? <LoaderCircle className="spin" size={18} /> : <CalendarDays size={18} />} {status === "saving" ? "Sparar dagar …" : `Bulklogga ${bulkDayRows.length} ${bulkDayRows.length === 1 ? "dag" : "dagar"}`}</button>
              </>
            )}
          </div>
        )}
        <button className={`bulk-macro-toggle${bulkMacroOpen ? " active" : ""}`} type="button" aria-expanded={bulkMacroOpen} onClick={() => { setBulkMacroOpen((current) => !current); setBulkDayOpen(false); setError(""); setSuccess(""); }}>
          <span><Sparkles size={17} /><span><strong>Klistra in flera makron</strong><small>Flera råvaror med kcal och protein samtidigt</small></span></span>
          <ChevronDown size={17} />
        </button>
        {bulkMacroOpen && (
          <div className="bulk-macro-panel">
            <label>
              <span>Klistra in en rad per råvara</span>
              <textarea
                value={bulkMacroText}
                onChange={(event) => { setBulkMacroText(event.target.value); setBulkIgnoredLines([]); setEstimate(null); setError(""); }}
                placeholder={"120 g sötpotatis: 103 kcal och 1,9 g protein\n240 g laxrätt: 283 kcal och 25,8 g protein"}
                autoFocus
              />
            </label>
            <p>Fungerar även med fetstil, punktlistor, “ca” och svenska decimaler med kommatecken.</p>
            {bulkIgnoredLines.length > 0 && <div className="bulk-macro-warning"><CircleAlert size={15} /><span>{bulkIgnoredLines.length} {bulkIgnoredLines.length === 1 ? "rad kunde" : "rader kunde"} inte läsas och kommer inte att loggas.</span></div>}
            <button className="primary-action" type="button" disabled={status !== "idle" || !bulkMacroText.trim()} onClick={prepareBulkMacroEntry}><Check size={18} /> Läs in och summera</button>
          </div>
        )}
        <label className="food-search-field">
          <span>Livsmedel eller produkt</span>
          <input
            value={description}
            onChange={(event) => { setDescription(event.target.value); setEstimate(null); setMatchGroups([]); setEstimateEngine("manual"); }}
            onKeyDown={(event) => { if (event.key === "Enter" && status === "idle") void analyzeMeal(); }}
            placeholder="Vaniljkvarg, Wasa Protein+ eller kycklingfilé"
            autoComplete="off"
          />
          <small>Stavfel och sammansatta ord går bra. “150g vaniljkvarg” fungerar också.</small>
        </label>
        <div className="food-amount-fields">
          <label><span>Mängd</span><input type="number" inputMode="decimal" min="0.01" step="0.1" value={foodAmount} onChange={(event) => { setFoodAmount(event.target.value); setEstimate(null); setMatchGroups([]); }} /></label>
          <label><span>Enhet</span><select value={foodUnit} onChange={(event) => { setFoodUnit(event.target.value); setEstimate(null); setMatchGroups([]); }}><option value="g">gram (g)</option><option value="kg">kilogram (kg)</option><option value="dl">deciliter (dl)</option><option value="ml">milliliter (ml)</option><option value="st">styck</option><option value="portion">portion</option><option value="msk">matsked (msk)</option><option value="tsk">tesked (tsk)</option></select></label>
        </div>
        <div className="quick-foods" aria-label="Populära livsmedel">
          <span>Snabbval</span>
          <div>{QUICK_FOODS.map((food) => <button type="button" key={food} onClick={() => { setDescription(food); setEstimate(null); setMatchGroups([]); setError(""); }}>{food}</button>)}</div>
        </div>
        <div className="composer-controls">
          <select value={meal} onChange={(event) => setMeal(event.target.value)} aria-label="Måltidstyp"><option>Frukost</option><option>Lunch</option><option>Middag</option><option>Mellanmål</option></select>
          <button type="button" onClick={() => cameraInput.current?.click()}><Camera size={17} /> Kamera</button>
          <button type="button" onClick={() => galleryInput.current?.click()}><ImagePlus size={17} /> Bild</button>
          <input ref={cameraInput} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={(event) => void selectImage(event.target.files?.[0])} />
          <input ref={galleryInput} className="visually-hidden" type="file" accept="image/*" onChange={(event) => void selectImage(event.target.files?.[0])} />
        </div>

        {imagePreview && (
          <div className="food-photo-preview">
            <span className="food-photo-preview-image" role="img" aria-label="Vald måltidsbild" style={{ backgroundImage: `url(${imagePreview})` }} />
            <span><Camera size={14} /> Sparas med loggen</span>
            <button type="button" onClick={clearImage} aria-label="Ta bort vald bild"><X size={17} /></button>
          </div>
        )}

        <div className="composer-actions">
          <button className="primary-action" type="button" disabled={status !== "idle" || !description.trim()} onClick={() => void analyzeMeal()}>
            {status === "analyzing" || status === "preparing" ? <LoaderCircle className="spin" size={18} /> : <Database size={18} />}
            {status === "preparing" ? "Förbereder bild …" : status === "analyzing" ? "Söker i databasen …" : "Hämta kcal & protein"}
          </button>
          <button className="manual-link" type="button" disabled={status !== "idle"} onClick={startManualEntry}>Fyll i manuellt</button>
        </div>

        {error && <div className="nutrition-notice error"><CircleAlert size={16} />{error}</div>}
        {success && <div className="nutrition-notice success"><Check size={16} />{success}</div>}

        {matchGroups.length > 0 && (
          <div className="food-match-panel">
            <div className="food-match-heading"><span><Database size={17} /><strong>Bästa träffarna</strong></span><small>Kontrollera variant och mängd.</small></div>
            {matchGroups.map((group, groupIndex) => {
              const selectedCandidate = group.candidates.find((candidate) => candidate.id === group.selectedId);
              return (
                <fieldset className="food-match-group" key={`${group.original}-${groupIndex}`}>
                  <legend><span>{group.original}</span><small>{group.amount}</small></legend>
                  <div>
                    {group.candidates.map((candidate) => (
                      <button className={group.selectedId === candidate.id ? "selected" : ""} type="button" key={candidate.id} aria-pressed={group.selectedId === candidate.id} onClick={() => chooseCandidate(groupIndex, candidate.id)}>
                        <span><strong>{candidate.name}</strong><small>{candidate.brand ? `${candidate.brand} · ` : ""}{candidate.group}{candidate.popular ? " · TRÄNINGSFAVORIT" : ""}</small></span>
                        <span><strong>{candidate.item.calories} kcal</strong><small>{formatNumber(candidate.item.protein)} g protein · {candidate.item.amount}</small></span>
                        <span className="food-match-macros"><small>per 100 {candidate.basisUnit}</small><b>P {formatNumber(candidate.per100.protein)} · K {candidate.per100.carbs === null ? "–" : formatNumber(candidate.per100.carbs)} · F {candidate.per100.fat === null ? "–" : formatNumber(candidate.per100.fat)}</b></span>
                        <i>{group.selectedId === candidate.id ? <Check size={14} /> : null}</i>
                      </button>
                    ))}
                  </div>
                  {selectedCandidate && <a className="food-match-source" href={selectedCandidate.sourceUrl} target="_blank" rel="noreferrer">Näringskälla: {selectedCandidate.sourceName}</a>}
                </fieldset>
              );
            })}
            <button className="primary-action" type="button" disabled={matchGroups.some((group) => group.selectedId === null)} onClick={useFoodChoices}><Check size={18} /> Använd valda värden</button>
          </div>
        )}

        {estimate && (
          <div className="estimate-review">
            <div className="estimate-review-head"><div><small>GRANSKA UPPSKATTNINGEN</small><strong>Justera före sparning</strong></div><span className={`confidence ${estimate.confidence}`}>{estimate.confidence === "high" ? "Hög" : estimate.confidence === "medium" ? "Medel" : "Låg"} säkerhet</span></div>
            <label className="estimate-title"><span>Måltid</span><input value={estimate.title} onChange={(event) => setEstimate({ ...estimate, title: event.target.value })} /></label>
            <div className="estimate-numbers">
              <label><span>Kalorier</span><div><input type="number" inputMode="numeric" min="0" value={estimate.calories} onChange={(event) => setEstimate({ ...estimate, calories: Number(event.target.value) })} /><i>kcal</i></div></label>
              <label><span>Protein</span><div><input type="number" inputMode="decimal" min="0" step="0.1" value={estimate.protein} onChange={(event) => setEstimate({ ...estimate, protein: Number(event.target.value) })} /><i>g</i></div></label>
            </div>
            {estimate.items.length > 0 && <div className="estimate-items">{estimate.items.map((item, index) => <div key={`${item.name}-${index}`}><span><strong>{item.name}</strong><small>{item.amount}</small>{item.carbs !== undefined && <small>K {item.carbs === null ? "–" : formatNumber(item.carbs)} g · F {item.fat === null ? "–" : formatNumber(item.fat ?? 0)} g · Fiber {item.fiber === null ? "–" : formatNumber(item.fiber ?? 0)} g</small>}</span><span>{item.calories} kcal · {formatNumber(item.protein)} g</span></div>)}</div>}
            {estimate.assumptions.length > 0 && <div className="estimate-assumptions"><Info size={15} /><span><strong>Antaganden</strong>{estimate.assumptions.join(" · ")}</span></div>}
            <p className="estimate-disclaimer">Databasvärdena är per 100 g eller 100 ml. Hushållsmått och produktrecept kan ändra resultatet; kontrollera därför valet och förpackningen före sparning.</p>
            <button className="primary-action" type="button" disabled={status === "saving" || !estimate.title.trim()} onClick={() => void logEstimate()}>{status === "saving" ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />} {status === "saving" ? "Sparar …" : "Bekräfta och logga"}</button>
          </div>
        )}
      </section>

      <section className="daily-log">
        <div className="section-heading"><div><span>{selectedDate === todayKey ? "DAGENS LOGG" : "LOGG FÖR VALD DAG"}</span><h3>{dayEntries.length ? `${dayEntries.length} ${dayEntries.length === 1 ? "måltid" : "måltider"}` : "Inget loggat ännu"}</h3></div><Utensils size={20} /></div>
        {dayEntries.length === 0 ? (
          <div className="food-empty card-surface"><Utensils size={27} /><p>Ingen mat är sparad på {nutritionDateLabel(selectedDate, todayKey).toLowerCase()}.</p></div>
        ) : meals.map((mealName) => {
          const mealEntries = dayEntries.filter((entry) => entry.meal === mealName);
          if (!mealEntries.length) return null;
          return (
            <div className="meal-group" key={mealName}>
              <div className="meal-group-head"><strong>{mealName}</strong><span>{mealEntries.reduce((sum, entry) => sum + entry.calories, 0)} kcal</span></div>
              {mealEntries.map((entry) => (
                <article className="meal-entry" key={entry.id}>
                  {entry.imageKey ? <Image className="meal-entry-photo" src={`/api/nutrition/photo?key=${encodeURIComponent(entry.imageKey)}`} alt={`Måltidsbild för ${entry.name}`} width={78} height={78} unoptimized /> : <span className="meal-entry-icon">{entry.source === "recipe" ? "🍽️" : <Apple size={20} />}</span>}
                  <div className="meal-entry-copy"><span><small>{entry.source === "database" ? "MATDATABAS" : entry.source === "ai-image" ? "ÄLDRE BILDANALYS" : entry.source === "ai-text" ? "ÄLDRE TEXTANALYS" : entry.source === "recipe" ? "RECEPT" : "MANUELL"}</small>{entry.confidence && <i>{entry.confidence === "high" ? "hög" : entry.confidence === "medium" ? "medel" : "låg"} säkerhet</i>}</span><strong>{entry.name}</strong>{entry.description && <p>{entry.description}</p>}</div>
                  <div className="meal-entry-macros"><strong>{entry.calories} kcal</strong><span>{formatNumber(entry.protein)} g protein</span></div>
                  <div className="meal-entry-actions">
                    <button className="meal-edit" type="button" onClick={() => setEditingEntry(entry)} aria-label={`Redigera ${entry.name}`}><Pencil size={15} /></button>
                    <button className="meal-delete" type="button" onClick={() => void removeEntry(entry)} aria-label={`Ta bort ${entry.name}`}><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          );
        })}
      </section>

      <section className="recipe-library">
        <div className="section-heading"><div><span>DINA RECEPT</span><h3>Snabbt att laga, lätt att logga</h3></div><BookOpen size={20} /></div>
        <div className="recipe-grid">
          {RECIPES.map((recipe) => (
            <button className="recipe-card" type="button" key={recipe.id} onClick={() => setSelectedRecipe(recipe)}>
              <span className="recipe-emoji">{recipe.emoji}</span>
              <small>{recipe.category}</small>
              <strong>{recipe.name}</strong>
              <p>{recipe.yield}</p>
              <div><span>{recipe.nutrition.calories} kcal</span><span>{formatNumber(recipe.nutrition.protein)} g protein</span></div>
            </button>
          ))}
        </div>
      </section>

      {selectedRecipe && <RecipeSheet recipe={selectedRecipe} selectedDate={selectedDate} todayKey={todayKey} onSave={onSave} onClose={() => setSelectedRecipe(null)} />}
      {editingEntry && <NutritionEditSheet entry={editingEntry} todayKey={todayKey} onSave={saveEditedEntry} onClose={() => setEditingEntry(null)} />}
    </>
  );
}

function NutritionEditSheet({
  entry,
  todayKey,
  onSave,
  onClose,
}: {
  entry: FoodEntry;
  todayKey: string;
  onSave: (entry: FoodEntry) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(entry.name);
  const [meal, setMeal] = useState(entry.meal);
  const [loggedDate, setLoggedDate] = useState(entryDate(entry, todayKey));
  const [description, setDescription] = useState(entry.description ?? "");
  const [calories, setCalories] = useState(String(entry.calories));
  const [protein, setProtein] = useState(String(entry.protein));
  const [items, setItems] = useState<EditableNutritionItem[]>(() => (entry.details?.items ?? []).map(editableNutritionItem));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function applyItems(next: EditableNutritionItem[]) {
    setItems(next);
    if (!next.length) return;
    setCalories(String(next.reduce((sum, item) => sum + (Number.isFinite(item.calories) ? item.calories : 0), 0)));
    setProtein(String(Math.round(next.reduce((sum, item) => sum + (Number.isFinite(item.protein) ? item.protein : 0), 0) * 10) / 10));
  }

  function updateItem(editorId: string, patch: Partial<EditableNutritionItem>) {
    applyItems(items.map((item) => item.editorId === editorId ? { ...item, ...patch } : item));
  }

  function addItem() {
    applyItems([...items, {
      editorId: crypto.randomUUID(),
      name: "",
      amount: "",
      quantityText: "",
      unitValue: "g",
      calories: items.length ? 0 : Math.max(0, Number(calories.replace(",", ".")) || 0),
      protein: items.length ? 0 : Math.max(0, Number(protein.replace(",", ".")) || 0),
    }]);
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const numericCalories = Number(calories.replace(",", "."));
    const numericProtein = Number(protein.replace(",", "."));
    if (!cleanName) {
      setError("Måltiden behöver ett namn.");
      return;
    }
    if (!loggedDate || loggedDate > todayKey) {
      setError("Välj dagens datum eller ett tidigare datum.");
      return;
    }
    if (!Number.isFinite(numericCalories) || numericCalories < 0 || !Number.isFinite(numericProtein) || numericProtein < 0) {
      setError("Kalorier och protein måste vara noll eller mer.");
      return;
    }
    if (items.some((item) => !item.name.trim())) {
      setError("Alla råvaror behöver ett namn. Ta bort tomma rader som inte ska sparas.");
      return;
    }

    const storedItems = items.map((item) => {
      const quantity = Math.max(0, Number(item.quantityText.replace(",", ".")) || 0);
      const grams = item.unitValue === "g" ? quantity : item.unitValue === "kg" ? quantity * 1000 : item.grams;
      return {
        foodId: item.foodId,
        name: item.name.trim(),
        amount: `${formatNumber(quantity)} ${item.unitValue}`,
        quantity,
        unit: item.unitValue,
        ...(grams ? { grams } : {}),
        calories: Math.max(0, Math.round((Number(item.calories) || 0) * 10) / 10),
        protein: Math.max(0, Math.round((Number(item.protein) || 0) * 10) / 10),
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
      };
    });

    setSaving(true);
    setError("");
    try {
      await onSave({
        ...entry,
        name: cleanName,
        meal,
        description: description.trim(),
        calories: Math.round(numericCalories),
        protein: Math.round(numericProtein * 10) / 10,
        loggedAt: loggedDate === entryDate(entry, todayKey) && entry.loggedAt ? entry.loggedAt : `${loggedDate}T12:00:00.000Z`,
        details: { ...entry.details, items: storedItems },
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Ändringarna kunde inte sparas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop nutrition-edit-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet nutrition-edit-sheet" role="dialog" aria-modal="true" aria-labelledby={`nutrition-edit-${entry.id}`}>
        <div className="sheet-handle" />
        <div className="sheet-head"><div><small>REDIGERA MATLOGG</small><h2 id={`nutrition-edit-${entry.id}`}>Måltid och råvaror</h2><p>Ändringarna sparas på samma loggpost och uppdaterar dagens totalsumma.</p></div><button type="button" onClick={onClose} aria-label="Stäng redigering"><X size={20} /></button></div>
        <form className="nutrition-edit-form" onSubmit={(event) => void submitEdit(event)}>
          <div className="nutrition-edit-main">
            <label className="wide"><span>Namn på maträtt</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} /></label>
            <label><span>Måltid</span><select value={meal} onChange={(event) => setMeal(event.target.value)}><option>Frukost</option><option>Lunch</option><option>Middag</option><option>Mellanmål</option></select></label>
            <label><span>Datum</span><input type="date" value={loggedDate} max={todayKey} onChange={(event) => setLoggedDate(event.target.value)} /></label>
            <label><span>Kalorier</span><div><input type="number" inputMode="numeric" min="0" step="1" value={calories} onChange={(event) => setCalories(event.target.value)} /><i>kcal</i></div></label>
            <label><span>Protein</span><div><input type="number" inputMode="decimal" min="0" step="0.1" value={protein} onChange={(event) => setProtein(event.target.value)} /><i>g</i></div></label>
            <label className="wide"><span>Anteckning</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} placeholder="Valfri anteckning om måltiden" /></label>
          </div>

          <div className="nutrition-ingredient-heading"><div><small>RÅVAROR</small><strong>{items.length ? `${items.length} ${items.length === 1 ? "råvara" : "råvaror"}` : "Inga råvarurader ännu"}</strong></div><button type="button" onClick={addItem}><Plus size={15} /> Lägg till råvara</button></div>
          {items.length > 0 && <p className="nutrition-ingredient-note">När du ändrar kcal eller protein på en råvara räknas måltidens totalsumma om automatiskt.</p>}
          <div className="nutrition-ingredient-list">
            {items.map((item, index) => (
              <fieldset className="nutrition-ingredient-row" key={item.editorId}>
                <legend>Råvara {index + 1}</legend>
                <label className="wide"><span>Namn</span><input value={item.name} onChange={(event) => updateItem(item.editorId, { name: event.target.value })} placeholder="Till exempel vaniljkvarg" /></label>
                <label><span>Mängd</span><input type="number" inputMode="decimal" min="0" step="0.1" value={item.quantityText} onChange={(event) => updateItem(item.editorId, { quantityText: event.target.value })} /></label>
                <label><span>Enhet</span><select value={item.unitValue} onChange={(event) => updateItem(item.editorId, { unitValue: event.target.value })}><option value="g">gram (g)</option><option value="kg">kilogram (kg)</option><option value="dl">deciliter (dl)</option><option value="ml">milliliter (ml)</option><option value="st">styck</option><option value="portion">portion</option><option value="msk">matsked (msk)</option><option value="tsk">tesked (tsk)</option></select></label>
                <label><span>Kalorier</span><div><input type="number" inputMode="decimal" min="0" step="0.1" value={item.calories} onChange={(event) => updateItem(item.editorId, { calories: Math.max(0, Number(event.target.value) || 0) })} /><i>kcal</i></div></label>
                <label><span>Protein</span><div><input type="number" inputMode="decimal" min="0" step="0.1" value={item.protein} onChange={(event) => updateItem(item.editorId, { protein: Math.max(0, Number(event.target.value) || 0) })} /><i>g</i></div></label>
                <button className="nutrition-ingredient-delete" type="button" onClick={() => applyItems(items.filter((current) => current.editorId !== item.editorId))} aria-label={`Ta bort ${item.name || `råvara ${index + 1}`}`}><Trash2 size={15} /> Ta bort råvara</button>
              </fieldset>
            ))}
          </div>

          {error && <div className="nutrition-notice error"><CircleAlert size={16} />{error}</div>}
          <button className="primary-action" type="submit" disabled={saving || !name.trim()}>{saving ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />} {saving ? "Sparar ändringar …" : "Spara ändringar"}</button>
        </form>
      </section>
    </div>
  );
}

function RecipeSheet({ recipe, selectedDate, todayKey, onSave, onClose }: { recipe: Recipe; selectedDate: string; todayKey: string; onSave: (entry: FoodEntry) => Promise<void>; onClose: () => void }) {
  const [amount, setAmount] = useState(recipe.nutrition.defaultAmount);
  const [meal, setMeal] = useState(recipe.category === "Frukost" ? "Frukost" : "Middag");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const factor = recipe.nutrition.basis === "100g" ? amount / 100 : amount;
  const calories = Math.max(0, Math.round(recipe.nutrition.calories * factor));
  const protein = Math.max(0, Math.round(recipe.nutrition.protein * factor * 10) / 10);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function logRecipe() {
    setSaving(true);
    setError("");
    try {
      await onSave({
        id: crypto.randomUUID(),
        name: recipe.name,
        meal,
        calories,
        protein,
        loggedAt: selectedDate === todayKey ? new Date().toISOString() : `${selectedDate}T12:00:00.000Z`,
        source: "recipe",
        confidence: "medium",
        description: `${formatNumber(amount)} ${recipe.nutrition.unit}`,
        details: { recipeId: recipe.id, amount, unit: recipe.nutrition.unit, assumptions: [recipe.nutrition.note] },
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Receptet kunde inte loggas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop recipe-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet recipe-sheet" role="dialog" aria-modal="true" aria-labelledby={`recipe-${recipe.id}`}>
        <div className="sheet-handle" />
        <div className="sheet-head"><div><small>{recipe.category.toUpperCase()}</small><h2 id={`recipe-${recipe.id}`}>{recipe.name}</h2><p>{recipe.yield}</p></div><button type="button" onClick={onClose} aria-label="Stäng recept"><X size={20} /></button></div>
        <div className="recipe-sheet-hero"><span>{recipe.emoji}</span><div><small>UPPSKATTAT NÄRINGSVÄRDE</small><strong>{calories} kcal · {formatNumber(protein)} g protein</strong><p>{recipe.nutrition.note}</p></div></div>
        <div className="recipe-columns">
          <section><h3>Ingredienser</h3><ul>{recipe.ingredients.map((ingredient) => <li key={ingredient}><Check size={14} />{ingredient}</li>)}</ul></section>
          <section><h3>Gör så här</h3><ol>{recipe.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol></section>
        </div>
        <div className="recipe-log-box">
          <div><label><span>Mängd</span><div><input type="number" min="0.1" step={recipe.nutrition.unit === "g" ? 10 : 0.25} value={amount} onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))} /><i>{recipe.nutrition.unit}</i></div></label><label><span>Måltid</span><select value={meal} onChange={(event) => setMeal(event.target.value)}><option>Frukost</option><option>Lunch</option><option>Middag</option><option>Mellanmål</option></select></label></div>
          {error && <div className="nutrition-notice error"><CircleAlert size={15} />{error}</div>}
          <button className="primary-action" type="button" disabled={saving || amount <= 0} onClick={() => void logRecipe()}>{saving ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />} {saving ? "Sparar …" : `Logga ${calories} kcal`}</button>
        </div>
      </section>
    </div>
  );
}

function CoachSheet({ response, onQuestion, onClose }: { response: string; onQuestion: (question: string) => void; onClose: () => void }) {
  const questions = ["Vad ska jag träna idag?", "Bör jag höja vikten?", "Hur mycket protein saknar jag?", "Hur tränar jag om jag sov dåligt?"];
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet coach-sheet" role="dialog" aria-modal="true" aria-label="Joxo PT">
        <div className="sheet-handle" />
        <div className="sheet-head"><div><small>DIN PERSONLIGA COACH</small><h2>Joxo PT</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div>
        <div className="coach-message"><span><Brain size={22} /></span><p>{response || "Vad vill du ha hjälp med?"}</p></div>
        <div className="question-grid">{questions.map((question) => <button key={question} type="button" onClick={() => onQuestion(question)}>{question}<ChevronRight size={15} /></button>)}</div>
        <div className="coach-disclaimer"><HeartPulse size={15} />Coachningen bygger på din logg och ersätter inte medicinsk bedömning.</div>
      </section>
    </div>
  );
}

function SummarySheet({ summary, onClose }: { summary: Summary; onClose: () => void }) {
  return (
    <div className="sheet-backdrop summary-backdrop">
      <section className="summary-sheet" role="dialog" aria-modal="true" aria-label="Pass klart">
        <span className="trophy-burst"><Trophy size={42} /></span>
        <small>PASS KLART</small><h2>Snyggt jobbat!</h2><p>{summary.name} är sparat. Nästa rekommendation bygger på det du faktiskt gjorde.</p>
        <div className="summary-metrics"><div><Clock3 size={17} /><strong>{summary.duration} min</strong><span>tid</span></div><div><Activity size={17} /><strong>{formatNumber(summary.volume / 1000)} t</strong><span>volym</span></div><div><Check size={17} /><strong>{summary.sets}</strong><span>set</span></div></div>
        <button className="primary-action" type="button" onClick={onClose}>Fortsätt <ArrowRight size={18} /></button>
      </section>
    </div>
  );
}
