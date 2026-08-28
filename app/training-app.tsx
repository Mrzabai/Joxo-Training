"use client";

import Image from "next/image";
import {
  Activity,
  Apple,
  Archive,
  ArrowRight,
  BarChart3,
  Bell,
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
  Copy,
  Calculator,
  Database,
  Download,
  Dumbbell,
  ExternalLink,
  Flame,
  Footprints,
  Gauge,
  GripVertical,
  HeartPulse,
  Home,
  ImagePlus,
  Images,
  Info,
  KeyRound,
  Lightbulb,
  LibraryBig,
  Link2,
  ListPlus,
  LoaderCircle,
  Lock,
  LogOut,
  Minus,
  MapPin,
  Mic,
  Moon,
  Music2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserRound,
  Utensils,
  Upload,
  Waves,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PROGRAM, getExerciseAdvice, type Exercise, type WorkoutDay } from "./lib/program";
import { RECIPES, type Recipe } from "./lib/recipes";
import {
  EXERCISE_LIBRARY,
  STRETCH_EXERCISES,
  STRENGTH_EXERCISES,
  WARMUP_EXERCISES,
  effectiveProgram,
  type ExerciseCategory,
  type ExercisePrescription,
  type LibraryExercise,
} from "./lib/training-library";

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
  exercises?: Array<{
    id: string;
    name: string;
    muscle: string;
    volume: number;
    sets: Array<{
      weight: number | null;
      reps: number;
      rpe: number;
      pain: boolean;
    }>;
  }>;
};

type DailyHealthEntry = {
  date: string;
  waterMl: number;
  steps?: number;
  stepsSource?: "Manuell" | "Enhetssensor" | "Apple Health" | "Health Connect" | "Smartklocka";
  weightKg?: number;
  bodyFatKg?: number;
  muscleMassKg?: number;
  creatineTaken: boolean;
  vitaminsTaken: boolean;
  note?: string;
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
    recipeUrl?: string;
    barcode?: string;
    favorite?: boolean;
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

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const QUICK_FOODS = ["Vaniljkvarg", "Lågkalori hallonsylt", "Kycklingfilé", "Havregryn", "Ägg", "KESO", "Wasa Protein+", "ProPud", "Barebells"];

type ProgressPhoto = {
  id: string;
  date: string;
  imageKey: string;
  imageType: string;
  note: string;
  weightKg?: number;
};

type ReminderSettings = {
  workout: boolean;
  protein: boolean;
  creatine: boolean;
  vitamins: boolean;
  nativeEnabled: boolean;
  dailyTime: string;
};

type GoalPlan = {
  targetWeightKg: number;
  desiredWeeklyChangeKg: number;
};

type SavedTrainingProgram = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  days: WorkoutDay[];
};

type SpotifyPlaylist = {
  id: string;
  name: string;
  spotifyId: string;
  url: string;
};

type OtherActivityEntry = {
  id: string;
  date: string;
  type: string;
  durationMinutes: number;
  intensity: "Lugn" | "Medel" | "Hård";
  note?: string;
};

type BackupPayload = {
  format: "joxo-backup-v1";
  exportedAt: string;
  state: Partial<PersistedState>;
  foodEntries: FoodEntry[];
};

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
    waterDate: string;
    entries: FoodEntry[];
  };
  profile: {
    name: string;
    birthDate: string;
    heightCm: number;
    weightKg: number;
    goal: string;
    weeklyGoal: number;
    onboardingCompleted: boolean;
    experienceLevel: "new" | "some" | "experienced";
    trainingLocation: "gym" | "home" | "mixed";
    sessionMinutes: number;
    activityLevel: "low" | "medium" | "high";
    focusAreas: string;
    limitations: string;
    lock?: ProfileLock;
  };
  weightHistory: Array<{ date: string; weight: number }>;
  dailyHealth: DailyHealthEntry[];
  progressPhotos: ProgressPhoto[];
  exerciseSwaps: Record<string, string>;
  exerciseOrder: Record<string, string[]>;
  exerciseSettings: Record<string, ExercisePrescription>;
  customPrograms: SavedTrainingProgram[];
  activeProgramId: string;
  favoriteExerciseIds: string[];
  spotifyPlaylists: SpotifyPlaylist[];
  activeSpotifyPlaylistId: string;
  otherActivities: OtherActivityEntry[];
  goalPlan: GoalPlan;
  reminders: ReminderSettings;
  lastManualBackupAt: string | null;
};

type ProfileLock = {
  salt: string;
  hash: string;
  iterations: number;
};

type LocalProfile = {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lock?: ProfileLock;
};

type ProfileDirectory = {
  activeProfileId: string;
  profiles: LocalProfile[];
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
  nutrition: { calorieTarget: 2500, proteinTarget: 180, waterMl: 0, waterDate: "", entries: [] },
  profile: {
    name: "Jocke",
    birthDate: "1988-04-08",
    heightCm: 190,
    weightKg: 105,
    goal: "Starkare och mer muskler",
    weeklyGoal: 4,
    onboardingCompleted: false,
    experienceLevel: "some",
    trainingLocation: "gym",
    sessionMinutes: 60,
    activityLevel: "medium",
    focusAreas: "",
    limitations: "",
  },
  weightHistory: [{ date: "2026-08-20", weight: 105 }],
  dailyHealth: [],
  progressPhotos: [],
  exerciseSwaps: {},
  exerciseOrder: {},
  exerciseSettings: {},
  customPrograms: [],
  activeProgramId: "joxo-foundation",
  favoriteExerciseIds: [],
  spotifyPlaylists: [{ id: "joxo-beast-mode", name: "Beast Mode", spotifyId: "37i9dQZF1DX76Wlfdnj7AP", url: "https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP" }],
  activeSpotifyPlaylistId: "joxo-beast-mode",
  otherActivities: [],
  goalPlan: { targetWeightKg: 100, desiredWeeklyChangeKg: -0.35 },
  reminders: { workout: true, protein: true, creatine: true, vitamins: true, nativeEnabled: false, dailyTime: "19:00" },
  lastManualBackupAt: null,
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
const weekOverviewLabels = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const STORAGE_KEY = "joxo-training-offline-v1";
const FOOD_STORAGE_KEY = "joxo-food-log-v2";
const THEME_STORAGE_KEY = "joxo-theme";
const OWNER_STORAGE_KEY = "joxo-owner-token-v1";
const LEGACY_OWNER_BACKUP_KEY = "joxo-legacy-owner-token-backup-v1";
const PROFILE_DIRECTORY_KEY = "joxo-profile-directory-v1";
const PROFILE_ENTRY_INTENT_KEY = "joxo-profile-entry-intent-v1";
const TEST_PROFILE_CLEANUP_KEY = "joxo-test-profile-cleanup-v1";
const PASSWORD_ITERATIONS = 120_000;
const BASE_PROGRAM_ID = "joxo-foundation";
const OWNER_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function profileStateKey(token: string) {
  return `joxo-training-profile-v2:${token}`;
}

function profileFoodKey(token: string) {
  return `joxo-food-profile-v3:${token}`;
}

function activateProfileToken(token: string) {
  window.localStorage.setItem(OWNER_STORAGE_KEY, token);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `joxo_owner=${encodeURIComponent(token)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function saveProfileDirectory(directory: ProfileDirectory) {
  window.localStorage.setItem(PROFILE_DIRECTORY_KEY, JSON.stringify(directory));
}

function ensureProfileDirectory(): ProfileDirectory {
  const existingOwnerToken = window.localStorage.getItem(OWNER_STORAGE_KEY);
  if (existingOwnerToken && OWNER_TOKEN_PATTERN.test(existingOwnerToken) && !window.localStorage.getItem(LEGACY_OWNER_BACKUP_KEY)) {
    window.localStorage.setItem(LEGACY_OWNER_BACKUP_KEY, existingOwnerToken);
  }
  let parsed: ProfileDirectory | null = null;
  try {
    const raw = window.localStorage.getItem(PROFILE_DIRECTORY_KEY);
    parsed = raw ? JSON.parse(raw) as ProfileDirectory : null;
  } catch {
    parsed = null;
  }

  let profiles = Array.isArray(parsed?.profiles)
    ? parsed.profiles
      .filter((profile) => profile && typeof profile.id === "string" && typeof profile.name === "string" && OWNER_TOKEN_PATTERN.test(profile.token))
      .map((profile) => ({ ...profile, lock: isProfileLock(profile.lock) ? profile.lock : undefined }))
    : [];
  if (!window.localStorage.getItem(TEST_PROFILE_CLEANUP_KEY)) {
    profiles = profiles.filter((profile) => profile.name.trim().toLowerCase() !== "testprofil");
    window.localStorage.setItem(TEST_PROFILE_CLEANUP_KEY, "done");
  }
  let directory: ProfileDirectory;

  if (profiles.length) {
    const activeProfileId = profiles.some((profile) => profile.id === parsed?.activeProfileId)
      ? parsed!.activeProfileId
      : profiles[0].id;
    directory = { activeProfileId, profiles };
  } else {
    const legacyToken = existingOwnerToken;
    const token = legacyToken && OWNER_TOKEN_PATTERN.test(legacyToken) ? legacyToken : crypto.randomUUID();
    const profile: LocalProfile = {
      id: crypto.randomUUID(),
      name: "Jocke",
      token,
      createdAt: new Date().toISOString(),
    };
    directory = { activeProfileId: profile.id, profiles: [profile] };
  }

  saveProfileDirectory(directory);
  const activeProfile = directory.profiles.find((profile) => profile.id === directory.activeProfileId) ?? directory.profiles[0];
  activateProfileToken(activeProfile.token);
  return directory;
}

function migrateLegacyLocalData(token: string) {
  if (window.localStorage.getItem(LEGACY_OWNER_BACKUP_KEY) !== token) return;
  const scopedStateKey = profileStateKey(token);
  const scopedFoodKey = profileFoodKey(token);
  const legacyState = window.localStorage.getItem(STORAGE_KEY);
  const legacyFood = window.localStorage.getItem(FOOD_STORAGE_KEY);
  if (!window.localStorage.getItem(scopedStateKey) && legacyState) window.localStorage.setItem(scopedStateKey, legacyState);
  if (!window.localStorage.getItem(scopedFoodKey) && legacyFood) window.localStorage.setItem(scopedFoodKey, legacyFood);
}

function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : parts[0]?.slice(0, 2) || "JP").toUpperCase();
}

function isProfileLock(value: unknown): value is ProfileLock {
  if (!value || typeof value !== "object") return false;
  const lock = value as Partial<ProfileLock>;
  return typeof lock.salt === "string" && typeof lock.hash === "string" && typeof lock.iterations === "number" && lock.iterations >= 10_000;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = Uint8Array.from(salt).buffer;
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations }, key, 256);
  return new Uint8Array(bits);
}

async function createProfileLock(password: string): Promise<ProfileLock> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  return { salt: bytesToBase64(salt), hash: bytesToBase64(hash), iterations: PASSWORD_ITERATIONS };
}

async function verifyProfilePassword(password: string, lock: ProfileLock) {
  try {
    const expected = base64ToBytes(lock.hash);
    const actual = await derivePasswordHash(password, base64ToBytes(lock.salt), lock.iterations);
    if (expected.length !== actual.length) return false;
    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ actual[index];
    return difference === 0;
  } catch {
    return false;
  }
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
    dailyHealth: Array.isArray(saved.dailyHealth) ? saved.dailyHealth : [],
    progressPhotos: Array.isArray(saved.progressPhotos) ? saved.progressPhotos : [],
    exerciseSwaps: saved.exerciseSwaps && typeof saved.exerciseSwaps === "object" ? saved.exerciseSwaps : {},
    exerciseOrder: saved.exerciseOrder && typeof saved.exerciseOrder === "object"
      ? Object.fromEntries(Object.entries(saved.exerciseOrder).filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every((id) => typeof id === "string")))
      : {},
    exerciseSettings: saved.exerciseSettings && typeof saved.exerciseSettings === "object" ? saved.exerciseSettings : {},
    customPrograms: Array.isArray(saved.customPrograms) ? saved.customPrograms : [],
    activeProgramId: saved.activeProgramId ?? initialState.activeProgramId,
    favoriteExerciseIds: Array.isArray(saved.favoriteExerciseIds) ? saved.favoriteExerciseIds.filter((id): id is string => typeof id === "string") : [],
    spotifyPlaylists: Array.isArray(saved.spotifyPlaylists) && saved.spotifyPlaylists.length ? saved.spotifyPlaylists : initialState.spotifyPlaylists,
    activeSpotifyPlaylistId: saved.activeSpotifyPlaylistId ?? initialState.activeSpotifyPlaylistId,
    otherActivities: Array.isArray(saved.otherActivities) ? saved.otherActivities : [],
    goalPlan: { ...initialState.goalPlan, ...saved.goalPlan },
    reminders: { ...initialState.reminders, ...saved.reminders },
    lastManualBackupAt: saved.lastManualBackupAt ?? null,
  };
}

function stateForToday(state: PersistedState, todayKey: string): PersistedState {
  const dailyWater = state.dailyHealth.find((entry) => entry.date === todayKey)?.waterMl;
  const legacyWater = !state.nutrition.waterDate || state.nutrition.waterDate === todayKey ? state.nutrition.waterMl : 0;
  return {
    ...state,
    nutrition: {
      ...state.nutrition,
      waterMl: dailyWater ?? legacyWater,
      waterDate: todayKey,
    },
  };
}

function upsertDailyHealth(entries: DailyHealthEntry[], next: DailyHealthEntry) {
  return [next, ...entries.filter((entry) => entry.date !== next.date)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 1000);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(value);
}

function formatClock(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function repRangeLabel(minReps: number, maxReps: number) {
  return minReps === maxReps ? String(minReps) : `${minReps}–${maxReps}`;
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

function estimatedWorkoutMinutes(exercises: Exercise[]) {
  if (!exercises.length) return 0;
  const generalWarmupSeconds = 8 * 60;
  const exerciseSeconds = exercises.reduce((total, exercise) => {
    const averageReps = (exercise.minReps + exercise.maxReps) / 2;
    const workingSeconds = exercise.sets * averageReps * 4;
    const restSeconds = Math.max(0, exercise.sets - 1) * exercise.restSeconds;
    const setupAndTransitionSeconds = 90;
    return total + workingSeconds + restSeconds + setupAndTransitionSeconds;
  }, 0);
  return Math.max(10, Math.round((generalWarmupSeconds + exerciseSeconds) / 300) * 5);
}

function estimatedWorkoutDuration(exercises: Exercise[]) {
  const minutes = estimatedWorkoutMinutes(exercises);
  return minutes ? `≈ ${Math.max(10, minutes - 5)}–${minutes + 5} min` : "≈ 0 min";
}

function spotifyPlaylistId(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname !== "open.spotify.com") return null;
    const match = url.pathname.match(/^\/playlist\/([A-Za-z0-9]+)\/?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function bmiValue(weightKg: number, heightCm: number) {
  if (weightKg <= 0 || heightCm <= 0) return null;
  return Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;
}

function bmiLabel(value: number) {
  if (value < 18.5) return "Undervikt";
  if (value < 25) return "Normalintervall";
  if (value < 30) return "Övervikt";
  return "Obesitas";
}

function latestExercisePerformance(history: HistoryEntry[], exerciseName: string) {
  for (const session of [...history].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))) {
    const exercise = session.exercises?.find((item) => item.name === exerciseName);
    if (exercise?.sets.length) return { session, exercise };
  }
  return null;
}

function smartSetPlan(exercise: Exercise, history: HistoryEntry[]) {
  const previous = latestExercisePerformance(history, exercise.name);
  if (!previous) {
    return {
      sets: createSets(exercise),
      label: "Första loggade passet – välj en vikt med 2–3 reps kvar.",
      previousLabel: "Ingen tidigare logg",
    };
  }

  const completed = previous.exercise.sets;
  const weighted = completed.filter((set) => set.weight !== null && set.weight > 0);
  const baseWeight = weighted[0]?.weight ?? exercise.weight;
  const averageRpe = completed.reduce((sum, set) => sum + set.rpe, 0) / completed.length;
  const minimumReps = Math.min(...completed.map((set) => set.reps));
  const maximumReps = Math.max(...completed.map((set) => set.reps));
  const increment = ["Säte", "Baksida lår", "Framsida lår", "Vader"].includes(exercise.muscle) ? 5 : 2.5;
  let suggestedWeight = baseWeight;
  let suggestedReps = Math.min(exercise.maxReps, Math.max(exercise.minReps, Math.round(completed.reduce((sum, set) => sum + set.reps, 0) / completed.length)));
  let label = `Behåll vikten och försök slå minst ett set med en rep.`;

  if (baseWeight !== null && minimumReps >= exercise.maxReps && averageRpe <= 8) {
    suggestedWeight = Math.round((baseWeight + increment) * 2) / 2;
    suggestedReps = exercise.minReps;
    label = `Alla set nådde toppen av intervallet. Förslag: ${formatNumber(suggestedWeight)} kg × ${suggestedReps}.`;
  } else if (baseWeight !== null && (averageRpe >= 9.5 || minimumReps < exercise.minReps)) {
    suggestedWeight = Math.max(0, Math.round((baseWeight - increment) * 2) / 2);
    suggestedReps = exercise.minReps;
    label = `Senast blev ansträngningen hög. Förslag: ${formatNumber(suggestedWeight)} kg med ren teknik.`;
  } else {
    suggestedReps = Math.min(exercise.maxReps, maximumReps + 1);
    label = `${formatNumber(baseWeight ?? 0)} kg är kvar. Sikta på upp till ${suggestedReps} reps utan att tappa tekniken.`;
  }

  return {
    sets: Array.from({ length: exercise.sets }, () => ({ weight: suggestedWeight, reps: suggestedReps, rpe: 8, done: false, pain: false })),
    label,
    previousLabel: `${progressDateLabel(stockholmDateKey(previous.session.date))}: ${completed.map((set) => `${set.weight === null ? "KV" : `${formatNumber(set.weight)} kg`} × ${set.reps}`).join(" · ")}`,
  };
}

function weightTrend(state: PersistedState) {
  const byDate = new Map<string, number>();
  [...state.weightHistory]
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .forEach((entry) => byDate.set(stockholmDateKey(entry.date), entry.weight));
  state.dailyHealth
    .filter((entry) => entry.weightKg !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((entry) => byDate.set(entry.date, entry.weightKg as number));

  let trend = 0;
  return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, weight], index) => {
    trend = index === 0 ? weight : trend * 0.65 + weight * 0.35;
    return { date, weight, trend: Math.round(trend * 100) / 100 };
  });
}

function observedWeeklyWeightChange(series: ReturnType<typeof weightTrend>) {
  if (series.length < 2) return null;
  const first = series[0];
  const last = series[series.length - 1];
  const days = Math.max(1, Math.round((Date.parse(`${last.date}T12:00:00Z`) - Date.parse(`${first.date}T12:00:00Z`)) / 86_400_000));
  return Math.round(((last.trend - first.trend) / days) * 700) / 100;
}

function projectedGoalDate(todayKey: string, currentWeight: number, plan: GoalPlan) {
  const difference = plan.targetWeightKg - currentWeight;
  if (Math.abs(difference) < 0.1) return todayKey;
  if (plan.desiredWeeklyChangeKg === 0 || Math.sign(difference) !== Math.sign(plan.desiredWeeklyChangeKg)) return null;
  const weeks = Math.abs(difference / plan.desiredWeeklyChangeKg);
  return shiftDate(todayKey, Math.max(1, Math.round(weeks * 7)));
}

function plateLoading(totalWeight: number, barWeight = 20) {
  let remaining = Math.max(0, (totalWeight - barWeight) / 2);
  const plates: number[] = [];
  [25, 20, 15, 10, 5, 2.5, 1.25].forEach((plate) => {
    while (remaining + 0.001 >= plate) {
      plates.push(plate);
      remaining -= plate;
    }
  });
  return { plates, exact: remaining < 0.01 };
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

function isoWeekNumber(date: string) {
  const value = new Date(`${date}T12:00:00.000Z`);
  const isoWeekday = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - isoWeekday);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1, 12));
  return Math.ceil(((value.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function calendarWeek(date: string) {
  const value = new Date(`${date}T12:00:00.000Z`);
  const monday = shiftDate(date, -((value.getUTCDay() + 6) % 7));
  return {
    number: isoWeekNumber(date),
    days: weekOverviewLabels.map((label, index) => {
      const dateKey = shiftDate(monday, index);
      return { label, dateKey, dateNumber: Number(dateKey.slice(-2)) };
    }),
  };
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

type CoachTip = {
  category: "Träning" | "Teknik" | "Progression" | "Återhämtning" | "Kost" | "Mindset";
  title: string;
  body: string;
};

type CoachVideo = {
  title: string;
  channel: string;
  url: string;
  description: string;
};

const COACH_TIPS: CoachTip[] = [
  { category: "Träning", title: "Låt uppvärmningen välja dagsvikten", body: "Gör 2–4 stegrande set. Känns sista uppvärmningen långsam, behåll vikten och vinn på bättre reps i stället." },
  { category: "Teknik", title: "Filma ett arbetsset", body: "Ställ mobilen snett från sidan. Kontrollera rörelsebana, tempo och om de sista repsen fortfarande liknar den första." },
  { category: "Progression", title: "Äg repsen innan du höjer", body: "Nå övre delen av repsintervallet med samma teknik i alla set innan du lägger på minsta möjliga vikt." },
  { category: "Återhämtning", title: "Ett lättare pass räknas fullt ut", body: "Sänk vikten 5–10 procent och lämna 3 reps i tanken när kroppen känns sliten. Kontinuitet slår hjältemod." },
  { category: "Kost", title: "Protein i flera chanser", body: "Fördela dagens protein över 3–5 måltider. Det är enklare att träffa målet när varje måltid får en tydlig proteinkälla." },
  { category: "Mindset", title: "Börja med tio minuter", body: "När motivationen saknas: lova bara uppvärmningen och första övningen. Du får avbryta efter tio minuter, men oftast är du redan igång." },
  { category: "Teknik", title: "Kontrollera den excentriska fasen", body: "Sänk vikten med kontroll i 2–3 sekunder på dagens första set. Det gör det lättare att hitta stabilitet och rätt muskel." },
  { category: "Träning", title: "Prioritera första huvudövningen", body: "Om tiden är knapp: gör huvudövningen och två kompletterande övningar väl. Kapa sist, inte fokus." },
  { category: "Progression", title: "Jaga en liten seger", body: "En extra rep, renare teknik eller samma prestation med lägre RPE är också progression. Allt behöver inte vara mer vikt." },
  { category: "Återhämtning", title: "Sömn förstärker träningen", body: "En jämn läggtid hjälper mer än en perfekt kväll ibland. Sikta på en rutin du kan upprepa även på vardagar." },
  { category: "Kost", title: "Gör nästa måltid enkel", body: "Välj protein, grönsak eller frukt och en kolhydratkälla. Enkel struktur gör bra beslut lättare när energin är låg." },
  { category: "Mindset", title: "Träna identiteten", body: "Målet idag är inte ett perfekt pass. Målet är att vara personen som dyker upp, loggar ärligt och bygger vidare." },
  { category: "Teknik", title: "Spänn innan du lyfter", body: "Skapa buktryck och stabil position innan varje tung rep. En tydlig startposition gör resten av repetitionen enklare." },
  { category: "Träning", title: "Vila till nästa bra set", body: "Ta 2–4 minuter på tunga flerledsövningar och 1–2 minuter på isolationsövningar. Kvalitet styr mer än klockan." },
  { category: "Progression", title: "Behåll två reps i tanken", body: "De flesta arbetsset ger bra effekt utan failure. Spara maximal ansträngning till utvalda, säkra övningar." },
  { category: "Återhämtning", title: "Promenaden är underskattad", body: "En lugn promenad kan hjälpa återhämtning, aptitreglering och vardagsrörelse utan att störa styrkepasset." },
  { category: "Kost", title: "Vätska före törstpanik", body: "Drick regelbundet under dagen och ta ett glas till varje måltid. Justera upp när du svettas mycket." },
  { category: "Mindset", title: "Jämför med din egen logg", body: "Ditt förra liknande pass är den relevanta konkurrenten. Sociala medier visar sällan hela träningshistoriken." },
  { category: "Teknik", title: "Stanna när tekniken ändras", body: "Om rörelsebanan eller kontrollen faller isär är setet färdigt, även om musklerna hade klarat en ful rep till." },
  { category: "Träning", title: "Värm upp specifikt", body: "Inför första övningen behövs flera stegringar. Senare räcker ofta ett lätt orienteringsset innan arbetsvikten." },
  { category: "Progression", title: "Titta på fyra veckor, inte fyra dagar", body: "Kroppsvikt och prestation varierar. Bedöm trenden över flera veckor innan du ändrar planen." },
  { category: "Återhämtning", title: "Smärta är inte ett prestationsmål", body: "Avbryt en rörelse som ger skarp eller ökande smärta och välj en smärtfri variant. Sök vård vid oro eller kvarstående besvär." },
  { category: "Kost", title: "Planera protein när du är mätt", body: "Kvällens stora proteinjakt undviks genom att redan vid frukost bestämma dagens tre viktigaste proteinkällor." },
  { category: "Mindset", title: "Gör tröskeln löjligt låg", body: "Lägg fram kläder, bestäm starttid och skriv första övningen i förväg. Motivation behövs mindre när nästa steg är självklart." },
  { category: "Teknik", title: "Använd samma setup varje gång", body: "Samma grepp, fotplacering och andningsrutin gör tekniken mätbar och hjälper dig hitta vad som faktiskt förbättras." },
  { category: "Träning", title: "Muskeln känner ansträngning, inte ego", body: "Välj en vikt som ger full rörelse och stabil kontroll. Tyngre är bara bättre när repetitionen fortfarande är bra." },
  { category: "Progression", title: "Loggen visar nästa beslut", body: "Skriv vikt, reps och RPE direkt efter setet. Nästa pass ska bygga på vad du gjorde, inte vad du minns." },
  { category: "Återhämtning", title: "Planera en lugnare vecka", body: "När prestation, sömn och motivation sjunker samtidigt kan 5–7 dagar med mindre volym ge mer än att pressa vidare." },
  { category: "Kost", title: "Kalorier är en riktning, inte ett prov", body: "En enskild dag avgör lite. Försök träffa en rimlig veckotrend och återgå till planen vid nästa måltid." },
  { category: "Mindset", title: "Avsluta med nästa start klar", body: "Innan du lämnar gymmet: notera nästa pass och första övningen. Då slipper framtida du fatta beslut i dörren." },
];

const COACH_VIDEOS: CoachVideo[] = [
  {
    title: "Så skapar du mer motivation till gymmet",
    channel: "Renaissance Periodization",
    url: "https://www.youtube.com/watch?v=b9J6t00ihdQ",
    description: "Praktiska idéer om träningsmiljö, variation och hur du hanterar missade pass.",
  },
  {
    title: "Träna för muskeltillväxt – från nybörjare till avancerad",
    channel: "Renaissance Periodization",
    url: "https://www.youtube.com/watch?v=zhP5gsBbgYY",
    description: "En evidensbaserad helhetsbild av hur träningen kan utvecklas med erfarenheten.",
  },
  {
    title: "Återhämtning på varje träningsnivå",
    channel: "Renaissance Periodization",
    url: "https://www.youtube.com/watch?v=CHO5x_3UGMo",
    description: "När och hur belastningen kan sänkas för att du ska kunna fortsätta utvecklas.",
  },
];

function stableCoachIndex(value: string, length: number) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

function coachTipForDate(date: string, offset = 0) {
  return COACH_TIPS[(stableCoachIndex(date, COACH_TIPS.length) + offset) % COACH_TIPS.length];
}

function coachVideoForDate(date: string) {
  return COACH_VIDEOS[stableCoachIndex(`video-${date}`, COACH_VIDEOS.length)];
}

export default function TrainingApp({ todayLabel, greeting, nowIso }: { todayLabel: string; greeting: string; nowIso: string }) {
  const [tab, setTab] = useState<TabId>("today");
  const [state, setState] = useState<PersistedState>(initialState);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [profileDirectory, setProfileDirectory] = useState<ProfileDirectory | null>(null);
  const [ownerToken, setOwnerToken] = useState("");
  const [profileGateOpen, setProfileGateOpen] = useState(true);
  const activeProgramDefinition = useMemo<SavedTrainingProgram>(() => state.customPrograms.find((item) => item.id === state.activeProgramId) ?? {
    id: BASE_PROGRAM_ID,
    name: "Joxo Foundation · 4 dagar",
    description: "Balanserad styrka och hypertrofi för hela kroppen.",
    createdAt: "2026-08-01T00:00:00.000Z",
    days: PROGRAM,
  }, [state.activeProgramId, state.customPrograms]);
  const program = useMemo(
    () => effectiveProgram(activeProgramDefinition.days, state.exerciseSwaps, state.exerciseOrder, state.exerciseSettings),
    [activeProgramDefinition.days, state.exerciseOrder, state.exerciseSettings, state.exerciseSwaps],
  );
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"loading" | "saved" | "offline" | "saving">("loading");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<string>("lower-a");
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachResponse, setCoachResponse] = useState("");
  const [coachTipOffset, setCoachTipOffset] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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
  const coachTip = useMemo(() => coachTipForDate(todayKey, coachTipOffset), [coachTipOffset, todayKey]);
  const coachVideo = useMemo(() => coachVideoForDate(todayKey), [todayKey]);
  const nutritionTotals = useMemo(
    () => totalNutrition(foodEntries.filter((entry) => entryDate(entry, todayKey) === todayKey)),
    [foodEntries, todayKey],
  );

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const directory = ensureProfileDirectory();
      const activeProfile = directory.profiles.find((profile) => profile.id === directory.activeProfileId) ?? directory.profiles[0];
      const token = activeProfile.token;
      migrateLegacyLocalData(token);
      if (!cancelled) {
        setProfileDirectory(directory);
        setOwnerToken(token);
        const entryIntent = window.sessionStorage.getItem(PROFILE_ENTRY_INTENT_KEY);
        if (entryIntent === activeProfile.id) {
          window.sessionStorage.removeItem(PROFILE_ENTRY_INTENT_KEY);
          setProfileGateOpen(false);
        }
      }
      let local: Partial<PersistedState> | null = null;
      let localFood: FoodEntry[] = [];
      try {
        const raw = window.localStorage.getItem(profileStateKey(token));
        local = raw ? (JSON.parse(raw) as Partial<PersistedState>) : null;
        const foodRaw = window.localStorage.getItem(profileFoodKey(token));
        localFood = foodRaw ? (JSON.parse(foodRaw) as FoodEntry[]) : [];
      } catch {
        local = null;
        localFood = [];
      }

      try {
        const [stateResult, foodResult] = await Promise.allSettled([
          fetch("/api/state", { cache: "no-store", headers: { "x-joxo-owner": token } }),
          fetch("/api/nutrition/entries?limit=5000", { cache: "no-store", headers: { "x-joxo-owner": token } }),
        ]);
        const response = stateResult.status === "fulfilled" ? stateResult.value : null;
        const body = response ? (await response.json()) as { state?: Partial<PersistedState> | null } : { state: null };
        const merged = stateForToday(mergeState(body.state ?? local ?? {}), todayKey);
        const resolvedLock = isProfileLock(merged.profile.lock) ? merged.profile.lock : activeProfile.lock;
        const resolvedState = { ...merged, profile: { ...merged.profile, lock: resolvedLock } };
        const legacyFood = (resolvedState.nutrition.entries ?? []).map((entry) => ({
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
          const syncedDirectory = {
            ...directory,
            profiles: directory.profiles.map((profile) => profile.id === activeProfile.id ? { ...profile, lock: resolvedLock } : profile),
          };
          setProfileDirectory(syncedDirectory);
          saveProfileDirectory(syncedDirectory);
          setState({ ...resolvedState, nutrition: { ...resolvedState.nutrition, entries: resolvedFood.slice(0, 500) } });
          setFoodEntries(resolvedFood);
          setSaveStatus(response?.ok ? "saved" : "offline");
          if (response?.ok) setLastSyncedAt(new Date().toISOString());
        }
      } catch {
        if (!cancelled) {
          const merged = stateForToday(mergeState(local ?? {}), todayKey);
          const resolvedLock = isProfileLock(merged.profile.lock) ? merged.profile.lock : activeProfile.lock;
          const resolvedState = { ...merged, profile: { ...merged.profile, lock: resolvedLock } };
          const syncedDirectory = {
            ...directory,
            profiles: directory.profiles.map((profile) => profile.id === activeProfile.id ? { ...profile, lock: resolvedLock } : profile),
          };
          const fallbackFood = localFood.length ? localFood : resolvedState.nutrition.entries.map((entry) => ({ ...entry, loggedAt: entry.loggedAt ?? nowIso }));
          setProfileDirectory(syncedDirectory);
          saveProfileDirectory(syncedDirectory);
          setState({ ...resolvedState, nutrition: { ...resolvedState.nutrition, entries: fallbackFood.slice(0, 500) } });
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
  }, [nowIso, todayKey]);

  useEffect(() => {
    if (!hydrated || !ownerToken) return;
    window.localStorage.setItem(profileStateKey(ownerToken), JSON.stringify(state));
    const timeout = window.setTimeout(async () => {
      setSaveStatus("saving");
      saveAbort.current?.abort();
      const controller = new AbortController();
      saveAbort.current = controller;
      try {
        const response = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-joxo-owner": ownerToken },
          body: JSON.stringify({ state }),
          signal: controller.signal,
        });
        if (response.ok) {
          const saved = (await response.json().catch(() => ({}))) as { savedAt?: string };
          setLastSyncedAt(saved.savedAt ?? new Date().toISOString());
          setSaveStatus("saved");
        } else {
          setSaveStatus("offline");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setSaveStatus("offline");
      }
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [hydrated, ownerToken, state]);

  useEffect(() => {
    if (!hydrated || !ownerToken) return;
    window.localStorage.setItem(profileFoodKey(ownerToken), JSON.stringify(foodEntries.slice(0, 1000)));
  }, [foodEntries, hydrated, ownerToken]);

  useEffect(() => {
    if (!hydrated || !profileDirectory || !state.profile.name.trim()) return;
    const active = profileDirectory.profiles.find((profile) => profile.id === profileDirectory.activeProfileId);
    if (!active || active.name === state.profile.name.trim()) return;
    const nextDirectory = {
      ...profileDirectory,
      profiles: profileDirectory.profiles.map((profile) => profile.id === active.id ? { ...profile, name: state.profile.name.trim() } : profile),
    };
    saveProfileDirectory(nextDirectory);
  }, [hydrated, profileDirectory, state.profile.name]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    if (hydrated) window.localStorage.setItem(THEME_STORAGE_KEY, state.theme);
  }, [hydrated, state.theme]);

  useEffect(() => {
    if (!hydrated || !ownerToken || !state.reminders.nativeEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const [hour, minute] = state.reminders.dailyTime.split(":").map(Number);
    const now = new Date();
    if (now.getHours() * 60 + now.getMinutes() < hour * 60 + minute) return;
    const sentKey = `joxo-reminder-sent-v1:${ownerToken}:${todayKey}`;
    if (window.localStorage.getItem(sentKey)) return;
    const health = state.dailyHealth.find((entry) => entry.date === todayKey);
    const reminders: string[] = [];
    if (state.reminders.workout && !state.history.some((entry) => stockholmDateKey(entry.date) === todayKey)) reminders.push(`${nextPass.name} är nästa pass`);
    if (state.reminders.protein && nutritionTotals.protein < state.nutrition.proteinTarget) reminders.push(`${formatNumber(state.nutrition.proteinTarget - nutritionTotals.protein)} g protein kvar`);
    if (state.reminders.creatine && !health?.creatineTaken) reminders.push("kreatin är inte markerat");
    if (state.reminders.vitamins && !health?.vitaminsTaken) reminders.push("vitaminer är inte markerade");
    if (!reminders.length) return;
    new Notification("Joxo Training", { body: reminders.slice(0, 3).join(" · "), icon: "/icon-192.png" });
    window.localStorage.setItem(sentKey, new Date().toISOString());
  }, [hydrated, nextPass.name, nutritionTotals.protein, ownerToken, state.dailyHealth, state.history, state.nutrition.proteinTarget, state.reminders, todayKey]);

  async function saveFoodEntry(draft: FoodEntry, image: Blob | null = null) {
    if (!ownerToken) throw new Error("Profilen laddas fortfarande. Försök igen om en sekund.");
    let entry = { ...draft };
    let uploadedImageKey: string | null = null;
    if (image) {
      const form = new FormData();
      form.append("image", image, "meal.jpg");
      const uploadResponse = await fetch("/api/nutrition/photo", { method: "POST", headers: { "x-joxo-owner": ownerToken }, body: form });
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
        headers: { "Content-Type": "application/json", "x-joxo-owner": ownerToken },
        body: requestBody,
      });
      if (isExisting && response.status === 404) {
        response = await fetch("/api/nutrition/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-joxo-owner": ownerToken },
          body: requestBody,
        });
      }
    } catch {
      response = null;
    }

    const body = response ? await response.json().catch(() => ({} as { error?: string })) : {};
    if (response && !response.ok && response.status < 500) {
      if (uploadedImageKey) void fetch(`/api/nutrition/photo?key=${encodeURIComponent(uploadedImageKey)}`, { method: "DELETE", headers: { "x-joxo-owner": ownerToken } });
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
    if (!ownerToken) throw new Error("Profilen laddas fortfarande. Försök igen om en sekund.");
    let response: Response | null = null;
    try {
      response = await fetch(`/api/nutrition/entries?id=${encodeURIComponent(entry.id)}`, { method: "DELETE", headers: { "x-joxo-owner": ownerToken } });
    } catch {
      response = null;
    }
    const body = response ? await response.json().catch(() => ({} as { error?: string })) : {};
    if (response && !response.ok && response.status < 500 && response.status !== 404) throw new Error(body.error || "Måltiden kunde inte tas bort.");
    if (!response?.ok) setSaveStatus("offline");
    if (entry.imageKey) void fetch(`/api/nutrition/photo?key=${encodeURIComponent(entry.imageKey)}`, { method: "DELETE", headers: { "x-joxo-owner": ownerToken } }).catch(() => undefined);
    setFoodEntries((current) => current.filter((item) => item.id !== entry.id));
    setState((current) => ({
      ...current,
      nutrition: { ...current.nutrition, entries: current.nutrition.entries.filter((item) => item.id !== entry.id) },
    }));
  }

  function saveWorkoutHistory(entry: HistoryEntry) {
    setState((current) => ({
      ...current,
      history: [entry, ...current.history.filter((item) => item.id !== entry.id)]
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .slice(0, 500),
    }));
  }

  function deleteWorkoutHistory(entryId: string) {
    setState((current) => ({ ...current, history: current.history.filter((entry) => entry.id !== entryId) }));
  }

  function saveDailyHealth(entry: DailyHealthEntry) {
    setState((current) => {
      const otherWeights = current.weightHistory.filter((item) => stockholmDateKey(item.date) !== entry.date);
      const weightHistory = entry.weightKg === undefined
        ? otherWeights
        : [{ date: `${entry.date}T12:00:00.000Z`, weight: entry.weightKg }, ...otherWeights].slice(0, 1000);
      return {
        ...current,
        nutrition: entry.date === todayKey
          ? { ...current.nutrition, waterMl: entry.waterMl, waterDate: todayKey }
          : current.nutrition,
        weightHistory,
        dailyHealth: upsertDailyHealth(current.dailyHealth, entry),
      };
    });
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
        if (!logs[exercise.id]) logs[exercise.id] = smartSetPlan(exercise, current.history).sets;
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
    const exerciseHistory = activePass.exercises.map((exercise) => {
      const sets = (state.logs[exercise.id] ?? []).filter((set) => set.done).map((set) => ({
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        pain: set.pain,
      }));
      return {
        id: exercise.id,
        name: exercise.name,
        muscle: exercise.muscle,
        volume: sets.reduce((sum, set) => sum + (set.weight ?? 0) * set.reps, 0),
        sets,
      };
    }).filter((exercise) => exercise.sets.length > 0);
    const completed = exerciseHistory.flatMap((exercise) => exercise.sets);
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
      exercises: exerciseHistory,
    };
    const nextIndex = activePass.number % program.length;
    setState((current) => ({
      ...current,
      activePassId: null,
      sessionStartedAt: null,
      nextPassId: program[nextIndex].id,
      history: [historyEntry, ...current.history].slice(0, 500),
    }));
    setRest(null);
    setSummary({ name: activePass.name, duration, volume, sets: completed.length });
    setTab("today");
  }

  function showNextCoachTip() {
    const nextOffset = coachTipOffset + 1;
    const nextTip = coachTipForDate(todayKey, nextOffset);
    setCoachTipOffset(nextOffset);
    setCoachResponse(`${nextTip.title}: ${nextTip.body}`);
    setCoachOpen(true);
  }

  function applySetSuggestion(exercise: Exercise) {
    setState((current) => ({
      ...current,
      logs: { ...current.logs, [exercise.id]: smartSetPlan(exercise, current.history).sets },
    }));
  }

  function restoreBackup(payload: BackupPayload) {
    if (payload.format !== "joxo-backup-v1" || !payload.state || !Array.isArray(payload.foodEntries)) {
      throw new Error("Filen är inte en giltig Joxo-säkerhetskopia.");
    }
    const restored = stateForToday(mergeState(payload.state), todayKey);
    setState(restored);
    setFoodEntries(payload.foodEntries.slice(0, 1000));
    if (ownerToken) {
      window.localStorage.setItem(profileStateKey(ownerToken), JSON.stringify(restored));
      window.localStorage.setItem(profileFoodKey(ownerToken), JSON.stringify(payload.foodEntries.slice(0, 1000)));
    }
  }

  function askCoach(question: string) {
    const readiness = state.readiness;
    const normalized = question.toLocaleLowerCase("sv-SE");
    const workingSets = nextPass.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    if (normalized.includes("höja") || normalized.includes("vikt")) {
      setCoachResponse("Höj först när du når övre delen av repsintervallet i alla arbetsset med stabil teknik och ungefär två reps kvar. Lägg då på minsta möjliga vikt. Om bara sista setet når målet: behåll vikten nästa gång.");
    } else if (normalized.includes("sov") || normalized.includes("återhämt")) {
      setCoachResponse(readiness.sleep < 6 ? "Kör gärna, men sänk förväntningen: håll 2–3 reps i tanken, kapa ett isolationsset vid behov och jaga inga personbästan idag." : "Din sömn ser tillräcklig ut för ett normalt pass. Låt uppvärmningen avgöra om dagens vikter känns rätt.");
    } else if (normalized.includes("protein")) {
      const remaining = Math.max(0, state.nutrition.proteinTarget - nutritionTotals.protein);
      setCoachResponse(`Du har ${formatNumber(remaining)} g protein kvar till dagens startmål. Fördela det gärna över resten av dagens måltider.`);
    } else if (normalized.includes("värm")) {
      setCoachResponse(`Inför ${nextPass.name}: börja med 4–6 minuter lätt rörelse. Gör sedan 2–4 stegrande set i första övningen utan att trötta ut dig. I senare övningar räcker oftast ett lätt orienteringsset.`);
    } else if (normalized.includes("tid") || normalized.includes("snabb")) {
      const priorities = nextPass.exercises.slice(0, 3).map((exercise) => exercise.name).join(", ");
      setCoachResponse(`Om tiden är knapp, prioritera ${priorities}. Behåll ordinarie vila i första övningen och korta hellre ned isolationsdelen. Ett fokuserat 35-minuterspass är bättre än att hoppa över allt.`);
    } else if (normalized.includes("träningsvärk") || normalized.includes("öm")) {
      setCoachResponse(readiness.soreness >= 4 ? `Du har skattat hög träningsvärk. Testa uppvärmningen till ${nextPass.name}; om rörelse eller prestation tydligt begränsas, flytta passet eller sänk volymen med ungefär en tredjedel.` : "Din registrerade träningsvärk ser hanterbar ut. Värm upp gradvis och fortsätt om rörelsen känns normal och smärtfri.");
    } else if (normalized.includes("motivation") || normalized.includes("pepp")) {
      setCoachResponse("Sänk startkravet: byt om, värm upp och gör första övningens första arbetsset. Du behöver inte känna motivation före handling – den kommer ofta efter att du har börjat.");
    } else if (normalized.includes("ont") || normalized.includes("smärta")) {
      setCoachResponse("Träna inte igenom skarp, ökande eller ovanlig smärta. Avbryt den rörelsen och välj en smärtfri variant. Vid kvarstående besvär, svullnad, domningar eller oro bör du få en medicinsk bedömning.");
    } else if (normalized.includes("platå") || normalized.includes("stannat")) {
      setCoachResponse("Kontrollera först fyra saker i loggen: samma teknik, tillräcklig vila mellan set, rimlig ansträngning och minst två veckors trend. Om allt stämmer kan en lätt vecka följd av en liten vikt- eller repsökning vara nästa steg.");
    } else if (normalized.includes("kalori") || normalized.includes("äta")) {
      const remaining = state.nutrition.calorieTarget - nutritionTotals.calories;
      setCoachResponse(remaining > 0 ? `Du har ungefär ${formatNumber(remaining)} kcal kvar till dagens startmål. Tänk veckotrend och bygg nästa måltid kring protein, något grönt och en kolhydratkälla.` : `Du ligger ungefär ${formatNumber(Math.abs(remaining))} kcal över startmålet idag. Ingen panik och ingen kompensationssvält – återgå till din vanliga struktur vid nästa måltid.`);
    } else if (normalized.includes("tips") || normalized.includes("idé")) {
      showNextCoachTip();
      return;
    } else if (normalized.includes("idag") || normalized.includes("träna")) {
      setCoachResponse(`${nextPass.name} står näst i ordningen med ${nextPass.exercises.length} övningar och ${workingSets} arbetsset. Sikta på ungefär 1–3 reps kvar, logga varje arbetsset och låt uppvärmningen bestämma dagsvikten.`);
    } else {
      const selectedTip = COACH_TIPS[stableCoachIndex(`${todayKey}-${normalized}-${state.history.length}`, COACH_TIPS.length)];
      setCoachResponse(`${selectedTip.title}: ${selectedTip.body}`);
    }
    setCoachOpen(true);
  }

  function persistCurrentProfileBeforeSwitch() {
    if (!ownerToken) return;
    saveAbort.current?.abort();
    window.localStorage.setItem(profileStateKey(ownerToken), JSON.stringify(state));
    window.localStorage.setItem(profileFoodKey(ownerToken), JSON.stringify(foodEntries.slice(0, 1000)));
    void fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-joxo-owner": ownerToken },
      body: JSON.stringify({ state }),
      keepalive: true,
    }).catch(() => undefined);
  }

  function openProfile(directory: ProfileDirectory, token: string, enterAfterReload: boolean) {
    persistCurrentProfileBeforeSwitch();
    saveProfileDirectory(directory);
    activateProfileToken(token);
    if (enterAfterReload) window.sessionStorage.setItem(PROFILE_ENTRY_INTENT_KEY, directory.activeProfileId);
    else window.sessionStorage.removeItem(PROFILE_ENTRY_INTENT_KEY);
    window.location.reload();
  }

  function enterProfile(profileId: string) {
    if (!profileDirectory) return;
    if (profileId === profileDirectory.activeProfileId) {
      setProfileGateOpen(false);
      return;
    }
    switchProfile(profileId, true);
  }

  function switchProfile(profileId: string, enterAfterReload = false) {
    if (!profileDirectory || profileId === profileDirectory.activeProfileId) return;
    const profile = profileDirectory.profiles.find((item) => item.id === profileId);
    if (!profile) return;
    const profiles = profileDirectory.profiles.map((item) => item.id === profileDirectory.activeProfileId && state.profile.name.trim()
      ? { ...item, name: state.profile.name.trim() }
      : item);
    openProfile({ ...profileDirectory, activeProfileId: profile.id, profiles }, profile.token, enterAfterReload);
  }

  function createProfile(name: string) {
    if (!profileDirectory) return;
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Skriv ett namn på profilen.");
    const profile: LocalProfile = { id: crypto.randomUUID(), name: cleanName, token: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const profileState: PersistedState = {
      ...initialState,
      theme: state.theme,
      profile: {
        ...initialState.profile,
        name: cleanName,
        birthDate: "",
        heightCm: 0,
        weightKg: 0,
        goal: "",
        weeklyGoal: 3,
        onboardingCompleted: false,
        experienceLevel: "new",
        trainingLocation: "gym",
        sessionMinutes: 60,
        activityLevel: "medium",
        focusAreas: "",
        limitations: "",
      },
      nutrition: { ...initialState.nutrition, calorieTarget: 2500, proteinTarget: 150 },
      readiness: { ...initialState.readiness },
      logs: {},
      history: [],
      weightHistory: [],
      dailyHealth: [],
    };
    window.localStorage.setItem(profileStateKey(profile.token), JSON.stringify(profileState));
    window.localStorage.setItem(profileFoodKey(profile.token), "[]");
    const existingProfiles = profileDirectory.profiles.map((item) => item.id === profileDirectory.activeProfileId && state.profile.name.trim()
      ? { ...item, name: state.profile.name.trim() }
      : item);
    const directory = { activeProfileId: profile.id, profiles: [...existingProfiles, profile] };
    openProfile(directory, profile.token, true);
  }

  function connectProfile(name: string, profileCode: string) {
    if (!profileDirectory) return;
    const cleanName = name.trim();
    const token = profileCode.trim().toLowerCase();
    if (!cleanName) throw new Error("Skriv vem profilen tillhör.");
    if (!OWNER_TOKEN_PATTERN.test(token)) throw new Error("Profilkoden har fel format. Klistra in hela koden.");
    const existing = profileDirectory.profiles.find((profile) => profile.token === token);
    if (existing) {
      switchProfile(existing.id, false);
      return;
    }
    const profile: LocalProfile = { id: crypto.randomUUID(), name: cleanName, token, createdAt: new Date().toISOString() };
    const existingProfiles = profileDirectory.profiles.map((item) => item.id === profileDirectory.activeProfileId && state.profile.name.trim()
      ? { ...item, name: state.profile.name.trim() }
      : item);
    openProfile({ activeProfileId: profile.id, profiles: [...existingProfiles, profile] }, token, false);
  }

  async function setProfilePassword(currentPassword: string, newPassword: string) {
    if (!profileDirectory) throw new Error("Profilen är inte redo ännu.");
    const activeProfile = profileDirectory.profiles.find((profile) => profile.id === profileDirectory.activeProfileId);
    if (!activeProfile) throw new Error("Profilen kunde inte hittas.");
    if (activeProfile.lock && !await verifyProfilePassword(currentPassword, activeProfile.lock)) throw new Error("Nuvarande lösenord är fel.");
    if (newPassword.length < 4) throw new Error("Lösenordet måste innehålla minst fyra tecken.");
    const lock = await createProfileLock(newPassword);
    const nextDirectory = {
      ...profileDirectory,
      profiles: profileDirectory.profiles.map((profile) => profile.id === activeProfile.id ? { ...profile, lock } : profile),
    };
    setProfileDirectory(nextDirectory);
    saveProfileDirectory(nextDirectory);
    setState((current) => ({ ...current, profile: { ...current.profile, lock } }));
  }

  async function removeProfilePassword(currentPassword: string) {
    if (!profileDirectory) throw new Error("Profilen är inte redo ännu.");
    const activeProfile = profileDirectory.profiles.find((profile) => profile.id === profileDirectory.activeProfileId);
    if (!activeProfile?.lock) return;
    if (!await verifyProfilePassword(currentPassword, activeProfile.lock)) throw new Error("Nuvarande lösenord är fel.");
    const nextDirectory = {
      ...profileDirectory,
      profiles: profileDirectory.profiles.map((profile) => profile.id === activeProfile.id ? { ...profile, lock: undefined } : profile),
    };
    setProfileDirectory(nextDirectory);
    saveProfileDirectory(nextDirectory);
    setState((current) => ({ ...current, profile: { ...current.profile, lock: undefined } }));
  }

  function logOut() {
    persistCurrentProfileBeforeSwitch();
    window.sessionStorage.removeItem(PROFILE_ENTRY_INTENT_KEY);
    setSelectedDay(null);
    setTab("today");
    setProfileGateOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finishOnboarding(profile: PersistedState["profile"], nutritionTargets: { calorieTarget: number; proteinTarget: number }) {
    const completedProfile = { ...profile, onboardingCompleted: true };
    const losingWeight = /fett|minska|tappa/i.test(profile.goal);
    const gainingWeight = /bygg|musk|stark/i.test(profile.goal) && !losingWeight;
    setState((current) => ({
      ...current,
      profile: completedProfile,
      goalPlan: {
        targetWeightKg: Math.max(30, Math.round((profile.weightKg + (losingWeight ? -5 : gainingWeight ? 3 : 0)) * 10) / 10),
        desiredWeeklyChangeKg: losingWeight ? -0.35 : gainingWeight ? 0.2 : 0,
      },
      nutrition: {
        ...current.nutrition,
        calorieTarget: nutritionTargets.calorieTarget,
        proteinTarget: nutritionTargets.proteinTarget,
      },
      weightHistory: profile.weightKg > 0 && current.weightHistory.length === 0
        ? [{ date: new Date().toISOString(), weight: profile.weightKg }]
        : current.weightHistory,
    }));
  }

  function createTrainingProgram(name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    const id = crypto.randomUUID();
    const days = program.map((day, dayIndex) => ({
      ...day,
      id: `${id}-day-${dayIndex + 1}`,
      number: dayIndex + 1,
      exercises: day.exercises.map((exercise, exerciseIndex) => ({ ...exercise, id: crypto.randomUUID(), order: exerciseIndex + 1 })),
    }));
    const nextProgram: SavedTrainingProgram = {
      id,
      name: cleanName,
      description: `Eget program byggt från ${activeProgramDefinition.name}.`,
      createdAt: new Date().toISOString(),
      days,
    };
    setState((current) => ({ ...current, customPrograms: [...current.customPrograms, nextProgram], activeProgramId: id, activePassId: null, nextPassId: days[0].id }));
    setOpenDay(days[0].id);
  }

  function switchTrainingProgram(programId: string) {
    if (state.activePassId) return;
    const definition = programId === BASE_PROGRAM_ID
      ? { days: PROGRAM }
      : state.customPrograms.find((item) => item.id === programId);
    if (!definition?.days.length) return;
    setState((current) => ({ ...current, activeProgramId: programId, activePassId: null, nextPassId: definition.days[0].id }));
    setOpenDay(definition.days[0].id);
  }

  function deleteTrainingProgram(programId: string) {
    if (programId === BASE_PROGRAM_ID || state.activePassId) return;
    setState((current) => ({
      ...current,
      customPrograms: current.customPrograms.filter((item) => item.id !== programId),
      activeProgramId: BASE_PROGRAM_ID,
      nextPassId: PROGRAM[0].id,
      activePassId: null,
    }));
    setOpenDay(PROGRAM[0].id);
  }

  function addExerciseToProgram(dayId: string, exercise: Exercise) {
    const sourceDayIndex = program.findIndex((day) => day.id === dayId);
    if (sourceDayIndex < 0) return;
    setState((current) => {
      const exerciseToAdd: Exercise = { ...exercise, id: crypto.randomUUID(), order: program[sourceDayIndex].exercises.length + 1, sets: 3, minReps: 6, maxReps: 6, startReps: 6 };
      if (current.activeProgramId === BASE_PROGRAM_ID) {
        const programId = crypto.randomUUID();
        const nextPassIndex = Math.max(0, program.findIndex((day) => day.id === current.nextPassId));
        const preserveActiveWorkout = Boolean(current.activePassId);
        const days = program.map((day, dayIndex) => ({
          ...day,
          id: preserveActiveWorkout ? day.id : `${programId}-day-${dayIndex + 1}`,
          exercises: day.exercises.map((item, exerciseIndex) => ({ ...item, id: preserveActiveWorkout ? item.id : crypto.randomUUID(), order: exerciseIndex + 1 })),
        }));
        days[sourceDayIndex] = {
          ...days[sourceDayIndex],
          exercises: [...days[sourceDayIndex].exercises, exerciseToAdd],
        };
        const copyNumber = current.customPrograms.length + 1;
        const nextProgram: SavedTrainingProgram = { id: programId, name: `Mitt Joxo-program ${copyNumber}`, description: "Redigerbar kopia av Joxo Foundation.", createdAt: new Date().toISOString(), days };
        const logs = current.activePassId === days[sourceDayIndex].id ? { ...current.logs, [exerciseToAdd.id]: createSets(exerciseToAdd) } : current.logs;
        const nextPassId = days.some((day) => day.id === current.nextPassId) ? current.nextPassId : days[nextPassIndex]?.id ?? days[0].id;
        return { ...current, logs, customPrograms: [...current.customPrograms, nextProgram], activeProgramId: programId, nextPassId };
      }
      const customPrograms = current.customPrograms.map((savedProgram) => savedProgram.id !== current.activeProgramId ? savedProgram : {
        ...savedProgram,
        days: savedProgram.days.map((day) => day.id !== dayId ? day : {
          ...day,
          exercises: [...day.exercises, exerciseToAdd],
        }),
      });
      const logs = current.activePassId === dayId ? { ...current.logs, [exerciseToAdd.id]: createSets(exerciseToAdd) } : current.logs;
      return { ...current, logs, customPrograms };
    });
    if (state.activeProgramId === BASE_PROGRAM_ID) setOpenDay("");
  }

  function removeExerciseFromProgram(dayId: string, exerciseId: string) {
    const sourceDayIndex = program.findIndex((day) => day.id === dayId);
    const sourceExerciseIndex = program[sourceDayIndex]?.exercises.findIndex((exercise) => exercise.id === exerciseId) ?? -1;
    if (sourceDayIndex < 0 || sourceExerciseIndex < 0) return;
    const hasCompletedSets = state.activePassId === dayId && state.logs[exerciseId]?.some((set) => set.done);
    if (hasCompletedSets) {
      window.alert("Övningen har redan klara set i det pågående passet. Avsluta eller återställ passet innan du tar bort den.");
      return;
    }
    setState((current) => {
      if (current.activePassId === dayId && current.logs[exerciseId]?.some((set) => set.done)) return current;
      const logs = { ...current.logs };
      delete logs[exerciseId];
      const exerciseSwaps = Object.fromEntries(Object.entries(current.exerciseSwaps).filter(([slotId]) => slotId !== exerciseId));
      const exerciseSettings = Object.fromEntries(Object.entries(current.exerciseSettings).filter(([slotId]) => slotId !== exerciseId));
      const exerciseOrder = Object.fromEntries(Object.entries(current.exerciseOrder).map(([savedDayId, order]) => [savedDayId, savedDayId === dayId ? order.filter((id) => id !== exerciseId) : order]));
      if (current.activeProgramId === BASE_PROGRAM_ID) {
        const programId = crypto.randomUUID();
        const nextPassIndex = Math.max(0, program.findIndex((day) => day.id === current.nextPassId));
        const preserveActiveWorkout = Boolean(current.activePassId);
        const days = program.map((day, dayIndex) => ({
          ...day,
          id: preserveActiveWorkout ? day.id : `${programId}-day-${dayIndex + 1}`,
          exercises: day.exercises
            .filter((_, exerciseIndex) => dayIndex !== sourceDayIndex || exerciseIndex !== sourceExerciseIndex)
            .map((exercise, exerciseIndex) => ({ ...exercise, id: preserveActiveWorkout ? exercise.id : crypto.randomUUID(), order: exerciseIndex + 1 })),
        }));
        const copyNumber = current.customPrograms.length + 1;
        const nextProgram: SavedTrainingProgram = { id: programId, name: `Mitt Joxo-program ${copyNumber}`, description: "Redigerbar kopia av Joxo Foundation.", createdAt: new Date().toISOString(), days };
        const nextPassId = days.some((day) => day.id === current.nextPassId) ? current.nextPassId : days[nextPassIndex]?.id ?? days[0].id;
        return { ...current, logs, exerciseSwaps, exerciseSettings, exerciseOrder, customPrograms: [...current.customPrograms, nextProgram], activeProgramId: programId, nextPassId };
      }
      const customPrograms = current.customPrograms.map((savedProgram) => savedProgram.id !== current.activeProgramId ? savedProgram : {
        ...savedProgram,
        days: savedProgram.days.map((day) => day.id !== dayId ? day : {
          ...day,
          exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId).map((exercise, index) => ({ ...exercise, order: index + 1 })),
        }),
      });
      return { ...current, logs, exerciseSwaps, exerciseSettings, exerciseOrder, customPrograms };
    });
    if (state.activeProgramId === BASE_PROGRAM_ID) setOpenDay("");
  }

  function toggleFavoriteExercise(exerciseId: string) {
    setState((current) => ({
      ...current,
      favoriteExerciseIds: current.favoriteExerciseIds.includes(exerciseId)
        ? current.favoriteExerciseIds.filter((id) => id !== exerciseId)
        : [...current.favoriteExerciseIds, exerciseId],
    }));
  }

  function configureTrainingDays(dayNames: string[]) {
    const names = dayNames.slice(0, 7).map((name, index) => name.trim() || `Träningsdag ${index + 1}`);
    if (!names.length) return;
    setState((current) => {
      const activePassIndex = current.activePassId ? program.findIndex((day) => day.id === current.activePassId) : -1;
      if (activePassIndex >= names.length) return current;
      if (current.activeProgramId === BASE_PROGRAM_ID) {
        const programId = crypto.randomUUID();
        const previousNextIndex = Math.max(0, program.findIndex((day) => day.id === current.nextPassId));
        const days = names.map((name, dayIndex): WorkoutDay => {
          const existing = program[dayIndex];
          if (!existing) return { id: `${programId}-day-${dayIndex + 1}`, number: dayIndex + 1, name, focus: "Bygg passet i övningsbanken", style: "Eget pass", duration: "45–75 min", exercises: [] };
          if (current.activePassId) return { ...existing, number: dayIndex + 1, name };
          return {
            ...existing,
            id: `${programId}-day-${dayIndex + 1}`,
            number: dayIndex + 1,
            name,
            exercises: existing.exercises.map((exercise, exerciseIndex) => ({ ...exercise, id: crypto.randomUUID(), order: exerciseIndex + 1 })),
          };
        });
        const copyNumber = current.customPrograms.length + 1;
        const nextProgram: SavedTrainingProgram = { id: programId, name: `Mitt Joxo-program ${copyNumber}`, description: `${days.length} egna träningsdagar.`, createdAt: new Date().toISOString(), days };
        const nextPassId = days.some((day) => day.id === current.nextPassId)
          ? current.nextPassId
          : days[Math.min(previousNextIndex, days.length - 1)].id;
        return { ...current, customPrograms: [...current.customPrograms, nextProgram], activeProgramId: programId, nextPassId };
      }
      const savedProgram = current.customPrograms.find((item) => item.id === current.activeProgramId);
      if (!savedProgram) return current;
      const days = names.map((name, dayIndex): WorkoutDay => {
        const existing = savedProgram.days[dayIndex];
        return existing
          ? { ...existing, number: dayIndex + 1, name }
          : { id: `${savedProgram.id}-day-${crypto.randomUUID()}`, number: dayIndex + 1, name, focus: "Bygg passet i övningsbanken", style: "Eget pass", duration: "45–75 min", exercises: [] };
      });
      const nextPassId = days.some((day) => day.id === current.nextPassId) ? current.nextPassId : days[0].id;
      return { ...current, customPrograms: current.customPrograms.map((item) => item.id === savedProgram.id ? { ...item, description: `${days.length} egna träningsdagar.`, days } : item), nextPassId };
    });
    setOpenDay("");
  }

  function updateTodaySteps(steps: number, source: DailyHealthEntry["stepsSource"]) {
    setState((current) => {
      const existing = current.dailyHealth.find((entry) => entry.date === todayKey) ?? { date: todayKey, waterMl: current.nutrition.waterMl, creatineTaken: false, vitaminsTaken: false };
      return { ...current, dailyHealth: upsertDailyHealth(current.dailyHealth, { ...existing, steps: Math.max(0, Math.round(steps)), stepsSource: source }) };
    });
  }

  function addOtherActivity(entry: Omit<OtherActivityEntry, "id" | "date">) {
    setState((current) => ({ ...current, otherActivities: [{ ...entry, id: crypto.randomUUID(), date: new Date().toISOString() }, ...current.otherActivities].slice(0, 500) }));
  }

  function addSpotifyPlaylist(name: string, url: string) {
    const id = spotifyPlaylistId(url);
    if (!id || !name.trim()) return false;
    const playlist: SpotifyPlaylist = { id: crypto.randomUUID(), name: name.trim(), spotifyId: id, url: `https://open.spotify.com/playlist/${id}` };
    setState((current) => ({ ...current, spotifyPlaylists: [...current.spotifyPlaylists.filter((item) => item.spotifyId !== id), playlist], activeSpotifyPlaylistId: playlist.id }));
    return true;
  }

  const saveLabel =
    saveStatus === "saved" ? "Sparat" : saveStatus === "offline" ? "Offline-sparat" : saveStatus === "loading" ? "Laddar" : "Sparar";
  const SaveIcon = saveStatus === "offline" ? CloudOff : saveStatus === "saved" ? Cloud : LoaderCircle;

  if (!hydrated || !profileDirectory) return <ProfileSplash />;

  if (profileGateOpen) {
    return (
      <ProfileGate
        profiles={profileDirectory.profiles}
        onEnter={enterProfile}
        onCreate={createProfile}
        onConnect={connectProfile}
      />
    );
  }

  if (!state.profile.onboardingCompleted) {
    return (
      <ProfileOnboarding
        profile={state.profile}
        nutrition={{ calorieTarget: state.nutrition.calorieTarget, proteinTarget: state.nutrition.proteinTarget }}
        onComplete={finishOnboarding}
        onBack={() => setProfileGateOpen(true)}
      />
    );
  }

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
        <button className="avatar" type="button" onClick={() => setTab("profile")} aria-label="Öppna profil">{profileInitials(state.profile.name)}</button>
      </header>

      <main className="main-content">
        {tab === "today" && (
          <TodayView
            state={state}
            nextPass={nextPass}
            todayLabel={todayLabel}
            greeting={greeting}
            nowIso={nowIso}
            foodEntries={foodEntries}
            nutritionTotals={nutritionTotals}
            coachTip={coachTip}
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
            onSelectDay={setSelectedDay}
            onUpdateSteps={updateTodaySteps}
            onLogActivity={addOtherActivity}
          />
        )}

        {tab === "plan" && (
          <PlanView
            program={program}
            openDay={openDay}
            setOpenDay={setOpenDay}
            nextPassId={state.nextPassId}
            programChoices={[{
              id: BASE_PROGRAM_ID,
              name: "Joxo Foundation · 4 dagar",
              description: "Balanserad styrka och hypertrofi för hela kroppen.",
              createdAt: "2026-08-01T00:00:00.000Z",
              days: PROGRAM,
            }, ...state.customPrograms]}
            activeProgramId={state.activeProgramId}
            activePassId={state.activePassId}
            hasActivePass={Boolean(state.activePassId)}
            onStart={startWorkout}
            onGuide={setGuideExercise}
            onSetNext={(day) => setState((current) => ({ ...current, nextPassId: day.id }))}
            onCreateProgram={createTrainingProgram}
            onSwitchProgram={switchTrainingProgram}
            onDeleteProgram={deleteTrainingProgram}
            exerciseSwaps={state.exerciseSwaps}
            exerciseSettings={state.exerciseSettings}
            favoriteExerciseIds={state.favoriteExerciseIds}
            onSwap={(slotId, replacementId) => setState((current) => ({
              ...current,
              exerciseSwaps: replacementId
                ? { ...current.exerciseSwaps, [slotId]: replacementId }
                : Object.fromEntries(Object.entries(current.exerciseSwaps).filter(([id]) => id !== slotId)),
            }))}
            onEditExercise={(slotId, settings) => setState((current) => ({ ...current, exerciseSettings: { ...current.exerciseSettings, [slotId]: settings } }))}
            onToggleFavorite={toggleFavoriteExercise}
            onAddExercise={addExerciseToProgram}
            onRemoveExercise={removeExerciseFromProgram}
            onConfigureDays={configureTrainingDays}
            onReorder={(passId, exerciseIds) => setState((current) => ({
              ...current,
              exerciseOrder: { ...current.exerciseOrder, [passId]: exerciseIds },
            }))}
          />
        )}

        {tab === "workout" && (
          <WorkoutView
            key={activePass?.id ?? "empty-workout"}
            activePass={activePass}
            nextPass={nextPass}
            logs={state.logs}
            history={state.history}
            onStart={startWorkout}
            onUpdateSet={updateSet}
            onToggleSet={toggleSet}
            onFinish={finishWorkout}
            onReset={resetWorkout}
            onGuide={setGuideExercise}
            onApplySuggestion={applySetSuggestion}
            spotifyPlaylists={state.spotifyPlaylists}
            activeSpotifyPlaylistId={state.activeSpotifyPlaylistId}
            onSelectSpotify={(playlistId) => setState((current) => ({ ...current, activeSpotifyPlaylistId: playlistId }))}
            onAddSpotify={addSpotifyPlaylist}
            onRemoveSpotify={(playlistId) => setState((current) => {
              const spotifyPlaylists = current.spotifyPlaylists.filter((item) => item.id !== playlistId);
              return { ...current, spotifyPlaylists, activeSpotifyPlaylistId: current.activeSpotifyPlaylistId === playlistId ? spotifyPlaylists[0]?.id ?? "" : current.activeSpotifyPlaylistId };
            })}
            onReorder={(passId, exerciseIds) => setState((current) => ({
              ...current,
              exerciseOrder: { ...current.exerciseOrder, [passId]: exerciseIds },
            }))}
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
              nutrition: { ...current.nutrition, waterMl: current.nutrition.waterMl + 250, waterDate: todayKey },
              dailyHealth: upsertDailyHealth(current.dailyHealth, {
                ...(current.dailyHealth.find((entry) => entry.date === todayKey) ?? {
                  date: todayKey,
                  waterMl: 0,
                  creatineTaken: false,
                  vitaminsTaken: false,
                }),
                waterMl: current.nutrition.waterMl + 250,
              }),
            }))}
          />
        )}

        {tab === "progress" && <ProgressView state={state} setState={setState} program={program} foodEntries={foodEntries} todayKey={todayKey} ownerToken={ownerToken} />}

        {tab === "profile" && (
          <ProfileView
            state={state}
            setState={setState}
            ownerToken={ownerToken}
            foodEntries={foodEntries}
            saveStatus={saveStatus}
            lastSyncedAt={lastSyncedAt}
            hasPassword={Boolean(profileDirectory.profiles.find((profile) => profile.id === profileDirectory.activeProfileId)?.lock)}
            onSetPassword={setProfilePassword}
            onRemovePassword={removeProfilePassword}
            onLogout={logOut}
            onRestoreBackup={restoreBackup}
          />
        )}
      </main>

      {rest && (
        <RestTimer
          remaining={rest.remaining}
          total={rest.total}
          onAdd={() => setRest((current) => current ? { ...current, remaining: current.remaining + 30, total: current.total + 30 } : null)}
          onClose={() => setRest(null)}
        />
      )}

      {selectedDay && (
        <DayDetailSheet
          key={selectedDay}
          date={selectedDay}
          todayKey={todayKey}
          state={state}
          foodEntries={foodEntries}
          onDateChange={setSelectedDay}
          onSaveWorkout={saveWorkoutHistory}
          onDeleteWorkout={deleteWorkoutHistory}
          onSaveFood={saveFoodEntry}
          onDeleteFood={deleteFoodEntry}
          onSaveHealth={saveDailyHealth}
          onClose={() => setSelectedDay(null)}
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
          tip={coachTip}
          video={coachVideo}
          onQuestion={askCoach}
          onNextTip={showNextCoachTip}
          onClose={() => setCoachOpen(false)}
        />
      )}

      {guideExercise && <ExerciseGuideSheet exercise={guideExercise} onClose={() => setGuideExercise(null)} />}

      {summary && <SummarySheet summary={summary} onClose={() => setSummary(null)} />}
    </div>
  );
}

function ProfileSplash() {
  return (
    <main className="profile-entry-shell profile-splash" aria-label="Joxo Training laddar">
      <span className="entry-brand-mark"><Image src="/icon.svg" alt="" width={56} height={56} unoptimized /></span>
      <div><strong>JOXO</strong><small>TRAINING</small></div>
      <LoaderCircle className="spin" size={22} />
    </main>
  );
}

function ProfileGate({ profiles, onEnter, onCreate, onConnect }: { profiles: LocalProfile[]; onEnter: (profileId: string) => void; onCreate: (name: string) => void; onConnect: (name: string, profileCode: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [name, setName] = useState("");
  const [profileCode, setProfileCode] = useState("");
  const [error, setError] = useState("");
  const [lockedProfile, setLockedProfile] = useState<LocalProfile | null>(null);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const chooseProfile = (profile: LocalProfile) => {
    setAdding(false);
    setError("");
    setPassword("");
    if (profile.lock) setLockedProfile(profile);
    else onEnter(profile.id);
  };

  const unlockProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!lockedProfile?.lock || unlocking) return;
    setUnlocking(true);
    setError("");
    const valid = await verifyProfilePassword(password, lockedProfile.lock);
    setUnlocking(false);
    if (!valid) {
      setError("Fel lösenord. Försök igen.");
      return;
    }
    onEnter(lockedProfile.id);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (connecting) onConnect(name, profileCode);
      else onCreate(name);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Profilen kunde inte skapas.");
    }
  };

  return (
    <main className="profile-entry-shell">
      <div className="profile-entry-ambient profile-entry-ambient-one" />
      <div className="profile-entry-ambient profile-entry-ambient-two" />
      <header className="profile-entry-brand">
        <span className="entry-brand-mark"><Image src="/icon.svg" alt="" width={46} height={46} unoptimized /></span>
        <span><strong>JOXO</strong><small>TRAINING</small></span>
      </header>

      <section className="profile-gate-card">
        <span className="profile-gate-eyebrow">VÄLKOMMEN TILLBAKA</span>
        <h1>Vem tränar idag?</h1>
        <p>Välj profil så laddar vi rätt träningspass, matloggar och framsteg.</p>

        <div className="profile-gate-grid">
          {profiles.map((profile) => (
            <button key={profile.id} type="button" className="profile-gate-person" onClick={() => chooseProfile(profile)}>
              <span>{profileInitials(profile.name)}{profile.lock && <i className="profile-lock-badge"><Lock size={12} /></i>}</span>
              <strong>{profile.name}</strong>
            </button>
          ))}
          <button type="button" className="profile-gate-person add" onClick={() => { setAdding(true); setLockedProfile(null); setConnecting(false); setError(""); }}>
            <span><Plus size={28} /></span>
            <strong>Lägg till</strong>
          </button>
        </div>

        {lockedProfile && (
          <form className="profile-gate-create profile-unlock-form" onSubmit={(event) => void unlockProfile(event)}>
            <div><small>LÅST PROFIL</small><h2>Välkommen, {lockedProfile.name}</h2><p>Skriv profilens lösenord för att fortsätta.</p></div>
            <label><span>Lösenord</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus autoComplete="current-password" /></label>
            {error && <p className="profile-error"><CircleAlert size={15} />{error}</p>}
            <div className="profile-gate-actions">
              <button type="button" onClick={() => { setLockedProfile(null); setPassword(""); setError(""); }}>Avbryt</button>
              <button className="primary-action" type="submit" disabled={unlocking}>{unlocking ? <LoaderCircle className="spin" size={17} /> : <Lock size={17} />} {unlocking ? "Kontrollerar" : "Lås upp"}</button>
            </div>
          </form>
        )}

        {adding && !lockedProfile && (
          <form className="profile-gate-create" onSubmit={submit}>
            <div><small>{connecting ? "BEFINTLIG PROFIL" : "NY PROFIL"}</small><h2>{connecting ? "Anslut en profil" : "Vad heter personen?"}</h2><p>{connecting ? "Använd den privata profilkoden för att hämta rätt data på den här enheten." : "Profilen får helt egna loggar, mål och inställningar."}</p></div>
            <label><span>Namn</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Till exempel Matilda" autoFocus autoComplete="off" /></label>
            {connecting && <label><span>Profilkod</span><input value={profileCode} onChange={(event) => setProfileCode(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" autoCapitalize="none" autoCorrect="off" spellCheck={false} /></label>}
            {error && <p className="profile-error"><CircleAlert size={15} />{error}</p>}
            <button className="profile-connect-toggle" type="button" onClick={() => { setConnecting((current) => !current); setError(""); }}>{connecting ? "Skapa en helt ny profil" : "Har du redan en profil? Anslut med profilkod"}</button>
            <div className="profile-gate-actions">
              <button type="button" onClick={() => setAdding(false)}>Avbryt</button>
              <button className="primary-action" type="submit">{connecting ? "Anslut" : "Fortsätt"} <ArrowRight size={17} /></button>
            </div>
          </form>
        )}
      </section>
      <p className="profile-entry-footnote"><Cloud size={14} /> Varje profil lagras separat och säkerhetskopieras i molnet när anslutningen är aktiv.</p>
    </main>
  );
}

function ProfileOnboarding({
  profile,
  nutrition,
  onComplete,
  onBack,
}: {
  profile: PersistedState["profile"];
  nutrition: { calorieTarget: number; proteinTarget: number };
  onComplete: (profile: PersistedState["profile"], nutrition: { calorieTarget: number; proteinTarget: number }) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => ({ ...profile }));
  const [targets, setTargets] = useState(() => ({ ...nutrition }));
  const [error, setError] = useState("");

  const goalOptions = ["Starkare och mer muskler", "Bygga muskler", "Minska fett och behålla muskler", "Må bättre och bli mer aktiv"];
  const experienceOptions: Array<{ value: PersistedState["profile"]["experienceLevel"]; label: string; note: string }> = [
    { value: "new", label: "Nybörjare", note: "Mindre än 1 år" },
    { value: "some", label: "Tränat ett tag", note: "1–3 år" },
    { value: "experienced", label: "Erfaren", note: "Mer än 3 år" },
  ];

  const next = () => {
    setError("");
    if (step === 0) {
      if (!draft.name.trim()) return setError("Skriv vad profilen ska heta.");
      if (draft.heightCm < 100 || draft.heightCm > 250) return setError("Ange en längd mellan 100 och 250 cm.");
      if (draft.weightKg < 30 || draft.weightKg > 300) return setError("Ange en vikt mellan 30 och 300 kg.");
    }
    if (step === 1 && !draft.goal) return setError("Välj ditt viktigaste träningsmål.");
    setStep((current) => Math.min(2, current + 1));
  };

  const complete = () => {
    setError("");
    if (targets.calorieTarget < 1000 || targets.calorieTarget > 6000) return setError("Ange ett kalorimål mellan 1 000 och 6 000 kcal.");
    if (targets.proteinTarget < 30 || targets.proteinTarget > 350) return setError("Ange ett proteinmål mellan 30 och 350 gram.");
    onComplete({ ...draft, name: draft.name.trim() }, targets);
  };

  return (
    <main className="profile-entry-shell onboarding-shell">
      <div className="profile-entry-ambient profile-entry-ambient-one" />
      <header className="profile-entry-brand compact">
        <span className="entry-brand-mark"><Image src="/icon.svg" alt="" width={40} height={40} unoptimized /></span>
        <span><strong>JOXO</strong><small>TRAINING</small></span>
      </header>

      <section className="onboarding-card">
        <div className="onboarding-progress" aria-label={`Steg ${step + 1} av 3`}><i className={step >= 0 ? "active" : ""} /><i className={step >= 1 ? "active" : ""} /><i className={step >= 2 ? "active" : ""} /></div>
        <div className="onboarding-heading">
          <span>STEG {step + 1} AV 3</span>
          <h1>{step === 0 ? `Hej ${draft.name || "du"}!` : step === 1 ? "Hur vill du träna?" : "Gör planen personlig"}</h1>
          <p>{step === 0 ? "Vi börjar med några grunduppgifter för att kunna följa din utveckling." : step === 1 ? "Dina svar hjälper oss att välja rätt träningsnivå och veckorytm." : "Sista steget anpassar passens längd, hänsyn och dagliga kostmål."}</p>
        </div>

        {step === 0 && (
          <div className="onboarding-fields two-columns">
            <label className="wide"><span>Namn</span><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} autoComplete="name" /></label>
            <label><span>Längd</span><div className="input-unit"><input type="number" inputMode="numeric" value={draft.heightCm || ""} onChange={(event) => setDraft((current) => ({ ...current, heightCm: Number(event.target.value) }))} placeholder="190" /><i>cm</i></div></label>
            <label><span>Vikt idag</span><div className="input-unit"><input type="number" inputMode="decimal" step="0.1" value={draft.weightKg || ""} onChange={(event) => setDraft((current) => ({ ...current, weightKg: Number(event.target.value) }))} placeholder="85" /><i>kg</i></div></label>
            <label className="wide"><span>Födelsedatum <em>frivilligt</em></span><input type="date" value={draft.birthDate} onChange={(event) => setDraft((current) => ({ ...current, birthDate: event.target.value }))} /></label>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-fields">
            <fieldset><legend>Viktigaste mål</legend><div className="choice-grid goals">{goalOptions.map((goal) => <button key={goal} type="button" className={draft.goal === goal ? "active" : ""} aria-pressed={draft.goal === goal} onClick={() => setDraft((current) => ({ ...current, goal }))}>{goal}{draft.goal === goal && <Check size={15} />}</button>)}</div></fieldset>
            <fieldset><legend>Träningsvana</legend><div className="choice-grid three">{experienceOptions.map((option) => <button key={option.value} type="button" className={draft.experienceLevel === option.value ? "active" : ""} aria-pressed={draft.experienceLevel === option.value} onClick={() => setDraft((current) => ({ ...current, experienceLevel: option.value }))}><strong>{option.label}</strong><small>{option.note}</small></button>)}</div></fieldset>
            <fieldset><legend>Pass per vecka</legend><div className="number-choice-row">{[2, 3, 4, 5, 6].map((days) => <button key={days} type="button" className={draft.weeklyGoal === days ? "active" : ""} aria-pressed={draft.weeklyGoal === days} onClick={() => setDraft((current) => ({ ...current, weeklyGoal: days }))}>{days}</button>)}</div></fieldset>
            <fieldset><legend>Aktivitet utanför gymmet</legend><div className="choice-grid three compact">{([['low', 'Låg'], ['medium', 'Medel'], ['high', 'Hög']] as const).map(([value, label]) => <button key={value} type="button" className={draft.activityLevel === value ? "active" : ""} aria-pressed={draft.activityLevel === value} onClick={() => setDraft((current) => ({ ...current, activityLevel: value }))}>{label}</button>)}</div></fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-fields">
            <fieldset><legend>Var tränar du oftast?</legend><div className="choice-grid three compact">{([['gym', 'Gym'], ['home', 'Hemma'], ['mixed', 'Blandat']] as const).map(([value, label]) => <button key={value} type="button" className={draft.trainingLocation === value ? "active" : ""} aria-pressed={draft.trainingLocation === value} onClick={() => setDraft((current) => ({ ...current, trainingLocation: value }))}>{label}</button>)}</div></fieldset>
            <fieldset><legend>Lagom passlängd</legend><div className="number-choice-row minutes">{[30, 45, 60, 75, 90].map((minutes) => <button key={minutes} type="button" className={draft.sessionMinutes === minutes ? "active" : ""} aria-pressed={draft.sessionMinutes === minutes} onClick={() => setDraft((current) => ({ ...current, sessionMinutes: minutes }))}>{minutes}<small>min</small></button>)}</div></fieldset>
            <label><span>Vad vill du prioritera? <em>frivilligt</em></span><textarea value={draft.focusAreas} onChange={(event) => setDraft((current) => ({ ...current, focusAreas: event.target.value }))} placeholder="Till exempel starkare ben, större axlar eller bättre kondition" /></label>
            <label><span>Skador eller övningar att ta hänsyn till? <em>frivilligt</em></span><textarea value={draft.limitations} onChange={(event) => setDraft((current) => ({ ...current, limitations: event.target.value }))} placeholder="Till exempel känsligt knä eller axel" /></label>
            <div className="onboarding-targets">
              <label><span>Kalorimål</span><div className="input-unit"><input type="number" value={targets.calorieTarget} onChange={(event) => setTargets((current) => ({ ...current, calorieTarget: Number(event.target.value) }))} /><i>kcal</i></div></label>
              <label><span>Proteinmål</span><div className="input-unit"><input type="number" value={targets.proteinTarget} onChange={(event) => setTargets((current) => ({ ...current, proteinTarget: Number(event.target.value) }))} /><i>g</i></div></label>
            </div>
            <p className="onboarding-safety"><Info size={15} /> Kostmålen är startvärden och inte medicinska råd. Vid skada, sjukdom eller särskilda kostbehov bör planen stämmas av med legitimerad vårdpersonal.</p>
          </div>
        )}

        {error && <p className="onboarding-error"><CircleAlert size={16} />{error}</p>}
        <div className="onboarding-actions">
          <button type="button" onClick={step === 0 ? onBack : () => { setError(""); setStep((current) => current - 1); }}><ChevronLeft size={17} /> {step === 0 ? "Profiler" : "Tillbaka"}</button>
          {step < 2
            ? <button className="primary-action" type="button" onClick={next}>Fortsätt <ArrowRight size={17} /></button>
            : <button className="primary-action" type="button" onClick={complete}>Starta med {draft.name || "profilen"} <ArrowRight size={17} /></button>}
        </div>
      </section>
    </main>
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
  foodEntries,
  nutritionTotals,
  coachTip,
  onStart,
  onReadiness,
  onNutrition,
  onCoach,
  onPlan,
  onSelectDay,
  onUpdateSteps,
  onLogActivity,
}: {
  state: PersistedState;
  nextPass: WorkoutDay;
  todayLabel: string;
  greeting: string;
  nowIso: string;
  foodEntries: FoodEntry[];
  nutritionTotals: { calories: number; protein: number };
  coachTip: CoachTip;
  onStart: () => void;
  onReadiness: (key: "energy" | "soreness" | "motivation", value: number) => void;
  onNutrition: () => void;
  onCoach: (question: string) => void;
  onPlan: () => void;
  onSelectDay: (date: string) => void;
  onUpdateSteps: (steps: number, source: DailyHealthEntry["stepsSource"]) => void;
  onLogActivity: (entry: Omit<OtherActivityEntry, "id" | "date">) => void;
}) {
  const todayKey = stockholmDateKey(nowIso);
  const week = calendarWeek(todayKey);
  const passesByDate = state.history.reduce((dates, entry) => {
    const dateKey = stockholmDateKey(entry.date);
    dates.set(dateKey, (dates.get(dateKey) ?? 0) + 1);
    return dates;
  }, new Map<string, number>());
  const foodCountsByDate = foodEntries.reduce((dates, entry) => {
    const dateKey = entryDate(entry, todayKey);
    dates.set(dateKey, (dates.get(dateKey) ?? 0) + 1);
    return dates;
  }, new Map<string, number>());
  const completedThisWeek = week.days.reduce((total, day) => total + (passesByDate.get(day.dateKey) ?? 0), 0);
  const weeklyGoal = Math.max(1, state.profile.weeklyGoal);
  const readinessScore = Math.round(
    Math.min(100, (state.readiness.sleep / 8) * 35 + (state.readiness.energy / 5) * 25 + ((6 - state.readiness.soreness) / 5) * 20 + (state.readiness.motivation / 5) * 20),
  );
  const caloriePct = Math.min(100, Math.round((nutritionTotals.calories / state.nutrition.calorieTarget) * 100));
  const proteinPct = Math.min(100, Math.round((nutritionTotals.protein / state.nutrition.proteinTarget) * 100));
  const coachCardTip = state.readiness.energy <= 2
    ? { title: "Ta ett smartare, inte hårdare, pass idag.", body: "Håll 2–3 reps i tanken och skala bort ett set om uppvärmningen känns tung." }
    : coachTip;
  const todayHealth = state.dailyHealth.find((entry) => entry.date === todayKey);
  const reminderItems = [
    state.reminders.workout ? { label: "Träning", done: passesByDate.has(todayKey), icon: Dumbbell } : null,
    state.reminders.protein ? { label: "Protein", done: nutritionTotals.protein >= state.nutrition.proteinTarget, icon: Apple } : null,
    state.reminders.creatine ? { label: "Kreatin", done: Boolean(todayHealth?.creatineTaken), icon: Zap } : null,
    state.reminders.vitamins ? { label: "Vitaminer", done: Boolean(todayHealth?.vitaminsTaken), icon: Sparkles } : null,
  ].filter((item): item is { label: string; done: boolean; icon: LucideIcon } => item !== null);

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

      {reminderItems.length > 0 && <section className="today-reminders card-surface"><div><span><Bell size={16} /> IDAG</span><strong>{reminderItems.filter((item) => item.done).length}/{reminderItems.length} klara</strong></div><div>{reminderItems.map((item) => { const Icon = item.icon; return <span key={item.label} className={item.done ? "done" : ""}><Icon size={14} />{item.label}{item.done ? <Check size={12} /> : null}</span>; })}</div></section>}

      <section className="workout-hero">
        <div className="hero-grid" />
        <div className="hero-kicker"><span>PASS {String(nextPass.number).padStart(2, "0")}</span><span>{estimatedWorkoutDuration(nextPass.exercises)}</span></div>
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
        <button className="primary-action" type="button" disabled={nextPass.exercises.length === 0} onClick={onStart}>{nextPass.exercises.length ? <><Play size={18} fill="currentColor" /> Starta passet</> : <><LibraryBig size={18} /> Lägg till övningar först</>}</button>
        <button className="text-action" type="button" onClick={onPlan}>Se hela schemat <ArrowRight size={16} /></button>
      </section>

      <section className="week-strip card-surface">
        <div className="section-heading compact">
          <div><span>VECKA {week.number}</span><h3>{completedThisWeek} av {weeklyGoal} pass</h3></div>
          <strong>{Math.round((completedThisWeek / weeklyGoal) * 100)}%</strong>
        </div>
        <div className="week-days">
          {week.days.map((day) => {
            const passCount = passesByDate.get(day.dateKey) ?? 0;
            const foodCount = foodCountsByDate.get(day.dateKey) ?? 0;
            const hasHealth = state.dailyHealth.some((entry) => entry.date === day.dateKey);
            const hasData = passCount > 0 || foodCount > 0 || hasHealth;
            const className = [day.dateKey === todayKey ? "today" : "", passCount > 0 ? "done" : "", hasData ? "has-data" : ""].filter(Boolean).join(" ");
            const passLabel = passCount === 1 ? "1 genomfört pass" : `${passCount} genomförda pass`;
            const dataLabel = foodCount > 0 ? `, ${foodCount} matloggar` : "";
            return (
              <button key={day.dateKey} type="button" className={className} aria-label={`Öppna ${day.label} ${day.dateNumber}: ${passLabel}${dataLabel}`} onClick={() => onSelectDay(day.dateKey)}>
                <span>{day.label}</span>
                <div className="week-date"><i>{day.dateNumber}</i>{passCount > 0 && <b title={passLabel}><Check size={9} strokeWidth={3} /></b>}</div>
                {hasData && <small aria-hidden="true" />}
              </button>
            );
          })}
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

      <section className="today-motion-grid">
        <DailyStepsCard steps={todayHealth?.steps ?? 0} source={todayHealth?.stepsSource} onChange={onUpdateSteps} />
        <OtherActivityCard entries={state.otherActivities} onSave={onLogActivity} />
      </section>

      <button className="coach-card" type="button" onClick={() => onCoach("Vad ska jag träna idag?")}>
        <span className="coach-card-image" aria-hidden="true">
          <Image src="/coach/joxo-motivation-v1.png" alt="" fill sizes="74px" />
          <i><Brain size={15} /></i>
        </span>
        <span className="coach-copy"><small>JOXO PT · {coachTip.category.toUpperCase()}</small><strong>{coachCardTip.title}</strong><p>{coachCardTip.body}</p></span>
        <ChevronRight size={20} />
      </button>
    </>
  );
}

function DailyStepsCard({ steps, source, onChange }: { steps: number; source?: DailyHealthEntry["stepsSource"]; onChange: (steps: number, source: DailyHealthEntry["stepsSource"]) => void }) {
  const [manualSteps, setManualSteps] = useState(String(steps));
  const [tracking, setTracking] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);
  const [message, setMessage] = useState("");
  const startSteps = useRef(steps);
  const lastPeak = useRef(0);
  const lastMagnitude = useRef(9.8);

  useEffect(() => {
    if (!tracking) return;
    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) return;
      const magnitude = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);
      const now = Date.now();
      if (magnitude > 11.7 && lastMagnitude.current <= 11.7 && now - lastPeak.current > 280) {
        lastPeak.current = now;
        setSessionSteps((current) => {
          const next = current + 1;
          const total = startSteps.current + next;
          setManualSteps(String(total));
          onChange(total, "Enhetssensor");
          return next;
        });
      }
      lastMagnitude.current = magnitude;
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [onChange, tracking]);

  async function toggleTracking() {
    if (tracking) {
      setTracking(false);
      setMessage(`${sessionSteps} steg registrerade i den här mätningen.`);
      return;
    }
    if (!("DeviceMotionEvent" in window)) {
      setMessage("Den här webbläsaren delar inte rörelsesensorn. Lägg in stegen manuellt i stället.");
      return;
    }
    const motionEvent = window.DeviceMotionEvent as typeof DeviceMotionEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
    if (motionEvent.requestPermission) {
      const permission = await motionEvent.requestPermission();
      if (permission !== "granted") {
        setMessage("Rörelsesensorn tilläts inte.");
        return;
      }
    }
    startSteps.current = steps;
    setSessionSteps(0);
    setMessage("Stegräknaren är igång medan Joxo är öppet.");
    setTracking(true);
  }

  function saveManual(event: FormEvent) {
    event.preventDefault();
    const next = Math.max(0, Math.round(Number(manualSteps)));
    if (!Number.isFinite(next)) return;
    onChange(next, "Manuell");
    setMessage("Dagens steg är sparade.");
  }

  return (
    <article className="card-surface steps-card">
      <div className="section-heading"><div><span>VARDAGSRÖRELSE</span><h3>Dagens steg</h3></div><Footprints size={21} /></div>
      <div className="steps-total"><strong>{new Intl.NumberFormat("sv-SE").format(steps)}</strong><span>steg</span><small>{source ?? "Ingen källa vald"}</small></div>
      <div className="steps-progress"><i style={{ width: `${Math.min(100, (steps / 10_000) * 100)}%` }} /></div>
      <form className="steps-manual" onSubmit={saveManual}><label><span>Manuell totalsumma</span><input type="number" min="0" inputMode="numeric" value={manualSteps} onChange={(event) => setManualSteps(event.target.value)} /></label><button type="submit"><Check size={15} /> Spara</button></form>
      <button className={`secondary-action steps-sensor-action${tracking ? " active" : ""}`} type="button" onClick={() => void toggleTracking()}><Activity size={17} /> {tracking ? "Stoppa mätning" : "Starta stegräknare"}</button>
      {message && <p className="steps-message">{message}</p>}
      <details className="health-connect-note"><summary><Link2 size={15} /> iPhone, Android och smartklocka <ChevronDown size={15} /></summary><p>Direktmätning fungerar när appen är öppen. Automatisk bakgrundssynk med Apple Health, Health Connect och klockor kräver en native-version av Joxo; tills dess kan totalsumman från din hälsoapp sparas manuellt här.</p></details>
    </article>
  );
}

const OTHER_ACTIVITY_PRESETS = ["Frisbeegolf", "Tennis", "Fotboll", "Padel", "Promenad", "Löpning", "Cykling", "Simning"];

function OtherActivityCard({ entries, onSave }: { entries: OtherActivityEntry[]; onSave: (entry: Omit<OtherActivityEntry, "id" | "date">) => void }) {
  const [activity, setActivity] = useState("Frisbeegolf");
  const [duration, setDuration] = useState("60");
  const [intensity, setIntensity] = useState<OtherActivityEntry["intensity"]>("Medel");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const durationMinutes = Math.max(1, Math.round(Number(duration)));
    if (!Number.isFinite(durationMinutes)) return;
    onSave({ type: activity, durationMinutes, intensity, note: note.trim() || undefined });
    setSaved(true);
    setNote("");
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <article className="card-surface other-activity-card">
      <div className="section-heading"><div><span>ANNAN TRÄNING</span><h3>All rörelse räknas</h3></div><Activity size={21} /></div>
      <div className="activity-presets" role="group" aria-label="Välj aktivitet">{OTHER_ACTIVITY_PRESETS.map((item) => <button type="button" className={activity === item ? "active" : ""} aria-pressed={activity === item} key={item} onClick={() => setActivity(item)}>{item}</button>)}</div>
      <form className="other-activity-form" onSubmit={submit}>
        <label><span>Minuter</span><input type="number" min="1" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
        <label><span>Intensitet</span><select value={intensity} onChange={(event) => setIntensity(event.target.value as OtherActivityEntry["intensity"])}><option>Lugn</option><option>Medel</option><option>Hård</option></select></label>
        <label className="wide"><span>Anteckning</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Valfritt" /></label>
        <button className="primary-action wide" type="submit"><Plus size={17} /> {saved ? "Aktiviteten är sparad" : `Logga ${activity}`}</button>
      </form>
      {entries.length > 0 && <div className="recent-activities"><small>SENAST LOGGAT</small>{entries.slice(0, 3).map((entry) => <span key={entry.id}><strong>{entry.type}</strong><i>{entry.durationMinutes} min · {entry.intensity.toLocaleLowerCase("sv-SE")}</i></span>)}</div>}
    </article>
  );
}

function DayDetailSheet({
  date,
  todayKey,
  state,
  foodEntries,
  onDateChange,
  onSaveWorkout,
  onDeleteWorkout,
  onSaveFood,
  onDeleteFood,
  onSaveHealth,
  onClose,
}: {
  date: string;
  todayKey: string;
  state: PersistedState;
  foodEntries: FoodEntry[];
  onDateChange: (date: string) => void;
  onSaveWorkout: (entry: HistoryEntry) => void;
  onDeleteWorkout: (entryId: string) => void;
  onSaveFood: (entry: FoodEntry) => Promise<void>;
  onDeleteFood: (entry: FoodEntry) => Promise<void>;
  onSaveHealth: (entry: DailyHealthEntry) => void;
  onClose: () => void;
}) {
  const workouts = useMemo(() => state.history.filter((entry) => stockholmDateKey(entry.date) === date), [date, state.history]);
  const foods = useMemo(() => foodEntries.filter((entry) => entryDate(entry, todayKey) === date), [date, foodEntries, todayKey]);
  const nutrition = useMemo(() => totalNutrition(foods), [foods]);
  const savedHealth = state.dailyHealth.find((entry) => entry.date === date);
  const savedWeight = state.weightHistory.find((entry) => stockholmDateKey(entry.date) === date)?.weight;
  const savedWaterMl = savedHealth?.waterMl ?? (date === todayKey ? state.nutrition.waterMl : undefined);
  const canEdit = date <= todayKey;
  const dateLabel = new Intl.DateTimeFormat("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Stockholm" })
    .format(new Date(`${date}T12:00:00.000Z`));
  const inputValue = (value: number | undefined) => value === undefined ? "" : String(value).replace(".", ",");
  const parseOptional = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 10) / 10 : undefined;
  };
  const [healthDraft, setHealthDraft] = useState(() => ({
    waterLiters: inputValue(savedWaterMl === undefined ? undefined : savedWaterMl / 1000),
    steps: inputValue(savedHealth?.steps),
    weightKg: inputValue(savedHealth?.weightKg ?? savedWeight),
    bodyFatKg: inputValue(savedHealth?.bodyFatKg),
    muscleMassKg: inputValue(savedHealth?.muscleMassKg),
    creatineTaken: savedHealth?.creatineTaken ?? false,
    vitaminsTaken: savedHealth?.vitaminsTaken ?? false,
    note: savedHealth?.note ?? "",
  }));
  const [workoutDraft, setWorkoutDraft] = useState({ name: "", duration: "60", completedSets: "", volumeKg: "" });
  const [foodDraft, setFoodDraft] = useState({ name: "", meal: "Middag", calories: "", protein: "" });
  const [editingWorkout, setEditingWorkout] = useState<HistoryEntry | null>(null);
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
  const [foodBusy, setFoodBusy] = useState(false);
  const [notice, setNotice] = useState("");
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

  function saveHealth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const waterLiters = parseOptional(healthDraft.waterLiters) ?? 0;
    onSaveHealth({
      date,
      waterMl: Math.round(waterLiters * 1000),
      steps: parseOptional(healthDraft.steps),
      stepsSource: parseOptional(healthDraft.steps) !== undefined ? "Manuell" : undefined,
      weightKg: parseOptional(healthDraft.weightKg),
      bodyFatKg: parseOptional(healthDraft.bodyFatKg),
      muscleMassKg: parseOptional(healthDraft.muscleMassKg),
      creatineTaken: healthDraft.creatineTaken,
      vitaminsTaken: healthDraft.vitaminsTaken,
      note: healthDraft.note.trim() || undefined,
    });
    setError("");
    setNotice("Dagens hälsa och rutiner är sparade.");
  }

  function addWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = workoutDraft.name.trim();
    const duration = Number(workoutDraft.duration);
    const completedSets = Number(workoutDraft.completedSets);
    const volume = Number(workoutDraft.volumeKg.replace(",", "."));
    if (!name || !Number.isFinite(duration) || duration < 1 || !Number.isFinite(completedSets) || completedSets < 1 || !Number.isFinite(volume) || volume < 0) {
      setError("Fyll i passets namn, minuter, antal set och total volym.");
      return;
    }
    onSaveWorkout({
      id: crypto.randomUUID(),
      passId: "manual-log",
      name,
      date: date === todayKey ? new Date().toISOString() : `${date}T12:00:00.000Z`,
      duration: Math.round(duration),
      volume: Math.round(volume * 10) / 10,
      completedSets: Math.round(completedSets),
      prCount: 0,
    });
    setWorkoutDraft({ name: "", duration: "60", completedSets: "", volumeKg: "" });
    setError("");
    setNotice("Passet lades till på dagen.");
  }

  async function addFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = foodDraft.name.trim();
    const calories = Number(foodDraft.calories.replace(",", "."));
    const protein = Number(foodDraft.protein.replace(",", "."));
    if (!name || !Number.isFinite(calories) || calories < 0 || !Number.isFinite(protein) || protein < 0) {
      setError("Fyll i matens namn, kalorier och protein.");
      return;
    }
    setFoodBusy(true);
    setError("");
    try {
      await onSaveFood({
        id: crypto.randomUUID(),
        name,
        meal: foodDraft.meal,
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        loggedAt: date === todayKey ? new Date().toISOString() : `${date}T12:00:00.000Z`,
        source: "manual",
        confidence: "high",
      });
      setFoodDraft({ name: "", meal: "Middag", calories: "", protein: "" });
      setNotice("Matloggen lades till på dagen.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Matloggen kunde inte sparas.");
    } finally {
      setFoodBusy(false);
    }
  }

  async function removeFood(entry: FoodEntry) {
    if (!window.confirm(`Ta bort ${entry.name} från ${dateLabel}?`)) return;
    setFoodBusy(true);
    setError("");
    try {
      await onDeleteFood(entry);
      setNotice("Matloggen togs bort.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Matloggen kunde inte tas bort.");
    } finally {
      setFoodBusy(false);
    }
  }

  function removeWorkout(entry: HistoryEntry) {
    if (!window.confirm(`Ta bort träningspasset ${entry.name} från ${dateLabel}?`)) return;
    onDeleteWorkout(entry.id);
    setNotice("Träningspasset togs bort.");
  }

  return (
    <>
      <div className="sheet-backdrop day-detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <section className="bottom-sheet day-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="day-detail-title">
          <div className="sheet-handle" />
          <div className="sheet-head day-detail-head">
            <button type="button" onClick={() => onDateChange(shiftDate(date, -1))} aria-label="Föregående dag"><ChevronLeft size={20} /></button>
            <div><small>{date === todayKey ? "IDAG" : "DAGENS LOGG"}</small><h2 id="day-detail-title">{dateLabel}</h2><p>Granska och redigera allt som hör till dagen.</p></div>
            <div className="day-head-actions"><button type="button" disabled={date >= todayKey} onClick={() => onDateChange(shiftDate(date, 1))} aria-label="Nästa dag"><ChevronRight size={20} /></button><button type="button" onClick={onClose} aria-label="Stäng dag"><X size={20} /></button></div>
          </div>

          <div className="day-summary-grid">
            <span><Dumbbell size={16} /><small>TRÄNING</small><strong>{workouts.length} pass</strong></span>
            <span><Flame size={16} /><small>KALORIER</small><strong>{formatNumber(nutrition.calories)} kcal</strong></span>
            <span><Apple size={16} /><small>PROTEIN</small><strong>{formatNumber(nutrition.protein)} g</strong></span>
            <span><Waves size={16} /><small>VÄTSKA</small><strong>{formatNumber((savedWaterMl ?? 0) / 1000)} l</strong></span>
          </div>

          {!canEdit && <div className="day-readonly-note"><Info size={16} />Framtida dagar kan granskas men inte loggas ännu.</div>}
          {notice && <div className="nutrition-notice success"><Check size={16} />{notice}</div>}
          {error && <div className="nutrition-notice error"><CircleAlert size={16} />{error}</div>}

          <section className="day-detail-section">
            <div className="day-section-title"><span><Dumbbell size={18} /></span><div><small>TRÄNING</small><h3>Genomförda pass</h3></div><b>{workouts.length}</b></div>
            {workouts.length ? <div className="day-workout-list">{workouts.map((entry) => (
              <article className="day-workout-item" key={entry.id}>
                <div><strong>{entry.name}</strong><small>{entry.duration} min · {entry.completedSets} set · {formatNumber(entry.volume / 1000)} t</small></div>
                <div className="day-item-actions"><button type="button" onClick={() => setEditingWorkout(entry)}><Pencil size={14} /> Redigera</button><button className="danger" type="button" onClick={() => removeWorkout(entry)}><Trash2 size={14} /></button></div>
                {entry.exercises?.length ? <details><summary>Visa övningar och set <ChevronDown size={15} /></summary><div>{entry.exercises.map((exercise) => <div className="day-exercise-row" key={exercise.id}><span><strong>{exercise.name}</strong><small>{exercise.muscle} · {formatNumber(exercise.volume)} kg</small></span><p>{exercise.sets.map((set) => `${set.weight === null ? "Kroppsvikt" : `${formatNumber(set.weight)} kg`} × ${set.reps} · RPE ${formatNumber(set.rpe)}`).join("  |  ")}</p></div>)}</div></details> : <p className="day-legacy-note">Det här är ett äldre eller manuellt pass utan sparade övningsrader.</p>}
              </article>
            ))}</div> : <div className="day-empty"><Dumbbell size={22} /><span><strong>Inget pass loggat</strong><small>Lägg till ett pass manuellt eller avsluta ett pass i träningsvyn.</small></span></div>}
            {canEdit && <details className="day-add-box"><summary><Plus size={16} /> Lägg till pass manuellt <ChevronDown size={16} /></summary><form onSubmit={addWorkout}><label className="wide"><span>Passnamn</span><input value={workoutDraft.name} onChange={(event) => setWorkoutDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Till exempel Överkropp A" /></label><label><span>Minuter</span><input type="number" min="1" value={workoutDraft.duration} onChange={(event) => setWorkoutDraft((current) => ({ ...current, duration: event.target.value }))} /></label><label><span>Genomförda set</span><input type="number" min="1" value={workoutDraft.completedSets} onChange={(event) => setWorkoutDraft((current) => ({ ...current, completedSets: event.target.value }))} /></label><label className="wide"><span>Total volym</span><div><input type="number" min="0" step="0.1" inputMode="decimal" value={workoutDraft.volumeKg} onChange={(event) => setWorkoutDraft((current) => ({ ...current, volumeKg: event.target.value }))} /><i>kg</i></div></label><button className="secondary-action wide" type="submit"><Plus size={16} /> Spara passet</button></form></details>}
          </section>

          <section className="day-detail-section">
            <div className="day-section-title"><span><Utensils size={18} /></span><div><small>MAT</small><h3>Matloggar</h3></div><b>{foods.length}</b></div>
            {foods.length ? <div className="day-food-list">{foods.map((entry) => <article key={entry.id}><span><strong>{entry.name}</strong><small>{entry.meal}</small></span><span><strong>{formatNumber(entry.calories)} kcal</strong><small>{formatNumber(entry.protein)} g protein</small></span><div className="day-item-actions"><button type="button" onClick={() => setEditingFood(entry)}><Pencil size={14} /> Redigera</button><button className="danger" type="button" disabled={foodBusy} onClick={() => void removeFood(entry)}><Trash2 size={14} /></button></div></article>)}</div> : <div className="day-empty"><Apple size={22} /><span><strong>Ingen mat loggad</strong><small>Lägg till en snabb logg nedan.</small></span></div>}
            {canEdit && <details className="day-add-box"><summary><Plus size={16} /> Lägg till mat <ChevronDown size={16} /></summary><form onSubmit={(event) => void addFood(event)}><label className="wide"><span>Namn</span><input value={foodDraft.name} onChange={(event) => setFoodDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Måltid eller livsmedel" /></label><label><span>Måltid</span><select value={foodDraft.meal} onChange={(event) => setFoodDraft((current) => ({ ...current, meal: event.target.value }))}><option>Frukost</option><option>Lunch</option><option>Middag</option><option>Mellanmål</option></select></label><label><span>Kalorier</span><div><input type="number" min="0" inputMode="numeric" value={foodDraft.calories} onChange={(event) => setFoodDraft((current) => ({ ...current, calories: event.target.value }))} /><i>kcal</i></div></label><label className="wide"><span>Protein</span><div><input type="number" min="0" step="0.1" inputMode="decimal" value={foodDraft.protein} onChange={(event) => setFoodDraft((current) => ({ ...current, protein: event.target.value }))} /><i>g</i></div></label><button className="secondary-action wide" type="submit" disabled={foodBusy}>{foodBusy ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />} Spara matloggen</button></form></details>}
          </section>

          <section className="day-detail-section">
            <div className="day-section-title"><span><HeartPulse size={18} /></span><div><small>HÄLSA & RUTINER</small><h3>Dagens värden</h3></div></div>
            <form className="day-health-form" onSubmit={saveHealth}>
              <label><span>Vätska</span><div><input type="text" inputMode="decimal" disabled={!canEdit} value={healthDraft.waterLiters} onChange={(event) => setHealthDraft((current) => ({ ...current, waterLiters: event.target.value }))} /><i>liter</i></div></label>
              <label><span>Steg</span><div><input type="number" min="0" inputMode="numeric" disabled={!canEdit} value={healthDraft.steps} onChange={(event) => setHealthDraft((current) => ({ ...current, steps: event.target.value }))} /><i>steg</i></div></label>
              <label><span>Vikt</span><div><input type="text" inputMode="decimal" disabled={!canEdit} value={healthDraft.weightKg} onChange={(event) => setHealthDraft((current) => ({ ...current, weightKg: event.target.value }))} /><i>kg</i></div></label>
              <label><span>Fettmassa</span><div><input type="text" inputMode="decimal" disabled={!canEdit} value={healthDraft.bodyFatKg} onChange={(event) => setHealthDraft((current) => ({ ...current, bodyFatKg: event.target.value }))} /><i>kg</i></div></label>
              <label><span>Muskelmassa</span><div><input type="text" inputMode="decimal" disabled={!canEdit} value={healthDraft.muscleMassKg} onChange={(event) => setHealthDraft((current) => ({ ...current, muscleMassKg: event.target.value }))} /><i>kg</i></div></label>
              <div className="day-supplements wide"><button type="button" disabled={!canEdit} className={healthDraft.creatineTaken ? "active" : ""} aria-pressed={healthDraft.creatineTaken} onClick={() => setHealthDraft((current) => ({ ...current, creatineTaken: !current.creatineTaken }))}><Check size={15} /> Kreatin taget</button><button type="button" disabled={!canEdit} className={healthDraft.vitaminsTaken ? "active" : ""} aria-pressed={healthDraft.vitaminsTaken} onClick={() => setHealthDraft((current) => ({ ...current, vitaminsTaken: !current.vitaminsTaken }))}><Check size={15} /> Vitaminer tagna</button></div>
              <label className="wide"><span>Anteckning</span><textarea disabled={!canEdit} value={healthDraft.note} onChange={(event) => setHealthDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Sömn, energi, dagsform eller något annat viktigt" /></label>
              {canEdit && <button className="primary-action wide" type="submit"><Check size={17} /> Spara dagens värden</button>}
            </form>
          </section>
        </section>
      </div>

      {editingWorkout && <WorkoutHistoryEditSheet entry={editingWorkout} todayKey={todayKey} onSave={(entry) => { onSaveWorkout(entry); setEditingWorkout(null); setNotice("Träningspasset uppdaterades."); }} onClose={() => setEditingWorkout(null)} />}
      {editingFood && <NutritionEditSheet entry={editingFood} todayKey={todayKey} onSave={async (entry) => { await onSaveFood(entry); setEditingFood(null); setNotice("Matloggen uppdaterades."); }} onClose={() => setEditingFood(null)} />}
    </>
  );
}

function WorkoutHistoryEditSheet({ entry, todayKey, onSave, onClose }: { entry: HistoryEntry; todayKey: string; onSave: (entry: HistoryEntry) => void; onClose: () => void }) {
  const originalDate = stockholmDateKey(entry.date);
  const [name, setName] = useState(entry.name);
  const [date, setDate] = useState(originalDate);
  const [duration, setDuration] = useState(String(entry.duration));
  const [completedSets, setCompletedSets] = useState(String(entry.completedSets));
  const [volume, setVolume] = useState(String(entry.volume));
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericDuration = Number(duration);
    const numericSets = Number(completedSets);
    const numericVolume = Number(volume.replace(",", "."));
    if (!name.trim() || !date || date > todayKey || !Number.isFinite(numericDuration) || numericDuration < 1 || !Number.isFinite(numericSets) || numericSets < 1 || !Number.isFinite(numericVolume) || numericVolume < 0) {
      setError("Kontrollera namn, datum, minuter, antal set och volym.");
      return;
    }
    onSave({
      ...entry,
      name: name.trim(),
      date: date === originalDate ? entry.date : `${date}T12:00:00.000Z`,
      duration: Math.round(numericDuration),
      completedSets: Math.round(numericSets),
      volume: Math.round(numericVolume * 10) / 10,
    });
  }

  return (
    <div className="sheet-backdrop workout-edit-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet workout-edit-sheet" role="dialog" aria-modal="true" aria-labelledby={`workout-edit-${entry.id}`}>
        <div className="sheet-handle" />
        <div className="sheet-head"><div><small>REDIGERA TRÄNINGSPASS</small><h2 id={`workout-edit-${entry.id}`}>{entry.name}</h2><p>Övningsdetaljerna behålls när du ändrar passets sammanfattning.</p></div><button type="button" onClick={onClose} aria-label="Stäng passredigering"><X size={20} /></button></div>
        <form className="workout-edit-form" onSubmit={submit}>
          <label className="wide"><span>Passnamn</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label><span>Datum</span><input type="date" max={todayKey} value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label><span>Minuter</span><input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
          <label><span>Genomförda set</span><input type="number" min="1" value={completedSets} onChange={(event) => setCompletedSets(event.target.value)} /></label>
          <label><span>Total volym</span><div><input type="number" min="0" step="0.1" inputMode="decimal" value={volume} onChange={(event) => setVolume(event.target.value)} /><i>kg</i></div></label>
          {entry.exercises?.length ? <details className="workout-edit-exercises wide"><summary>Visa sparade övningar <ChevronDown size={15} /></summary><div>{entry.exercises.map((exercise) => <span key={exercise.id}><strong>{exercise.name}</strong><small>{exercise.sets.length} set · {formatNumber(exercise.volume)} kg</small></span>)}</div></details> : null}
          {error && <div className="nutrition-notice error wide"><CircleAlert size={15} />{error}</div>}
          <button className="primary-action wide" type="submit"><Check size={17} /> Spara ändringarna</button>
        </form>
      </section>
    </div>
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

function PlanView({ program, openDay, setOpenDay, nextPassId, programChoices, activeProgramId, activePassId, hasActivePass, onStart, onGuide, onSetNext, onCreateProgram, onSwitchProgram, onDeleteProgram, exerciseSwaps, exerciseSettings, favoriteExerciseIds, onSwap, onEditExercise, onToggleFavorite, onAddExercise, onRemoveExercise, onConfigureDays, onReorder }: {
  program: WorkoutDay[];
  openDay: string;
  setOpenDay: (id: string) => void;
  nextPassId: string;
  programChoices: SavedTrainingProgram[];
  activeProgramId: string;
  activePassId: string | null;
  hasActivePass: boolean;
  onStart: (day: WorkoutDay) => void;
  onGuide: (exercise: Exercise) => void;
  onSetNext: (day: WorkoutDay) => void;
  onCreateProgram: (name: string) => void;
  onSwitchProgram: (programId: string) => void;
  onDeleteProgram: (programId: string) => void;
  exerciseSwaps: Record<string, string>;
  exerciseSettings: Record<string, ExercisePrescription>;
  favoriteExerciseIds: string[];
  onSwap: (slotId: string, replacementId: string) => void;
  onEditExercise: (slotId: string, settings: ExercisePrescription) => void;
  onToggleFavorite: (exerciseId: string) => void;
  onAddExercise: (dayId: string, exercise: Exercise) => void;
  onRemoveExercise: (dayId: string, exerciseId: string) => void;
  onConfigureDays: (dayNames: string[]) => void;
  onReorder: (dayId: string, exerciseIds: string[]) => void;
}) {
  const nextPass = program.find((day) => day.id === nextPassId) ?? program[0];
  const activeProgram = programChoices.find((item) => item.id === activeProgramId) ?? programChoices[0];
  const [view, setView] = useState<"schedule" | "library">("schedule");
  const [libraryTarget, setLibraryTarget] = useState<Exercise | undefined>(undefined);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [programName, setProgramName] = useState("");

  function createProgram(event: FormEvent) {
    event.preventDefault();
    if (!programName.trim()) return;
    onCreateProgram(programName);
    setProgramName("");
    setCreatingProgram(false);
  }

  const viewSwitch = (
    <div className="plan-view-switch" role="tablist" aria-label="Schema eller övningsbank">
      <button type="button" role="tab" aria-selected={view === "schedule"} className={view === "schedule" ? "active" : ""} onClick={() => setView("schedule")}><CalendarDays size={17} /><span><strong>Mitt schema</strong><small>Pass och ordning</small></span></button>
      <button type="button" role="tab" aria-selected={view === "library"} className={view === "library" ? "active" : ""} onClick={() => setView("library")}><LibraryBig size={17} /><span><strong>Övningsbanken</strong><small>Kategorier och favoriter</small></span></button>
    </div>
  );

  if (view === "library") {
    return (
      <>
        <PageIntro eyebrow="ÖVNINGSBANK & PROGRAMBYGGARE" title="Hitta dina favoritövningar" description="Utforska per muskelgrupp, spara favoriter och lägg övningar direkt i valfritt pass." />
        {viewSwitch}
        <ExerciseLibraryPage
          program={program}
          programChoices={programChoices}
          activeProgramId={activeProgramId}
          activePassId={activePassId}
          hasActivePass={hasActivePass}
          favoriteExerciseIds={favoriteExerciseIds}
          onGuide={onGuide}
          onToggleFavorite={onToggleFavorite}
          onAddExercise={onAddExercise}
          onCreateProgram={onCreateProgram}
          onSwitchProgram={onSwitchProgram}
          onConfigureDays={onConfigureDays}
          onSwap={onSwap}
          onReorder={onReorder}
          onRemoveExercise={onRemoveExercise}
        />
      </>
    );
  }

  return (
    <>
      <PageIntro eyebrow="PROGRAM & ÖVNINGSBANK" title="Ditt träningsschema" description="Byt program, redigera passen och lär dig varje övning på ett ställe." />
      {viewSwitch}
      <section className="program-workspace-card card-surface">
        <div className="section-heading"><div><span>AKTIVT PROGRAM</span><h3>{activeProgram.name}</h3></div><ListPlus size={21} /></div>
        <p>{activeProgram.description}</p>
        <div className="program-workspace-actions">
          <label><span>Byt program</span><select value={activeProgramId} disabled={hasActivePass} onChange={(event) => onSwitchProgram(event.target.value)}>{programChoices.map((choice) => <option value={choice.id} key={choice.id}>{choice.name} · {choice.days.length} pass</option>)}</select></label>
          <button type="button" onClick={() => setView("library")}><LibraryBig size={17} /> Övningsbanken</button>
          <button type="button" onClick={() => setCreatingProgram((current) => !current)} disabled={hasActivePass}><Plus size={17} /> Nytt program</button>
          {activeProgramId !== BASE_PROGRAM_ID && <button className="danger" type="button" onClick={() => onDeleteProgram(activeProgramId)} disabled={hasActivePass}><Trash2 size={16} /> Ta bort</button>}
        </div>
        {hasActivePass && <p className="program-lock-note"><Lock size={14} /> Avsluta eller återställ det aktiva passet innan du byter program.</p>}
        {creatingProgram && <form className="program-create-form" onSubmit={createProgram}><label><span>Programnamn</span><input value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="Till exempel Sommarstyrka" autoFocus /></label><p>Det nya programmet kopierar nuvarande upplägg. Därefter kan varje övning, antal set, reps och vila ändras.</p><button className="primary-action" type="submit"><Plus size={17} /> Skapa och öppna</button></form>}
      </section>
      <section className="plan-position-card" aria-label={`Nästa pass är ${nextPass.name}`}>
        <span className="plan-position-icon"><MapPin size={22} fill="currentColor" /></span>
        <div><small>DU ÄR HÄR · NÄSTA I ORDNING</small><strong>Pass {String(nextPass.number).padStart(2, "0")} · {nextPass.name}</strong><p>Ändrade planer? Flytta markeringen till valfritt pass nedan.</p></div>
        <button type="button" onClick={() => setOpenDay(nextPass.id)}>Visa passet <ChevronDown size={16} className={openDay === nextPass.id ? "rotated" : ""} /></button>
      </section>
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
            <article className={`plan-card ${expanded ? "expanded" : ""} ${isNext ? "current" : ""}`} key={day.id} aria-current={isNext ? "step" : undefined}>
              {isNext && <div className="plan-current-ribbon"><MapPin size={13} fill="currentColor" /> DU ÄR HÄR · NÄSTA PASS</div>}
              <button className="plan-card-head" type="button" onClick={() => setOpenDay(expanded ? "" : day.id)}>
                <span className="plan-number">0{day.number}</span>
                <span className="plan-title"><small>{isNext ? "MARKERAT PASS" : day.style.toUpperCase()}</small><strong>{day.name}</strong><p>{day.focus}</p></span>
                <span className="plan-stats"><small>{estimatedWorkoutDuration(day.exercises)}</small><strong>{day.exercises.length} övningar</strong></span>
                <ChevronDown size={20} className={expanded ? "rotated" : ""} />
              </button>
              <div className="plan-marker-row">
                <span>{isNext ? <><Check size={14} />Det här kör du nästa gång</> : "Kastar du om? Flytta nästa pass hit."}</span>
                <button type="button" disabled={isNext} onClick={() => onSetNext(day)}>{isNext ? "Markerat" : <><MapPin size={14} /> Flytta hit</>}</button>
              </div>
              {expanded && (
                <div className="plan-card-body">
                  {day.exercises.map((exercise) => {
                    const swapped = Boolean(exerciseSwaps[exercise.id]);
                    return (
                      <div key={exercise.id} className={`plan-exercise-shell${swapped ? " swapped" : ""}`}>
                        <button className="plan-exercise" type="button" onClick={() => onGuide(exercise)} aria-label={`Visa övningsguide för ${exercise.name}`}>
                          <span>{String(exercise.order).padStart(2, "0")}</span>
                          <span className="plan-exercise-thumb" aria-hidden="true">
                            <Image src={exercise.imageStart} alt="" width={96} height={96} sizes="52px" unoptimized />
                          </span>
                          <div className="plan-exercise-copy"><strong>{exercise.name}</strong><small>{exercise.muscle} · {exercise.sets} × {repRangeLabel(exercise.minReps, exercise.maxReps)}</small></div>
                          <div className="target-weight">{exercise.weight ? `${exercise.weight} kg` : "Startvikt"}</div>
                          <Info size={15} />
                        </button>
                        <div className="exercise-edit-actions">
                          <span><strong>{exerciseSettings[exercise.id]?.sets ?? exercise.sets} set</strong><small>{repRangeLabel(exerciseSettings[exercise.id]?.minReps ?? exercise.minReps, exerciseSettings[exercise.id]?.maxReps ?? exercise.maxReps)} reps · {exerciseSettings[exercise.id]?.restSeconds ?? exercise.restSeconds} sek vila</small></span>
                          <button type="button" onClick={() => setEditingExercise(exercise)}><Pencil size={14} /> Redigera</button>
                          <button type="button" onClick={() => setLibraryTarget(exercise)}><RefreshCw size={14} /> Byt ut</button>
                          {swapped && <button className="reset" type="button" onClick={() => onSwap(exercise.id, "")}><RotateCcw size={14} /> Återställ</button>}
                          <button className="remove" type="button" onClick={() => { if (window.confirm(`Ta bort ${exercise.name} från ${day.name}?`)) onRemoveExercise(day.id, exercise.id); }}><Trash2 size={14} /> Ta bort</button>
                        </div>
                      </div>
                    );
                  })}
                  <button className="primary-action" type="button" disabled={day.exercises.length === 0} onClick={() => onStart(day)}>{day.exercises.length ? <><Play size={18} fill="currentColor" /> Starta {day.name}</> : <><LibraryBig size={18} /> Lägg till övningar i {day.name}</>}</button>
                </div>
              )}
            </article>
          );
        })}
      </section>
      {libraryTarget !== undefined && <ExerciseLibrarySheet target={libraryTarget} onGuide={onGuide} onSelect={(replacement) => { onSwap(libraryTarget.id, replacement.id); setLibraryTarget(undefined); }} onClose={() => setLibraryTarget(undefined)} />}
      {editingExercise && <ExercisePrescriptionSheet exercise={editingExercise} settings={exerciseSettings[editingExercise.id]} onSave={(settings) => { onEditExercise(editingExercise.id, settings); setEditingExercise(null); }} onClose={() => setEditingExercise(null)} />}
    </>
  );
}

function ExerciseLibraryPage({ program, programChoices, activeProgramId, activePassId, hasActivePass, favoriteExerciseIds, onGuide, onToggleFavorite, onAddExercise, onCreateProgram, onSwitchProgram, onConfigureDays, onSwap, onReorder, onRemoveExercise }: {
  program: WorkoutDay[];
  programChoices: SavedTrainingProgram[];
  activeProgramId: string;
  activePassId: string | null;
  hasActivePass: boolean;
  favoriteExerciseIds: string[];
  onGuide: (exercise: Exercise) => void;
  onToggleFavorite: (exerciseId: string) => void;
  onAddExercise: (dayId: string, exercise: Exercise) => void;
  onCreateProgram: (name: string) => void;
  onSwitchProgram: (programId: string) => void;
  onConfigureDays: (dayNames: string[]) => void;
  onSwap: (slotId: string, replacementId: string) => void;
  onReorder: (dayId: string, exerciseIds: string[]) => void;
  onRemoveExercise: (dayId: string, exerciseId: string) => void;
}) {
  const [category, setCategory] = useState<ExerciseCategory>("Styrka");
  const [muscle, setMuscle] = useState("Alla");
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [targetDayNumber, setTargetDayNumber] = useState(program[0]?.number ?? 1);
  const [programName, setProgramName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showDayEditor, setShowDayEditor] = useState(false);
  const [message, setMessage] = useState("");
  const activeProgram = programChoices.find((item) => item.id === activeProgramId) ?? programChoices[0];
  const activeDayIndex = activePassId ? program.findIndex((day) => day.id === activePassId) : -1;
  const targetDay = program.find((day) => day.number === targetDayNumber) ?? program[0];
  const muscles = [...new Set(EXERCISE_LIBRARY.filter((item) => item.category === category).map((item) => item.exercise.muscle))].sort((first, second) => first.localeCompare(second, "sv-SE"));
  const entries = EXERCISE_LIBRARY
    .filter((item) => item.category === category)
    .filter((item) => muscle === "Alla" || item.exercise.muscle === muscle)
    .filter((item) => !favoritesOnly || favoriteExerciseIds.includes(item.exercise.id))
    .filter((item) => !query.trim() || `${item.exercise.name} ${item.exercise.muscle} ${item.equipment}`.toLocaleLowerCase("sv-SE").includes(query.trim().toLocaleLowerCase("sv-SE")));
  const groupedEntries = [...entries.reduce((groups, item) => {
    const group = groups.get(item.exercise.muscle) ?? [];
    group.push(item);
    groups.set(item.exercise.muscle, group);
    return groups;
  }, new Map<string, LibraryExercise[]>())].sort(([first], [second]) => first.localeCompare(second, "sv-SE"));

  function createProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!programName.trim()) return;
    onCreateProgram(programName);
    setProgramName("");
    setShowCreate(false);
    setMessage("Det nya programmet är skapat och redo att byggas.");
  }

  function addExercise(exercise: Exercise) {
    if (!targetDay) return;
    const copiedBase = activeProgramId === BASE_PROGRAM_ID;
    onAddExercise(targetDay.id, exercise);
    setMessage(copiedBase
      ? `${exercise.name} lades till i en ny redigerbar kopia av programmet.`
      : `${exercise.name} lades till i ${targetDay.name}.`);
  }

  return (
    <>
      <section className="library-program-builder card-surface">
        <div className="section-heading"><div><span>PROGRAMBYGGARE</span><h3>Bygg {activeProgram.name}</h3></div><ListPlus size={21} /></div>
        <p>Välj vilket pass du bygger. Favoritmarkera det du gillar och lägg sedan in styrkeövningarna direkt från banken.</p>
        <div className="library-builder-controls">
          <label><span>Aktivt program</span><select value={activeProgramId} disabled={hasActivePass} onChange={(event) => onSwitchProgram(event.target.value)}>{programChoices.map((choice) => <option value={choice.id} key={choice.id}>{choice.name}</option>)}</select></label>
          <label><span>Lägg till i pass</span><select value={targetDay?.number ?? 1} disabled={hasActivePass} onChange={(event) => setTargetDayNumber(Number(event.target.value))}>{program.map((day) => <option value={day.number} key={day.id}>Pass {String(day.number).padStart(2, "0")} · {day.name} ({day.exercises.length})</option>)}</select></label>
          <div className="library-builder-buttons"><button type="button" onClick={() => setShowDayEditor((current) => !current)}><CalendarDays size={16} /> Redigera dagar</button><button type="button" disabled={hasActivePass} onClick={() => setShowCreate((current) => !current)}><Plus size={16} /> Nytt program</button></div>
        </div>
        {activeProgramId === BASE_PROGRAM_ID && !hasActivePass && <p className="library-copy-note"><Copy size={14} /> Första gången du lägger till eller tar bort något skapar Joxo automatiskt en egen redigerbar kopia. Grundprogrammet lämnas orört.</p>}
        {hasActivePass && <p className="program-lock-note"><Lock size={14} /> Du kan ändra dagar, ordning och övningar utan att förlora loggade set. Endast byte av hela programmet är låst medan passet pågår.</p>}
        {showCreate && <form className="library-create-program" onSubmit={createProgram}><label><span>Programnamn</span><input value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="Till exempel Favoritprogrammet" autoFocus /></label><button className="primary-action" type="submit"><Plus size={16} /> Skapa</button></form>}
        {showDayEditor && <ProgramDaysEditor key={`${activeProgramId}-${program.length}-${program.map((day) => day.name).join("-")}`} program={program} baseProgram={activeProgramId === BASE_PROGRAM_ID} activeDayIndex={activeDayIndex} onGuide={onGuide} onSwap={onSwap} onReorder={onReorder} onAddExercise={onAddExercise} onRemoveExercise={onRemoveExercise} onSave={(names) => { onConfigureDays(names); setShowDayEditor(false); setMessage(`${names.length} träningsdagar är sparade.`); }} onClose={() => setShowDayEditor(false)} />}
        {message && <div className="library-builder-message"><Check size={15} />{message}</div>}
      </section>

      <section className="library-category-overview" aria-label="Övningskategorier">
        {(["Styrka", "Uppvärmning", "Stretch"] as ExerciseCategory[]).map((item) => {
          const count = EXERCISE_LIBRARY.filter((exercise) => exercise.category === item).length;
          const Icon = item === "Styrka" ? Dumbbell : item === "Uppvärmning" ? Flame : Activity;
          return <button type="button" className={category === item ? "active" : ""} aria-pressed={category === item} key={item} onClick={() => { setCategory(item); setMuscle("Alla"); }}><span><Icon size={20} /></span><i><small>KATEGORI</small><strong>{item}</strong><p>{count} övningar</p></i><ChevronRight size={17} /></button>;
        })}
      </section>

      <section className="dedicated-library card-surface">
        <div className="dedicated-library-head">
          <div><small>{category.toUpperCase()}</small><h2>{favoritesOnly ? "Mina favoritövningar" : "Välj muskelgrupp"}</h2><p>{category === "Styrka" ? "10 genomarbetade övningar i varje muskelgrupp." : category === "Uppvärmning" ? "Rörelser som förbereder kroppen för dagens belastning." : "Lugna avslut för musklerna du har tränat."}</p></div>
          <button type="button" className={favoritesOnly ? "active" : ""} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((current) => !current)}><Star size={16} fill={favoritesOnly ? "currentColor" : "none"} /> Favoriter <span>{favoriteExerciseIds.length}</span></button>
        </div>
        <label className="library-search dedicated-search"><ScanLine size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök namn, muskel eller redskap" /></label>
        <div className="library-muscle-tabs dedicated-muscle-tabs"><button type="button" className={muscle === "Alla" ? "active" : ""} onClick={() => setMuscle("Alla")}>Alla muskelgrupper</button>{muscles.map((item) => <button type="button" className={muscle === item ? "active" : ""} key={item} onClick={() => setMuscle(item)}>{item}<small>{EXERCISE_LIBRARY.filter((exercise) => exercise.category === category && exercise.exercise.muscle === item).length}</small></button>)}</div>

        <div className="library-muscle-groups">
          {groupedEntries.map(([group, items]) => <section key={group}><div className="library-group-heading"><span><Target size={16} /></span><div><small>MUSKELGRUPP</small><h3>{group}</h3></div><b>{items.length} övningar</b></div><div className="library-builder-grid">{items.map((item) => {
            const favorite = favoriteExerciseIds.includes(item.exercise.id);
            const inTarget = Boolean(targetDay?.exercises.some((exercise) => exercise.name === item.exercise.name));
            return <LibraryBuilderCard key={`${item.category}-${item.exercise.id}`} item={item} favorite={favorite} inTarget={inTarget} targetDayName={targetDay?.name ?? "passet"} canAdd={item.category === "Styrka"} onGuide={() => onGuide(item.exercise)} onFavorite={() => onToggleFavorite(item.exercise.id)} onAdd={() => addExercise(item.exercise)} />;
          })}</div></section>)}
        </div>
        {!groupedEntries.length && <div className="library-empty"><Star size={30} /><strong>Inga övningar här ännu</strong><p>{favoritesOnly ? "Tryck på stjärnan på en övning för att spara den som favorit." : "Prova en annan sökning eller kategori."}</p></div>}
      </section>
    </>
  );
}

function ProgramDaysEditor({ program, baseProgram, activeDayIndex, onGuide, onSwap, onReorder, onAddExercise, onRemoveExercise, onSave, onClose }: { program: WorkoutDay[]; baseProgram: boolean; activeDayIndex: number; onGuide: (exercise: Exercise) => void; onSwap: (slotId: string, replacementId: string) => void; onReorder: (dayId: string, exerciseIds: string[]) => void; onAddExercise: (dayId: string, exercise: Exercise) => void; onRemoveExercise: (dayId: string, exerciseId: string) => void; onSave: (names: string[]) => void; onClose: () => void }) {
  const minimumDayCount = Math.max(1, activeDayIndex + 1);
  const [dayCount, setDayCount] = useState(Math.min(7, Math.max(1, program.length)));
  const [dayNames, setDayNames] = useState(() => Array.from({ length: 7 }, (_, index) => program[index]?.name ?? `Träningsdag ${index + 1}`));
  const [swapTarget, setSwapTarget] = useState<Exercise | null>(null);
  const [addTargetDay, setAddTargetDay] = useState<WorkoutDay | null>(null);
  const [previewOrders, setPreviewOrders] = useState<Record<string, string[]>>({});
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | null>(null);
  const previewOrdersRef = useRef<Record<string, string[]>>({});
  const draggingExerciseRef = useRef<{ dayId: string; exerciseId: string } | null>(null);
  const visibleDays = Array.from({ length: dayCount }, (_, index) => ({
    source: program[index],
    name: dayNames[index] || `Träningsdag ${index + 1}`,
    number: index + 1,
  }));
  const totalExercises = visibleDays.reduce((sum, day) => sum + (day.source?.exercises.length ?? 0), 0);

  function orderedExercises(day: WorkoutDay) {
    const savedOrder = previewOrders[day.id];
    if (!savedOrder?.length) return day.exercises;
    const exerciseById = new Map(day.exercises.map((exercise) => [exercise.id, exercise]));
    return [...savedOrder.map((exerciseId) => exerciseById.get(exerciseId)).filter((exercise): exercise is Exercise => Boolean(exercise)), ...day.exercises.filter((exercise) => !savedOrder.includes(exercise.id))];
  }

  function moveExercise(day: WorkoutDay, exerciseId: string, targetExerciseId: string) {
    const current = previewOrdersRef.current[day.id] ?? day.exercises.map((exercise) => exercise.id);
    const fromIndex = current.indexOf(exerciseId);
    const targetIndex = current.indexOf(targetExerciseId);
    if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return current;
    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, moved);
    previewOrdersRef.current = { ...previewOrdersRef.current, [day.id]: next };
    setPreviewOrders((orders) => ({ ...orders, [day.id]: next }));
    return next;
  }

  function startExerciseDrag(event: React.PointerEvent<HTMLButtonElement>, day: WorkoutDay, exerciseId: string) {
    if (event.pointerType !== "touch" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingExerciseRef.current = { dayId: day.id, exerciseId };
    setDraggingExerciseId(exerciseId);
    if ("vibrate" in navigator) navigator.vibrate(25);
  }

  function updateExerciseDrag(event: React.PointerEvent<HTMLButtonElement>, day: WorkoutDay) {
    const dragging = draggingExerciseRef.current;
    if (!dragging || dragging.dayId !== day.id) return;
    event.preventDefault();
    const targetRow = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-live-exercise-id]");
    const targetDayId = targetRow?.closest<HTMLElement>("[data-live-day-id]")?.dataset.liveDayId;
    const targetExerciseId = targetRow?.dataset.liveExerciseId;
    if (targetDayId === day.id && targetExerciseId) moveExercise(day, dragging.exerciseId, targetExerciseId);
  }

  function finishExerciseDrag(event: React.PointerEvent<HTMLButtonElement>, day: WorkoutDay) {
    const dragging = draggingExerciseRef.current;
    if (!dragging || dragging.dayId !== day.id) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const order = previewOrdersRef.current[day.id] ?? day.exercises.map((exercise) => exercise.id);
    draggingExerciseRef.current = null;
    setDraggingExerciseId(null);
    onReorder(day.id, order);
  }

  function cancelExerciseDrag(day: WorkoutDay) {
    const sourceOrder = day.exercises.map((exercise) => exercise.id);
    previewOrdersRef.current = { ...previewOrdersRef.current, [day.id]: sourceOrder };
    setPreviewOrders((orders) => ({ ...orders, [day.id]: sourceOrder }));
    draggingExerciseRef.current = null;
    setDraggingExerciseId(null);
  }

  function moveExerciseWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>, day: WorkoutDay, exerciseId: string) {
    const offset = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (!offset) return;
    event.preventDefault();
    const current = previewOrdersRef.current[day.id] ?? day.exercises.map((exercise) => exercise.id);
    const index = current.indexOf(exerciseId);
    const targetExerciseId = current[index + offset];
    if (!targetExerciseId) return;
    const next = moveExercise(day, exerciseId, targetExerciseId);
    onReorder(day.id, next);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(visibleDays.map((day) => day.name));
  }

  return (
    <>
    <form className="program-days-editor" onSubmit={submit}>
      <div className="program-days-editor-head"><div><small>PROGRAMSTRUKTUR</small><h3>Hur många dagar vill du träna?</h3><p>Välj antal, döp passen och kontrollera liveöversikten innan du sparar.</p></div><button type="button" onClick={onClose} aria-label="Stäng dagbyggaren"><X size={18} /></button></div>
      <div className="day-count-picker" role="group" aria-label="Antal träningsdagar">{[1, 2, 3, 4, 5, 6, 7].map((count) => <button type="button" disabled={count < minimumDayCount} aria-pressed={dayCount === count} className={dayCount === count ? "active" : ""} key={count} onClick={() => setDayCount(count)}><strong>{count}</strong><small>{count === 1 ? "dag" : "dagar"}</small></button>)}</div>
      <div className="program-day-name-fields">{visibleDays.map((day, index) => <label key={day.number}><span><b>{String(day.number).padStart(2, "0")}</b><i>Dag {day.number}</i></span><input value={dayNames[index]} onChange={(event) => setDayNames((current) => current.map((name, nameIndex) => nameIndex === index ? event.target.value : name))} placeholder={`Träningsdag ${day.number}`} /></label>)}</div>

      <section className="live-schedule-preview" aria-label="Liveöversikt över träningsdagar">
        <div className="live-schedule-head"><div><small>LIVEÖVERSIKT</small><h3>Så här blir ditt schema</h3></div><span><strong>{dayCount}</strong> dagar · <strong>{totalExercises}</strong> övningar</span></div>
        <div className="live-schedule-grid">{visibleDays.map((day) => {
          const muscles = [...new Set(day.source?.exercises.map((exercise) => exercise.muscle) ?? [])];
          const exercises = day.source ? orderedExercises(day.source) : [];
          return <article className={!day.source ? "new" : day.source.exercises.length === 0 ? "empty" : ""} data-live-day-id={day.source?.id} key={day.number}>
            <header className="live-day-summary"><span className="live-day-number">{String(day.number).padStart(2, "0")}</span><div><small>{day.source ? day.source.style.toUpperCase() : "NY TRÄNINGSDAG"}</small><strong>{day.name}</strong><p>{day.source?.exercises.length ? `${day.source.exercises.length} övningar · ${muscles.slice(0, 3).join(" · ")} · ${estimatedWorkoutDuration(exercises)}` : "Tom dag · lägg till övningar från banken"}</p></div><b>{day.source?.exercises.length ?? 0}</b></header>
            {exercises.length ? <ol className="live-day-exercises" aria-label={`Övningar i ${day.name}`}>{exercises.map((exercise, exerciseIndex) => <li className={draggingExerciseId === exercise.id ? "dragging" : ""} data-live-exercise-id={exercise.id} key={exercise.id}>
              <button className="live-exercise-drag" type="button" aria-label={`Dra för att flytta ${exercise.name}. Använd pil upp eller pil ner med tangentbord.`} aria-keyshortcuts="ArrowUp ArrowDown" onPointerDown={(event) => startExerciseDrag(event, day.source!, exercise.id)} onPointerMove={(event) => updateExerciseDrag(event, day.source!)} onPointerUp={(event) => finishExerciseDrag(event, day.source!)} onPointerCancel={() => cancelExerciseDrag(day.source!)} onKeyDown={(event) => moveExerciseWithKeyboard(event, day.source!, exercise.id)}><GripVertical size={13} /><span>{String(exerciseIndex + 1).padStart(2, "0")}</span></button>
              <div><strong>{exercise.name}</strong><small>{exercise.muscle}</small></div><b>{exercise.sets} × {exercise.minReps === exercise.maxReps ? exercise.minReps : `${exercise.minReps}–${exercise.maxReps}`}</b>
              <button className="live-exercise-swap" type="button" aria-label={`Byt ut ${exercise.name}`} onClick={() => setSwapTarget(exercise)}><RefreshCw size={12} /><span>Byt</span></button>
              <button className="live-exercise-remove" type="button" aria-label={`Ta bort ${exercise.name} från ${day.name}`} onClick={() => { if (window.confirm(`Ta bort ${exercise.name} från ${day.name}?`)) onRemoveExercise(day.source!.id, exercise.id); }}><Trash2 size={12} /></button>
            </li>)}</ol> : <p className="live-day-empty-exercises"><LibraryBig size={13} /> Inga övningar valda ännu</p>}
            <button className="live-day-add-exercise" type="button" disabled={!day.source} onClick={() => day.source && setAddTargetDay(day.source)}><Plus size={13} /><span>{day.source ? "Lägg till övning" : "Spara den nya dagen först"}</span>{day.source && <small>Ingen maxgräns</small>}</button>
          </article>;
        })}</div>
      </section>

      <p className="program-days-info"><GripVertical size={14} /> Dra för att ändra ordning. Byten, tillägg och borttagning sparas direkt; namn och antal dagar sparas med knappen nedan.</p>
      {dayCount < program.length && <p className="program-days-warning"><CircleAlert size={14} /> De sista {program.length - dayCount} {program.length - dayCount === 1 ? "dagen" : "dagarna"} tas bort när du sparar.</p>}
      {dayCount > program.length && <p className="program-days-info"><Plus size={14} /> {dayCount - program.length} {dayCount - program.length === 1 ? "ny tom dag skapas" : "nya tomma dagar skapas"}. Lägg sedan till övningar från banken.</p>}
      {activeDayIndex >= 0 && <p className="program-days-info"><Dumbbell size={14} /> Det pågående passet ligger kvar med alla loggade set. Den dagen och dagarna före den måste därför finnas kvar just nu.</p>}
      {baseProgram && <p className="program-days-info"><Copy size={14} /> Ändringen sparas i en egen programkopia. Joxo Foundation behålls oförändrat.</p>}
      <button className="primary-action program-days-save" type="submit"><Check size={17} /> Spara {dayCount} {dayCount === 1 ? "träningsdag" : "träningsdagar"}</button>
    </form>
    {swapTarget && <ExerciseLibrarySheet target={swapTarget} onGuide={onGuide} onSelect={(replacement) => { onSwap(swapTarget.id, replacement.id); setSwapTarget(null); }} onClose={() => setSwapTarget(null)} />}
    {addTargetDay && <ExerciseLibrarySheet target={null} selectionMode="add" onGuide={onGuide} onSelect={(exercise) => { onAddExercise(addTargetDay.id, exercise); setAddTargetDay(null); }} onClose={() => setAddTargetDay(null)} />}
    </>
  );
}

function LibraryBuilderCard({ item, favorite, inTarget, targetDayName, canAdd, onGuide, onFavorite, onAdd }: { item: LibraryExercise; favorite: boolean; inTarget: boolean; targetDayName: string; canAdd: boolean; onGuide: () => void; onFavorite: () => void; onAdd: () => void }) {
  return (
    <article className={`library-builder-card${favorite ? " favorite" : ""}`}>
      <button className="library-builder-guide" type="button" onClick={onGuide} aria-label={`Lär dig mer om ${item.exercise.name}`}>
        <span><Image src={item.exercise.imageStart} alt="" fill sizes="(max-width: 640px) 44vw, 250px" unoptimized /><i>{item.equipment}</i></span>
        <div><small>{item.exercise.muscle} · {item.category}</small><strong>{item.exercise.name}</strong><p>{item.dose}</p></div><Info size={16} />
      </button>
      <div className="library-builder-actions">
        <button type="button" className={favorite ? "favorite" : ""} aria-pressed={favorite} onClick={onFavorite}><Star size={15} fill={favorite ? "currentColor" : "none"} />{favorite ? "Favorit" : "Spara"}</button>
        {item.category === "Styrka" && <button type="button" className="add" disabled={!canAdd} onClick={onAdd}><Plus size={15} />{inTarget ? `Lägg till igen i ${targetDayName}` : `Lägg till i ${targetDayName}`}</button>}
      </div>
    </article>
  );
}

function ExerciseLibrarySheet({ target, selectionMode = "swap", onGuide, onSelect, onClose }: { target: Exercise | null; selectionMode?: "swap" | "add"; onGuide: (exercise: Exercise) => void; onSelect: (exercise: Exercise) => void; onClose: () => void }) {
  const [category, setCategory] = useState<ExerciseCategory>("Styrka");
  const [muscle, setMuscle] = useState("Alla");
  const [query, setQuery] = useState("");
  const muscles = [...new Set(EXERCISE_LIBRARY.filter((item) => item.category === category).map((item) => item.exercise.muscle))].sort((first, second) => first.localeCompare(second, "sv-SE"));
  const entries = EXERCISE_LIBRARY.filter((item) => item.category === category)
    .filter((item) => muscle === "Alla" || item.exercise.muscle === muscle)
    .filter((item) => !query.trim() || `${item.exercise.name} ${item.exercise.muscle} ${item.equipment}`.toLocaleLowerCase("sv-SE").includes(query.trim().toLocaleLowerCase("sv-SE")))
    .filter((item) => item.category !== "Styrka" ? !target && selectionMode !== "add" : !target || item.exercise.name !== target.name);
  const adding = selectionMode === "add";

  return (
    <div className="sheet-backdrop library-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet exercise-library-sheet" role="dialog" aria-modal="true" aria-label={adding ? "Lägg till övning" : target ? `Byt ut ${target.name}` : "Övningsbank"}>
        <div className="sheet-handle" />
        <div className="sheet-head"><div><small>{adding ? "LÄGG TILL · ALLA MUSKELGRUPPER" : target ? "BYT ÖVNING · ALLA MUSKELGRUPPER" : "TRÄNINGSLIBRARY"}</small><h2>{adding ? "Välj en övning" : target ? `Ersätt ${target.name}` : "Övningsbanken"}</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div>
        {!target && !adding && <div className="library-category-tabs" role="tablist" aria-label="Övningstyp">{(["Styrka", "Uppvärmning", "Stretch"] as ExerciseCategory[]).map((item) => <button type="button" role="tab" aria-selected={category === item} className={category === item ? "active" : ""} key={item} onClick={() => { setCategory(item); setMuscle("Alla"); }}>{item === "Styrka" ? <Dumbbell size={16} /> : item === "Uppvärmning" ? <Flame size={16} /> : <Waves size={16} />}{item}</button>)}</div>}
        <label className="library-search"><ScanLine size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök övning, muskel eller redskap" /></label>
        <div className="library-muscle-tabs"><button type="button" className={muscle === "Alla" ? "active" : ""} onClick={() => setMuscle("Alla")}>Alla</button>{muscles.map((item) => <button type="button" className={muscle === item ? "active" : ""} key={item} onClick={() => setMuscle(item)}>{item}{category === "Styrka" && <small>{STRENGTH_EXERCISES.filter((exercise) => exercise.muscle === item).length}</small>}</button>)}</div>
        <div className="exercise-library-grid">
          {entries.map((item) => <LibraryExerciseCard key={`${item.category}-${item.exercise.id}`} item={item} selectable={Boolean(target) || adding} selectLabel={adding ? "Lägg till" : "Byt till denna"} onGuide={() => onGuide(item.exercise)} onSelect={() => onSelect(item.exercise)} />)}
        </div>
        {!entries.length && <div className="library-empty"><LibraryBig size={30} /><strong>Inga övningar matchar</strong><p>Prova en annan sökning eller muskelgrupp.</p></div>}
      </section>
    </div>
  );
}

function LibraryExerciseCard({ item, selectable, selectLabel, onGuide, onSelect }: { item: LibraryExercise; selectable: boolean; selectLabel: "Lägg till" | "Byt till denna"; onGuide: () => void; onSelect: () => void }) {
  return (
    <article className="library-exercise-card">
      <button className="library-exercise-main" type="button" onClick={onGuide} aria-label={`Lär dig mer om ${item.exercise.name}`}>
        <span className="library-exercise-image"><Image src={item.exercise.imageStart} alt="" fill sizes="(max-width: 620px) 42vw, 220px" unoptimized /><i>{item.category}</i></span>
        <span><small>{item.exercise.muscle} · {item.equipment}</small><strong>{item.exercise.name}</strong><p>{item.dose}</p></span>
        <Info size={16} />
      </button>
      {selectable && <button className="library-select-action" type="button" onClick={onSelect}>{selectLabel === "Lägg till" ? <Plus size={15} /> : <RefreshCw size={15} />} {selectLabel}</button>}
    </article>
  );
}

function ExercisePrescriptionSheet({ exercise, settings, onSave, onClose }: { exercise: Exercise; settings?: ExercisePrescription; onSave: (settings: ExercisePrescription) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<ExercisePrescription>(settings ?? { sets: exercise.sets, minReps: exercise.minReps, maxReps: exercise.maxReps, restSeconds: exercise.restSeconds });
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet exercise-prescription-sheet" role="dialog" aria-modal="true" aria-label={`Redigera ${exercise.name}`}>
        <div className="sheet-handle" /><div className="sheet-head"><div><small>PASSINSTÄLLNINGAR</small><h2>{exercise.name}</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div>
        <div className="prescription-preview"><span className="plan-exercise-thumb"><Image src={exercise.imageStart} alt="" width={96} height={96} sizes="52px" unoptimized /></span><div><small>{exercise.muscle}</small><strong>{draft.sets} × {repRangeLabel(draft.minReps, draft.maxReps)}</strong><p>{draft.restSeconds} sekunders vila</p></div></div>
        <div className="prescription-grid"><label><span>Set</span><input type="number" min="1" max="10" value={draft.sets} onChange={(event) => setDraft((current) => ({ ...current, sets: Number(event.target.value) }))} /></label><label><span>Min reps</span><input type="number" min="1" max="100" value={draft.minReps} onChange={(event) => setDraft((current) => ({ ...current, minReps: Number(event.target.value) }))} /></label><label><span>Max reps</span><input type="number" min="1" max="100" value={draft.maxReps} onChange={(event) => setDraft((current) => ({ ...current, maxReps: Number(event.target.value) }))} /></label><label><span>Vila</span><div className="input-unit"><input type="number" min="0" step="15" value={draft.restSeconds} onChange={(event) => setDraft((current) => ({ ...current, restSeconds: Number(event.target.value) }))} /><i>sek</i></div></label></div>
        <button className="primary-action" type="button" onClick={() => onSave({ ...draft, minReps: Math.min(draft.minReps, draft.maxReps), maxReps: Math.max(draft.minReps, draft.maxReps) })}><Check size={18} /> Spara i passet</button>
      </section>
    </div>
  );
}

function WorkoutView({ activePass, nextPass, logs, history, spotifyPlaylists, activeSpotifyPlaylistId, onStart, onUpdateSet, onToggleSet, onFinish, onReset, onGuide, onApplySuggestion, onSelectSpotify, onAddSpotify, onRemoveSpotify, onReorder }: { activePass: WorkoutDay | null; nextPass: WorkoutDay; logs: Record<string, SetEntry[]>; history: HistoryEntry[]; spotifyPlaylists: SpotifyPlaylist[]; activeSpotifyPlaylistId: string; onStart: (day: WorkoutDay) => void; onUpdateSet: (exerciseId: string, index: number, patch: Partial<SetEntry>) => void; onToggleSet: (exercise: Exercise, index: number) => void; onFinish: () => void; onReset: () => void; onGuide: (exercise: Exercise) => void; onApplySuggestion: (exercise: Exercise) => void; onSelectSpotify: (playlistId: string) => void; onAddSpotify: (name: string, url: string) => boolean; onRemoveSpotify: (playlistId: string) => void; onReorder: (passId: string, exerciseIds: string[]) => void }) {
  const initialExerciseIds = activePass?.exercises.map((exercise) => exercise.id) ?? [];
  const [orderedExerciseIds, setOrderedExerciseIds] = useState(initialExerciseIds);
  const [exerciseModes, setExerciseModes] = useState<Record<string, ExerciseCardMode>>(() => Object.fromEntries(
    (activePass?.exercises ?? []).map((exercise, index) => [exercise.id, index === 0 ? "full" : "compact"]),
  ));
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | null>(null);
  const orderedExerciseIdsRef = useRef(initialExerciseIds);
  const draggingExerciseIdRef = useRef<string | null>(null);

  if (!activePass) {
    return (
      <>
        <SpotifyWorkoutPlayer playlists={spotifyPlaylists} activePlaylistId={activeSpotifyPlaylistId} onSelect={onSelectSpotify} onAdd={onAddSpotify} onRemove={onRemoveSpotify} />
        <div className="empty-workout">
          <span className="empty-icon"><Dumbbell size={38} /></span>
          <small>REDO NÄR DU ÄR</small>
          <h1>Starta nästa pass</h1>
          <p>{nextPass.name} · {nextPass.exercises.length} övningar · {estimatedWorkoutDuration(nextPass.exercises)}</p>
          <button className="primary-action" type="button" disabled={nextPass.exercises.length === 0} onClick={() => onStart(nextPass)}>{nextPass.exercises.length ? <><Play size={18} fill="currentColor" /> Starta passet</> : <><LibraryBig size={18} /> Lägg till övningar först</>}</button>
        </div>
      </>
    );
  }

  const exerciseById = new Map(activePass.exercises.map((exercise) => [exercise.id, exercise]));
  const orderedExercises = orderedExerciseIds.map((exerciseId) => exerciseById.get(exerciseId)).filter((exercise): exercise is Exercise => Boolean(exercise));
  const allSets = orderedExercises.flatMap((exercise) => logs[exercise.id] ?? []);
  const doneSets = allSets.filter((set) => set.done).length;
  const progress = allSets.length ? Math.round((doneSets / allSets.length) * 100) : 0;
  const passMuscles = new Set(activePass.exercises.map((exercise) => exercise.muscle));
  const warmups = WARMUP_EXERCISES.filter((item) => item.exercise.muscle === "Helkropp" || passMuscles.has(item.exercise.muscle)).slice(0, 4);
  const stretches = STRETCH_EXERCISES.filter((item) => passMuscles.has(item.exercise.muscle)).slice(0, 4);

  const changeExerciseMode = (exerciseId: string, nextMode: ExerciseCardMode) => {
    setExerciseModes((current) => {
      if (nextMode !== "full") return { ...current, [exerciseId]: nextMode };
      return Object.fromEntries(orderedExercises.map((exercise) => [exercise.id, exercise.id === exerciseId ? "full" : "compact"]));
    });
  };

  const advanceExercise = (index: number) => {
    const nextExercise = orderedExercises[index + 1];
    setExerciseModes(Object.fromEntries(orderedExercises.map((exercise) => [exercise.id, exercise.id === nextExercise?.id ? "full" : "compact"])));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(nextExercise ? `exercise-card-${nextExercise.id}` : "workout-finish")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  };

  const moveExercise = (exerciseId: string, targetExerciseId: string) => {
    const current = orderedExerciseIdsRef.current;
    const fromIndex = current.indexOf(exerciseId);
    const targetIndex = current.indexOf(targetExerciseId);
    if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return;
    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, moved);
    orderedExerciseIdsRef.current = next;
    setOrderedExerciseIds(next);
  };

  const startExerciseDrag = (event: React.PointerEvent<HTMLButtonElement>, exerciseId: string) => {
    if (event.pointerType !== "touch" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingExerciseIdRef.current = exerciseId;
    setDraggingExerciseId(exerciseId);
    if ("vibrate" in navigator) navigator.vibrate(25);
  };

  const updateExerciseDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const exerciseId = draggingExerciseIdRef.current;
    if (!exerciseId) return;
    event.preventDefault();
    const targetCard = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-exercise-id]");
    const targetExerciseId = targetCard?.dataset.exerciseId;
    if (targetExerciseId) moveExercise(exerciseId, targetExerciseId);
  };

  const finishExerciseDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const exerciseId = draggingExerciseIdRef.current;
    if (!exerciseId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    draggingExerciseIdRef.current = null;
    setDraggingExerciseId(null);
    onReorder(activePass.id, orderedExerciseIdsRef.current);
  };

  const cancelExerciseDrag = () => {
    const originalOrder = activePass.exercises.map((exercise) => exercise.id);
    orderedExerciseIdsRef.current = originalOrder;
    setOrderedExerciseIds(originalOrder);
    draggingExerciseIdRef.current = null;
    setDraggingExerciseId(null);
  };

  const moveExerciseWithKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>, exerciseId: string) => {
    const offset = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (!offset) return;
    event.preventDefault();
    const current = orderedExerciseIdsRef.current;
    const currentIndex = current.indexOf(exerciseId);
    const targetIndex = Math.max(0, Math.min(current.length - 1, currentIndex + offset));
    if (currentIndex === targetIndex) return;
    moveExercise(exerciseId, current[targetIndex]);
    onReorder(activePass.id, orderedExerciseIdsRef.current);
  };

  return (
    <>
      <SpotifyWorkoutPlayer playlists={spotifyPlaylists} activePlaylistId={activeSpotifyPlaylistId} onSelect={onSelectSpotify} onAdd={onAddSpotify} onRemove={onRemoveSpotify} />

      <section className="active-workout-head">
        <div><span>AKTIVT PASS · {progress}%</span><h1>{activePass.name}</h1><p>{doneSets} av {allSets.length} arbetsset klara</p></div>
        <button type="button" className="icon-button" onClick={onReset} aria-label="Återställ pass"><RotateCcw size={18} /></button>
        <div className="workout-progress"><i style={{ width: `${progress}%` }} /></div>
      </section>

      <WorkoutRoutineCard category="Uppvärmning" title="Förbered kroppen" description="Lugn puls, rörlighet och aktivering för musklerna i dagens pass." entries={warmups} onGuide={onGuide} />

      <section className="exercise-list">
        {orderedExercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            dragging={draggingExerciseId === exercise.id}
            mode={exerciseModes[exercise.id] ?? (index === 0 ? "full" : "compact")}
            sets={logs[exercise.id] ?? createSets(exercise)}
            history={history}
            nextExerciseName={orderedExercises[index + 1]?.name}
            onUpdate={(index, patch) => onUpdateSet(exercise.id, index, patch)}
            onToggle={(index) => onToggleSet(exercise, index)}
            onGuide={() => onGuide(exercise)}
            onApplySuggestion={() => onApplySuggestion(exercise)}
            onModeChange={(nextMode) => changeExerciseMode(exercise.id, nextMode)}
            onNext={() => advanceExercise(index)}
            onDragStart={(event) => startExerciseDrag(event, exercise.id)}
            onDragMove={updateExerciseDrag}
            onDragEnd={finishExerciseDrag}
            onDragCancel={cancelExerciseDrag}
            onDragKeyDown={(event) => moveExerciseWithKeyboard(event, exercise.id)}
          />
        ))}
      </section>

      <WorkoutRoutineCard category="Stretch" title="Varva ned" description="Korta, lugna positioner efter sista arbetssetet. Stretch ska kännas tydligt men inte göra ont." entries={stretches} onGuide={onGuide} />

      <section className="finish-panel" id="workout-finish">
        <div><Trophy size={22} /><span><strong>{doneSets} set klara</strong><small>Alla ändringar autosparas.</small></span></div>
        <button className="primary-action" type="button" disabled={doneSets === 0} onClick={onFinish}>Avsluta passet <Check size={18} /></button>
      </section>
    </>
  );
}

type ExerciseCardMode = "full" | "compact";

function ExerciseCard({ exercise, mode, dragging, sets, history, nextExerciseName, onUpdate, onToggle, onGuide, onApplySuggestion, onModeChange, onNext, onDragStart, onDragMove, onDragEnd, onDragCancel, onDragKeyDown }: { exercise: Exercise; mode: ExerciseCardMode; dragging: boolean; sets: SetEntry[]; history: HistoryEntry[]; nextExerciseName?: string; onUpdate: (index: number, patch: Partial<SetEntry>) => void; onToggle: (index: number) => void; onGuide: () => void; onApplySuggestion: () => void; onModeChange: (mode: ExerciseCardMode) => void; onNext: () => void; onDragStart: (event: React.PointerEvent<HTMLButtonElement>) => void; onDragMove: (event: React.PointerEvent<HTMLButtonElement>) => void; onDragEnd: (event: React.PointerEvent<HTMLButtonElement>) => void; onDragCancel: () => void; onDragKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void }) {
  const last = sets[sets.length - 1] ?? { weight: exercise.weight, reps: exercise.startReps, rpe: 8 };
  const advice = getExerciseAdvice(exercise, last.reps, last.rpe, last.weight);
  const complete = sets.filter((set) => set.done).length;
  const suggestion = smartSetPlan(exercise, history);
  const targetWeight = sets.find((set) => set.weight !== null)?.weight ?? null;
  const loading = targetWeight !== null && targetWeight >= 20 ? plateLoading(targetWeight) : null;
  const isFull = mode === "full";
  const isCompact = mode === "compact";
  const nextMode: ExerciseCardMode = isFull ? "compact" : "full";
  const toggleLabel = isFull ? "Minimera helt" : "Öppna hela kortet";

  return (
    <article className={`exercise-card mode-${mode} ${dragging ? "dragging" : ""} ${complete === sets.length ? "complete" : ""}`} data-card-mode={mode} data-exercise-id={exercise.id} id={`exercise-card-${exercise.id}`}>
      {!isCompact && (
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
      )}
      <div className="exercise-title-row">
        {isCompact && (
          <span className="exercise-compact-thumbnail" aria-hidden="true">
            <Image src={exercise.imageStart} alt="" fill sizes="46px" unoptimized />
          </span>
        )}
        <div className="exercise-title-copy"><small>{exercise.sets} × {repRangeLabel(exercise.minReps, exercise.maxReps)} · vila {Math.round(exercise.restSeconds / 15) * 15} sek</small><h2>{exercise.name}</h2></div>
        <button className="exercise-drag-handle" type="button" aria-label={`Dra för att flytta ${exercise.name}. Använd pil upp eller pil ner med tangentbord.`} aria-keyshortcuts="ArrowUp ArrowDown" onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragCancel} onKeyDown={onDragKeyDown}>
          <GripVertical size={18} /><span>Dra</span>
        </button>
        <button className="exercise-toggle" type="button" onClick={() => onModeChange(nextMode)} aria-expanded={isFull} aria-label={`${toggleLabel} för ${exercise.name}`} title={`${toggleLabel} för ${exercise.name}`}>
          <span>{complete}/{sets.length}</span>
          <ChevronDown size={17} className={isFull ? "rotated" : ""} />
        </button>
      </div>

      {!isCompact && <div className="recommendation-strip smart-recommendation"><Sparkles size={16} /><span><small>SMART SETFÖRSLAG</small><strong>{suggestion.label}</strong><em>{suggestion.previousLabel}</em></span><button type="button" onClick={onApplySuggestion}>Använd</button></div>}

      {isFull && (
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
          {loading && (
            <details className="plate-calculator">
              <summary><Calculator size={15} /><span><strong>Viktskivor för {formatNumber(targetWeight as number)} kg</strong><small>20 kg stång · per sida</small></span><ChevronDown size={15} /></summary>
              <div>{loading.plates.length ? loading.plates.map((plate, index) => <b key={`${plate}-${index}`}>{formatNumber(plate)}</b>) : <span>Bara stången</span>}{!loading.exact && <small>Avrunda till närmaste möjliga lastning.</small>}</div>
            </details>
          )}
          <div className="next-advice-note"><TrendingUp size={15} /><span><small>EFTER PASS</small>{advice}</span></div>
          <div className="exercise-note"><CircleAlert size={15} />{exercise.note}</div>
          <button className="primary-action exercise-next-action" type="button" onClick={onNext}>
            <span><strong>{nextExerciseName ? "Nästa övning" : "Till avslut"}</strong><small>{nextExerciseName ?? "Alla övningar genomgångna"}</small></span>
            {nextExerciseName ? <ArrowRight size={19} /> : <Check size={19} />}
          </button>
        </div>
      )}
    </article>
  );
}

function SpotifyWorkoutPlayer({ playlists, activePlaylistId, onSelect, onAdd, onRemove }: { playlists: SpotifyPlaylist[]; activePlaylistId: string; onSelect: (playlistId: string) => void; onAdd: (name: string, url: string) => boolean; onRemove: (playlistId: string) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const active = playlists.find((playlist) => playlist.id === activePlaylistId) ?? playlists[0];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !onAdd(name, url)) {
      setMessage("Klistra in en giltig Spotify-länk till en spellista.");
      return;
    }
    setName("");
    setUrl("");
    setMessage("Spellistan är sparad som träningsfavorit.");
  }

  return (
    <section className="spotify-workout-player card-surface">
      <div className="section-heading"><div><span>SPOTIFY</span><h3>Musik till passet</h3></div><Music2 size={21} /></div>
      {active ? (
        <>
          <div className="spotify-now-playing"><span><i /><small>AKTIV SPELLISTA</small><strong>{active.name}</strong></span><a href={active.url} target="_blank" rel="noreferrer">Öppna Spotify <ExternalLink size={14} /></a></div>
          <iframe title={`Spotify · ${active.name}`} src={`https://open.spotify.com/embed/playlist/${active.spotifyId}?utm_source=generator&theme=0`} width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
        </>
      ) : <div className="spotify-empty"><Music2 size={22} /><span><strong>Lägg till din första träningsspellista</strong><small>Spotify-länken sparas i din profil.</small></span></div>}
      <div className="spotify-favorites" aria-label="Favoritspellistor">{playlists.map((playlist) => <span className={playlist.id === active?.id ? "active" : ""} key={playlist.id}><button type="button" onClick={() => onSelect(playlist.id)}><Music2 size={13} />{playlist.name}</button>{playlists.length > 1 && <button type="button" onClick={() => onRemove(playlist.id)} aria-label={`Ta bort ${playlist.name}`}><X size={12} /></button>}</span>)}</div>
      <details className="spotify-add"><summary><Plus size={15} /> Lägg till favoritspellista <ChevronDown size={15} /></summary><form onSubmit={submit}><label><span>Namn</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Till exempel Benpass" /></label><label><span>Spotify-länk</span><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://open.spotify.com/playlist/…" /></label><button className="secondary-action" type="submit"><Plus size={15} /> Spara favorit</button>{message && <p>{message}</p>}</form></details>
      <p className="spotify-note">Spelaren visar och spelar låten som körs här i Joxo. Att spegla musik som redan spelar i en annan Spotify-app kräver att du kopplar ett Spotify-konto.</p>
    </section>
  );
}

function WorkoutRoutineCard({ category, title, description, entries, onGuide }: { category: "Uppvärmning" | "Stretch"; title: string; description: string; entries: LibraryExercise[]; onGuide: (exercise: Exercise) => void }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const toggle = (id: string) => setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return (
    <details className={`workout-routine-card routine-${category === "Stretch" ? "stretch" : "warmup"}`} open={category === "Uppvärmning"}>
      <summary><span className="workout-routine-icon">{category === "Uppvärmning" ? <Flame size={19} /> : <Activity size={19} />}</span><span><small>{category.toUpperCase()} · {completed.length}/{entries.length}</small><strong>{title}</strong><p>{description}</p></span><ChevronDown size={18} /></summary>
      <div className="workout-routine-list">{entries.map((item) => {
        const done = completed.includes(item.exercise.id);
        return <article className={done ? "done" : ""} key={item.exercise.id}><button className="routine-guide" type="button" onClick={() => onGuide(item.exercise)}><span><Image src={item.exercise.imageStart} alt="" fill sizes="56px" unoptimized /></span><i><small>{item.exercise.muscle} · {item.equipment}</small><strong>{item.exercise.name}</strong><p>{item.dose}</p></i><Info size={15} /></button><button className="routine-check" type="button" onClick={() => toggle(item.exercise.id)} aria-pressed={done} aria-label={`Markera ${item.exercise.name} ${done ? "inte klar" : "klar"}`}><Check size={17} /></button></article>;
      })}</div>
    </details>
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

function progressDateLabel(date: string) {
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Stockholm" }).format(new Date(`${date}T12:00:00.000Z`));
}

function WeeklyCoachReport({ state, foodEntries, todayKey }: { state: PersistedState; foodEntries: FoodEntry[]; todayKey: string }) {
  const week = calendarWeek(todayKey);
  const dateSet = new Set(week.days.map((day) => day.dateKey));
  const workouts = state.history.filter((entry) => dateSet.has(stockholmDateKey(entry.date)));
  const weekFood = foodEntries.filter((entry) => dateSet.has(entryDate(entry, todayKey)));
  const nutritionDays = new Map<string, { calories: number; protein: number }>();
  weekFood.forEach((entry) => {
    const date = entryDate(entry, todayKey);
    const current = nutritionDays.get(date) ?? { calories: 0, protein: 0 };
    nutritionDays.set(date, { calories: current.calories + entry.calories, protein: current.protein + entry.protein });
  });
  const days = [...nutritionDays.values()];
  const calorieAverage = days.length ? Math.round(days.reduce((sum, day) => sum + day.calories, 0) / days.length) : 0;
  const proteinAverage = days.length ? Math.round(days.reduce((sum, day) => sum + day.protein, 0) / days.length) : 0;
  const health = state.dailyHealth.filter((entry) => dateSet.has(entry.date));
  const routines = health.length ? Math.round((health.reduce((sum, entry) => sum + Number(entry.creatineTaken) + Number(entry.vitaminsTaken), 0) / (health.length * 2)) * 100) : 0;
  const suggestions: string[] = [];
  if (workouts.length < state.profile.weeklyGoal) suggestions.push(`${state.profile.weeklyGoal - workouts.length} pass återstår till veckomålet. Lägg nästa pass på en realistisk dag.`);
  else suggestions.push("Veckans träningsmål är nått. Prioritera återhämtning mellan passen.");
  if (proteinAverage && proteinAverage < state.nutrition.proteinTarget * 0.9) suggestions.push(`Protein ligger i snitt ${state.nutrition.proteinTarget - proteinAverage} g under målet. Lägg till en enkel proteinkälla per dag.`);
  else if (proteinAverage) suggestions.push("Proteinintaget ligger nära målet på dina loggade dagar.");
  else suggestions.push("Logga minst två matdagar så kan coachrapporten bedöma kosttrenden.");
  if (!health.length) suggestions.push("Logga kreatin och vitaminer några dagar så kan rapporten följa dina rutiner.");
  else if (routines < 70) suggestions.push("Kreatin och vitaminer missas ibland. Koppla dem till samma dagliga rutin.");
  else suggestions.push("Dina dagliga rutiner ser stabila ut – fortsätt på samma sätt.");

  return (
    <section className="card-surface coach-report-card">
      <div className="section-heading"><div><span>JOXO PT · VECKA {week.number}</span><h3>Din veckorapport</h3></div><Brain size={20} /></div>
      <div className="coach-report-score"><strong>{workouts.length}/{state.profile.weeklyGoal}</strong><span>pass den här veckan</span><i style={{ "--score": `${Math.min(100, Math.round((workouts.length / Math.max(1, state.profile.weeklyGoal)) * 100))}%` } as React.CSSProperties} /></div>
      <div className="coach-report-metrics"><span><small>VOLYM</small><strong>{formatNumber(workouts.reduce((sum, entry) => sum + entry.volume, 0) / 1000)} t</strong></span><span><small>KCAL / LOGGAD DAG</small><strong>{calorieAverage || "–"}</strong></span><span><small>PROTEIN / DAG</small><strong>{proteinAverage ? `${proteinAverage} g` : "–"}</strong></span><span><small>RUTINER</small><strong>{routines || 0}%</strong></span></div>
      <ol className="coach-report-actions">{suggestions.map((suggestion, index) => <li key={suggestion}><span>{index + 1}</span><p>{suggestion}</p></li>)}</ol>
      <p className="fine-print">Rapporten uppdateras från dina egna loggar och ersätter inte medicinsk rådgivning.</p>
    </section>
  );
}

function WeightGoalCard({ state, setState, todayKey }: { state: PersistedState; setState: React.Dispatch<React.SetStateAction<PersistedState>>; todayKey: string }) {
  const series = weightTrend(state);
  const observed = observedWeeklyWeightChange(series);
  const latest = series.at(-1)?.trend ?? state.profile.weightKg;
  const projection = projectedGoalDate(todayKey, latest, state.goalPlan);
  const min = series.length ? Math.min(...series.map((item) => item.trend)) : latest;
  const max = series.length ? Math.max(...series.map((item) => item.trend)) : latest;
  const points = series.slice(-20).map((item, index, visible) => {
    const x = visible.length === 1 ? 50 : (index / (visible.length - 1)) * 100;
    const y = 88 - ((item.trend - min) / Math.max(0.1, max - min)) * 72;
    return `${x},${y}`;
  }).join(" ");
  return (
    <section className="card-surface weight-goal-card">
      <div className="section-heading"><div><span>VIKTTREND & PROGNOS</span><h3>Mot {formatNumber(state.goalPlan.targetWeightKg)} kg</h3></div>{observed !== null && observed < 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}</div>
      {series.length >= 2 ? <svg className="weight-trend-chart" role="img" aria-label="Utjämnad vikttrend" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg> : <div className="chart-empty compact"><Scale size={26} /><p>Logga vikt minst två dagar för en trendkurva.</p></div>}
      <div className="weight-goal-summary"><span><small>TRENDVIKT</small><strong>{formatNumber(latest)} kg</strong></span><span><small>TAKT</small><strong>{observed === null ? "–" : `${observed > 0 ? "+" : ""}${formatNumber(observed)} kg/v`}</strong></span><span><small>PROGNOS</small><strong>{projection ? progressDateLabel(projection) : "Behöver måltempo"}</strong></span></div>
      <div className="form-grid two goal-plan-fields"><label><span>Målvikt</span><div className="input-unit"><input type="number" step="0.1" value={state.goalPlan.targetWeightKg} onChange={(event) => setState((current) => ({ ...current, goalPlan: { ...current.goalPlan, targetWeightKg: Number(event.target.value) } }))} /><i>kg</i></div></label><label><span>Önskad takt/vecka</span><div className="input-unit"><input type="number" step="0.05" value={state.goalPlan.desiredWeeklyChangeKg} onChange={(event) => setState((current) => ({ ...current, goalPlan: { ...current.goalPlan, desiredWeeklyChangeKg: Number(event.target.value) } }))} /><i>kg</i></div></label></div>
    </section>
  );
}

function ExerciseProgressCard({ state, program }: { state: PersistedState; program: WorkoutDay[] }) {
  const names = [...new Set([...program.flatMap((day) => day.exercises.map((exercise) => exercise.name)), ...state.history.flatMap((entry) => entry.exercises?.map((exercise) => exercise.name) ?? [])])];
  const [selected, setSelected] = useState(names[0] ?? "");
  const series = state.history.slice().reverse().flatMap((entry) => {
    const exercise = entry.exercises?.find((item) => item.name === selected);
    if (!exercise) return [];
    const best = exercise.sets.reduce((current, set) => {
      const estimate = (set.weight ?? 0) * (1 + set.reps / 30);
      return Math.max(current, estimate);
    }, 0);
    return [{ date: stockholmDateKey(entry.date), value: Math.round(best * 10) / 10, volume: exercise.volume }];
  });
  const max = Math.max(1, ...series.map((item) => item.value));
  return (
    <section className="card-surface exercise-progress-card">
      <div className="section-heading"><div><span>ÖVNINGSUTVECKLING</span><h3>Styrka pass för pass</h3></div><TrendingUp size={20} /></div>
      <label className="exercise-progress-select"><span>Övning</span><select value={selected} onChange={(event) => setSelected(event.target.value)}>{names.map((name) => <option key={name}>{name}</option>)}</select></label>
      {series.length ? <div className="exercise-progress-bars">{series.slice(-12).map((item) => <div key={`${item.date}-${item.value}`}><i style={{ height: `${Math.max(10, (item.value / max) * 100)}%` }} /><span>{item.date.slice(5)}</span><b>{formatNumber(item.value)}</b></div>)}</div> : <div className="chart-empty compact"><Dumbbell size={26} /><p>När du avslutar ett pass visas uppskattad 1RM och volym här.</p></div>}
      <p className="fine-print">Stapeln visar uppskattad 1RM från bästa loggade set. Den används bara för att jämföra din egen trend.</p>
    </section>
  );
}

function AdaptiveNutritionCard({ state, setState }: { state: PersistedState; setState: React.Dispatch<React.SetStateAction<PersistedState>> }) {
  const [decision, setDecision] = useState<"accepted" | "kept" | null>(null);
  const observed = observedWeeklyWeightChange(weightTrend(state));
  const desired = state.goalPlan.desiredWeeklyChangeKg;
  const delta = observed === null ? 0 : observed - desired;
  const adjustment = Math.abs(delta) < 0.15 ? 0 : delta > 0 ? -150 : 150;
  if (decision) return <section className="card-surface adaptive-goal-card compact"><Check size={18} /><span><strong>{decision === "accepted" ? "Det nya kostmålet är sparat" : "Nuvarande kostmål behålls"}</strong><small>{decision === "accepted" ? `${state.nutrition.calorieTarget} kcal per dag gäller nu.` : "Förslaget kommer tillbaka nästa gång Framsteg öppnas."}</small></span><button type="button" onClick={() => setDecision(null)}>Visa analys</button></section>;
  return (
    <section className="card-surface adaptive-goal-card">
      <div className="section-heading"><div><span>ADAPTIVT KOSTMÅL</span><h3>{observed === null ? "Mer data behövs" : adjustment ? "Ett litet förslag" : "Du ligger i rätt riktning"}</h3></div><Gauge size={20} /></div>
      <p>{observed === null ? "Logga vikt minst två gånger så jämför Joxo din faktiska trend med måltempot." : adjustment ? `Din trend är ${formatNumber(observed)} kg/vecka mot önskat ${formatNumber(desired)}. Ett försiktigt nästa steg är ${state.nutrition.calorieTarget + adjustment} kcal per dag.` : "Vikttrenden ligger nära önskad takt. Ingen automatisk ändring behövs."}</p>
      {adjustment !== 0 && observed !== null ? <div className="adaptive-goal-actions"><button type="button" className="primary-action" onClick={() => { setState((current) => ({ ...current, nutrition: { ...current.nutrition, calorieTarget: current.nutrition.calorieTarget + adjustment } })); setDecision("accepted"); }}><Check size={16} /> Godkänn {adjustment > 0 ? "+" : ""}{adjustment} kcal</button><button type="button" onClick={() => setDecision("kept")}>Behåll nuvarande</button></div> : null}
    </section>
  );
}

function ProgressPhotoCard({ photos, ownerToken, todayKey, onChange }: { photos: ProgressPhoto[]; ownerToken: string; todayKey: string; onChange: (photos: ProgressPhoto[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(todayKey);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const sorted = photos.slice().sort((a, b) => b.date.localeCompare(a.date));
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const selectedA = sorted.find((photo) => photo.id === compareA) ?? sorted.at(-1);
  const selectedB = sorted.find((photo) => photo.id === compareB) ?? sorted[0];

  async function upload(file: File | undefined) {
    if (!file || !ownerToken || busy) return;
    setBusy(true); setMessage("");
    try {
      const image = await prepareFoodImage(file);
      const form = new FormData(); form.append("image", image, "progress.jpg"); form.append("kind", "progress");
      const response = await fetch("/api/nutrition/photo", { method: "POST", headers: { "x-joxo-owner": ownerToken }, body: form });
      const body = await response.json() as { key?: string; type?: string; error?: string };
      if (!response.ok || !body.key) throw new Error(body.error || "Bilden kunde inte sparas.");
      const next: ProgressPhoto = { id: crypto.randomUUID(), date, imageKey: body.key, imageType: body.type ?? "image/jpeg", note: note.trim() };
      onChange([next, ...photos].slice(0, 100)); setNote(""); setMessage("Framstegsbilden är sparad privat i profilen.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bilden kunde inte sparas."); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function remove(photo: ProgressPhoto) {
    if (!window.confirm(`Ta bort bilden från ${progressDateLabel(photo.date)}?`)) return;
    await fetch(`/api/nutrition/photo?key=${encodeURIComponent(photo.imageKey)}`, { method: "DELETE", headers: { "x-joxo-owner": ownerToken } }).catch(() => undefined);
    onChange(photos.filter((item) => item.id !== photo.id));
  }

  return (
    <section className="card-surface progress-photo-card">
      <div className="section-heading"><div><span>PRIVATA FRAMSTEGSBILDER</span><h3>Jämför över tid</h3></div><Images size={20} /></div>
      <div className="progress-photo-upload"><label><span>Datum</span><input type="date" max={todayKey} value={date} onChange={(event) => setDate(event.target.value)} /></label><label><span>Anteckning</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Till exempel morgon, avslappnad" /></label><button className="secondary-action" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <LoaderCircle className="spin" size={17} /> : <Camera size={17} />} {busy ? "Sparar …" : "Lägg till bild"}</button><input className="visually-hidden" ref={inputRef} type="file" accept="image/*" capture="user" onChange={(event) => void upload(event.target.files?.[0])} /></div>
      {message && <p className="progress-photo-message">{message}</p>}
      {sorted.length >= 2 && selectedA && selectedB ? <div className="progress-photo-compare"><div><Image src={`/api/nutrition/photo?key=${encodeURIComponent(selectedA.imageKey)}`} alt={`Framstegsbild ${selectedA.date}`} fill sizes="50vw" unoptimized /><span>{progressDateLabel(selectedA.date)}</span></div><div><Image src={`/api/nutrition/photo?key=${encodeURIComponent(selectedB.imageKey)}`} alt={`Framstegsbild ${selectedB.date}`} fill sizes="50vw" unoptimized /><span>{progressDateLabel(selectedB.date)}</span></div></div> : null}
      {sorted.length >= 2 ? <div className="progress-photo-selects"><select value={selectedA?.id ?? ""} onChange={(event) => setCompareA(event.target.value)}>{sorted.map((photo) => <option value={photo.id} key={`a-${photo.id}`}>A · {progressDateLabel(photo.date)}</option>)}</select><select value={selectedB?.id ?? ""} onChange={(event) => setCompareB(event.target.value)}>{sorted.map((photo) => <option value={photo.id} key={`b-${photo.id}`}>B · {progressDateLabel(photo.date)}</option>)}</select></div> : null}
      {sorted.length ? <div className="progress-photo-gallery">{sorted.map((photo) => <article key={photo.id}><div><Image src={`/api/nutrition/photo?key=${encodeURIComponent(photo.imageKey)}`} alt={`Framstegsbild ${photo.date}`} fill sizes="120px" unoptimized /></div><span><strong>{progressDateLabel(photo.date)}</strong><small>{photo.note || "Ingen anteckning"}</small></span><button type="button" onClick={() => void remove(photo)} aria-label={`Ta bort bilden från ${photo.date}`}><Trash2 size={14} /></button></article>)}</div> : <div className="chart-empty compact"><Camera size={26} /><p>Din första bild hamnar här. Bilderna hör bara till den aktiva profilen.</p></div>}
    </section>
  );
}

function ProgressView({
  state,
  setState,
  program,
  foodEntries,
  todayKey,
  ownerToken,
}: {
  state: PersistedState;
  setState: React.Dispatch<React.SetStateAction<PersistedState>>;
  program: WorkoutDay[];
  foodEntries: FoodEntry[];
  todayKey: string;
  ownerToken: string;
}) {
  const totalVolume = state.history.reduce((sum, entry) => sum + entry.volume, 0);
  const maxVolume = Math.max(1, ...state.history.slice(0, 8).map((entry) => entry.volume));
  const muscleTargets = new Map<string, number>();
  program.forEach((day) => day.exercises.forEach((exercise) => muscleTargets.set(exercise.muscle, (muscleTargets.get(exercise.muscle) ?? 0) + exercise.sets)));
  const muscleSets = new Map<string, number>();
  const weekStart = shiftDate(todayKey, -6);
  state.history.filter((entry) => stockholmDateKey(entry.date) >= weekStart).forEach((entry) => entry.exercises?.forEach((exercise) => muscleSets.set(exercise.muscle, (muscleSets.get(exercise.muscle) ?? 0) + exercise.sets.length)));
  const maxMuscleSets = Math.max(1, ...muscleTargets.values());
  const [checkinDate, setCheckinDate] = useState(todayKey);
  function draftForDate(date: string) {
    const saved = state.dailyHealth.find((entry) => entry.date === date);
    const savedWeight = state.weightHistory.find((entry) => stockholmDateKey(entry.date) === date)?.weight;
    return {
      waterLiters: saved ? String(saved.waterMl / 1000).replace(".", ",") : date === todayKey && state.nutrition.waterMl ? String(state.nutrition.waterMl / 1000).replace(".", ",") : "",
      steps: saved?.steps !== undefined ? String(saved.steps) : "",
      weightKg: saved?.weightKg ? String(saved.weightKg).replace(".", ",") : savedWeight ? String(savedWeight).replace(".", ",") : "",
      bodyFatKg: saved?.bodyFatKg ? String(saved.bodyFatKg).replace(".", ",") : "",
      muscleMassKg: saved?.muscleMassKg ? String(saved.muscleMassKg).replace(".", ",") : "",
      creatineTaken: saved?.creatineTaken ?? false,
      vitaminsTaken: saved?.vitaminsTaken ?? false,
      note: saved?.note ?? "",
    };
  }
  const [healthDraft, setHealthDraft] = useState(() => draftForDate(todayKey));
  const [savedDate, setSavedDate] = useState("");

  const { nutritionByDate, workoutsByDate, activitiesByDate, weightByDate, healthByDate, overviewDates } = useMemo(() => {
    const nutritionDays = new Map<string, { calories: number; protein: number; entries: number }>();
    foodEntries.forEach((entry) => {
      const date = entryDate(entry, todayKey);
      const current = nutritionDays.get(date) ?? { calories: 0, protein: 0, entries: 0 };
      nutritionDays.set(date, { calories: current.calories + entry.calories, protein: current.protein + entry.protein, entries: current.entries + 1 });
    });
    const workoutDays = new Map<string, HistoryEntry[]>();
    state.history.forEach((entry) => {
      const date = stockholmDateKey(entry.date);
      workoutDays.set(date, [...(workoutDays.get(date) ?? []), entry]);
    });
    const activityDays = new Map<string, OtherActivityEntry[]>();
    state.otherActivities.forEach((entry) => {
      const date = stockholmDateKey(entry.date);
      activityDays.set(date, [...(activityDays.get(date) ?? []), entry]);
    });
    const weightDays = new Map<string, number>();
    state.weightHistory.forEach((entry) => {
      const date = stockholmDateKey(entry.date);
      if (!weightDays.has(date)) weightDays.set(date, entry.weight);
    });
    const healthDays = new Map(state.dailyHealth.map((entry) => [entry.date, entry]));
    const dates = [...new Set([...workoutDays.keys(), ...activityDays.keys(), ...nutritionDays.keys(), ...weightDays.keys(), ...healthDays.keys()])].sort((a, b) => b.localeCompare(a));
    return { nutritionByDate: nutritionDays, workoutsByDate: workoutDays, activitiesByDate: activityDays, weightByDate: weightDays, healthByDate: healthDays, overviewDates: dates };
  }, [foodEntries, state.dailyHealth, state.history, state.otherActivities, state.weightHistory, todayKey]);

  function parseDraftNumber(value: string) {
    if (!value.trim()) return undefined;
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 10) / 10 : undefined;
  }

  function saveHealthEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const weightKg = parseDraftNumber(healthDraft.weightKg);
    const next: DailyHealthEntry = {
      date: checkinDate,
      waterMl: Math.round((parseDraftNumber(healthDraft.waterLiters) ?? 0) * 1000),
      steps: parseDraftNumber(healthDraft.steps),
      stepsSource: parseDraftNumber(healthDraft.steps) !== undefined ? "Manuell" : undefined,
      weightKg,
      bodyFatKg: parseDraftNumber(healthDraft.bodyFatKg),
      muscleMassKg: parseDraftNumber(healthDraft.muscleMassKg),
      creatineTaken: healthDraft.creatineTaken,
      vitaminsTaken: healthDraft.vitaminsTaken,
      note: healthDraft.note.trim() || undefined,
    };
    setState((current) => ({
      ...current,
      profile: weightKg && checkinDate === todayKey ? { ...current.profile, weightKg } : current.profile,
      nutrition: checkinDate === todayKey ? { ...current.nutrition, waterMl: next.waterMl, waterDate: todayKey } : current.nutrition,
      weightHistory: weightKg
        ? [{ date: `${checkinDate}T12:00:00.000Z`, weight: weightKg }, ...current.weightHistory.filter((entry) => stockholmDateKey(entry.date) !== checkinDate)].slice(0, 1000)
        : current.weightHistory,
      dailyHealth: upsertDailyHealth(current.dailyHealth, next),
    }));
    setSavedDate(checkinDate);
  }

  const latestBody = state.dailyHealth.find((entry) => entry.weightKg || entry.bodyFatKg || entry.muscleMassKg);

  return (
    <>
      <PageIntro eyebrow="DIN UTVECKLING" title="Framsteg & historik" description="Alla träningsdagar, kroppsmått, kost, vätska och rutiner på samma ställe." />
      <section className="metric-grid">
        <MetricCard icon={Dumbbell} label="Genomförda pass" value={String(state.history.length)} note="totalt loggade" />
        <MetricCard icon={Activity} label="Total volym" value={`${formatNumber(totalVolume / 1000)} t`} note="loggad träningsvolym" />
        <MetricCard icon={Scale} label="Kroppsvikt" value={`${formatNumber(latestBody?.weightKg ?? state.profile.weightKg)} kg`} note="senast registrerad" />
        <MetricCard icon={CalendarDays} label="Dagar med data" value={String(overviewDates.length)} note="i din samlade historik" />
      </section>

      <WeeklyCoachReport state={state} foodEntries={foodEntries} todayKey={todayKey} />

      <div className="progress-insight-grid">
        <WeightGoalCard state={state} setState={setState} todayKey={todayKey} />
        <ExerciseProgressCard state={state} program={program} />
      </div>

      <AdaptiveNutritionCard state={state} setState={setState} />

      <section className="card-surface daily-checkin-card">
        <div className="section-heading"><div><span>DAGLIG UPPFÖLJNING</span><h3>Logga hela dagen</h3></div><CalendarDays size={20} /></div>
        <p className="progress-section-intro">Komplettera kostloggen med vätska, kroppsmått och rutiner. Du kan även fylla i tidigare datum.</p>
        <form className="daily-checkin-form" onSubmit={saveHealthEntry}>
          <label className="daily-checkin-date"><span>Datum</span><input type="date" max={todayKey} value={checkinDate} onChange={(event) => { const date = event.target.value; setCheckinDate(date); setHealthDraft(draftForDate(date)); setSavedDate(""); }} /></label>
          <div className="daily-checkin-grid">
            <label><span>Vätska</span><div className="input-unit"><input inputMode="decimal" placeholder="2,5" value={healthDraft.waterLiters} onChange={(event) => setHealthDraft((current) => ({ ...current, waterLiters: event.target.value }))} /><i>liter</i></div></label>
            <label><span>Steg</span><div className="input-unit"><input inputMode="numeric" placeholder="10 000" value={healthDraft.steps} onChange={(event) => setHealthDraft((current) => ({ ...current, steps: event.target.value }))} /><i>steg</i></div></label>
            <label><span>Vikt</span><div className="input-unit"><input inputMode="decimal" placeholder="105" value={healthDraft.weightKg} onChange={(event) => setHealthDraft((current) => ({ ...current, weightKg: event.target.value }))} /><i>kg</i></div></label>
            <label><span>Fettmassa</span><div className="input-unit"><input inputMode="decimal" placeholder="–" value={healthDraft.bodyFatKg} onChange={(event) => setHealthDraft((current) => ({ ...current, bodyFatKg: event.target.value }))} /><i>kg</i></div></label>
            <label><span>Muskelmassa</span><div className="input-unit"><input inputMode="decimal" placeholder="–" value={healthDraft.muscleMassKg} onChange={(event) => setHealthDraft((current) => ({ ...current, muscleMassKg: event.target.value }))} /><i>kg</i></div></label>
          </div>
          <div className="supplement-switches" role="group" aria-label="Dagens kosttillskott">
            <button type="button" aria-pressed={healthDraft.creatineTaken} className={healthDraft.creatineTaken ? "active" : ""} onClick={() => setHealthDraft((current) => ({ ...current, creatineTaken: !current.creatineTaken }))}><Zap size={17} /><span><strong>Kreatin</strong><small>{healthDraft.creatineTaken ? "Taget" : "Inte markerat"}</small></span><Check size={16} /></button>
            <button type="button" aria-pressed={healthDraft.vitaminsTaken} className={healthDraft.vitaminsTaken ? "active" : ""} onClick={() => setHealthDraft((current) => ({ ...current, vitaminsTaken: !current.vitaminsTaken }))}><Sparkles size={17} /><span><strong>Vitaminer</strong><small>{healthDraft.vitaminsTaken ? "Taget" : "Inte markerat"}</small></span><Check size={16} /></button>
          </div>
          <label className="daily-note"><span>Anteckning</span><textarea placeholder="Sömn, energi, känsla eller något annat du vill minnas" value={healthDraft.note} onChange={(event) => setHealthDraft((current) => ({ ...current, note: event.target.value }))} /></label>
          <button className="primary-action" type="submit"><Check size={18} /> {savedDate === checkinDate ? "Dagen är sparad" : "Spara dagens uppföljning"}</button>
        </form>
      </section>

      <section className="card-surface workout-history-card">
        <div className="section-heading"><div><span>ALLA TRÄNINGSDAGAR</span><h3>Pass för pass</h3></div><Dumbbell size={20} /></div>
        <p className="progress-section-intro">Öppna ett pass för att se övningar, vikter och reps. Äldre pass visar den sammanfattning som redan fanns sparad.</p>
        {state.history.length ? (
          <div className="workout-history-list">
            {state.history.map((entry) => (
              <details className="workout-history-item" key={entry.id}>
                <summary>
                  <span className="workout-history-date"><small>{progressDateLabel(stockholmDateKey(entry.date))}</small><strong>{entry.name}</strong></span>
                  <span className="workout-history-numbers"><b>{formatNumber(entry.volume / 1000)} t</b><small>{entry.completedSets} set · {entry.duration} min</small></span>
                  <ChevronDown size={17} />
                </summary>
                {entry.exercises?.length ? (
                  <div className="workout-exercise-history">
                    {entry.exercises.map((exercise) => (
                      <div key={exercise.id}>
                        <span><strong>{exercise.name}</strong><small>{exercise.muscle} · {formatNumber(exercise.volume)} kg</small></span>
                        <p>{exercise.sets.map((set) => `${set.weight === null ? "Kroppsvikt" : `${formatNumber(set.weight)} kg`} × ${set.reps} · RPE ${formatNumber(set.rpe)}`).join("  |  ")}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="legacy-workout-note">Detaljerade övningar sparas från och med den här versionen. Datum, tid, set och total volym finns kvar för äldre pass.</p>}
              </details>
            ))}
          </div>
        ) : <div className="chart-empty"><Dumbbell size={34} /><strong>Ditt första pass visas här</strong><p>Avsluta ett träningspass så sparas datum, volym, övningar, vikter och reps.</p></div>}
      </section>

      <section className="card-surface daily-overview-card">
        <div className="section-heading"><div><span>ALLT DAG FÖR DAG</span><h3>Samlad översikt</h3></div><BarChart3 size={20} /></div>
        <p className="progress-section-intro">Träning, kcal, protein, vatten, kroppsmått och kosttillskott samlat per datum.</p>
        {overviewDates.length ? (
          <div className="daily-overview-list">
            {overviewDates.map((date) => {
              const workouts = workoutsByDate.get(date) ?? [];
              const activities = activitiesByDate.get(date) ?? [];
              const nutrition = nutritionByDate.get(date);
              const health = healthByDate.get(date);
              const weight = health?.weightKg ?? weightByDate.get(date);
              const waterMl = health?.waterMl ?? (date === todayKey ? state.nutrition.waterMl : undefined);
              return (
                <article className="daily-overview-row" key={date}>
                  <div className="daily-overview-head"><span><small>{date === todayKey ? "IDAG" : "LOGGAD DAG"}</small><strong>{progressDateLabel(date)}</strong></span>{workouts.length > 0 && <b><Dumbbell size={13} /> {workouts.length} pass</b>}</div>
                  <div className="daily-overview-stats">
                    <span><small>TRÄNING</small><strong>{workouts.length ? `${formatNumber(workouts.reduce((sum, item) => sum + item.volume, 0) / 1000)} t` : "–"}</strong></span>
                    <span><small>KALORIER</small><strong>{nutrition ? `${formatNumber(nutrition.calories)} kcal` : "–"}</strong></span>
                    <span><small>PROTEIN</small><strong>{nutrition ? `${formatNumber(nutrition.protein)} g` : "–"}</strong></span>
                    <span><small>VÄTSKA</small><strong>{waterMl !== undefined ? `${formatNumber(waterMl / 1000)} l` : "–"}</strong></span>
                    <span><small>STEG</small><strong>{health?.steps !== undefined ? new Intl.NumberFormat("sv-SE").format(health.steps) : "–"}</strong></span>
                    <span><small>ANNAN TRÄNING</small><strong>{activities.length ? `${activities.reduce((sum, item) => sum + item.durationMinutes, 0)} min` : "–"}</strong></span>
                    <span><small>VIKT</small><strong>{weight !== undefined ? `${formatNumber(weight)} kg` : "–"}</strong></span>
                    <span><small>FETTMASSA</small><strong>{health?.bodyFatKg !== undefined ? `${formatNumber(health.bodyFatKg)} kg` : "–"}</strong></span>
                    <span><small>MUSKELMASSA</small><strong>{health?.muscleMassKg !== undefined ? `${formatNumber(health.muscleMassKg)} kg` : "–"}</strong></span>
                  </div>
                  <div className="daily-routine-row">
                    <span className={health?.creatineTaken ? "done" : ""}><Zap size={13} /> Kreatin {health ? health.creatineTaken ? "taget" : "ej taget" : "–"}</span>
                    <span className={health?.vitaminsTaken ? "done" : ""}><Sparkles size={13} /> Vitaminer {health ? health.vitaminsTaken ? "tagna" : "ej tagna" : "–"}</span>
                  </div>
                  {health?.note && <p className="daily-overview-note">{health.note}</p>}
                </article>
              );
            })}
          </div>
        ) : <div className="chart-empty"><CalendarDays size={34} /><strong>Historiken börjar med första loggen</strong><p>Träning, mat eller en daglig uppföljning räcker för att skapa en dag.</p></div>}
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
          <div className="chart-empty"><BarChart3 size={34} /><strong>Din första kurva börjar efter nästa pass</strong><p>Avsluta ett pass så byggs volymkurvan automatiskt.</p></div>
        )}
      </section>

      <section className="card-surface muscle-card">
        <div className="section-heading"><div><span>FAKTISK BELASTNING · 7 DAGAR</span><h3>Set per muskelgrupp</h3></div><Target size={20} /></div>
        <p className="progress-section-intro">Färgen bygger på genomförda set, inte bara schemat. Målet jämförs med en hel programrunda.</p>
        <div className="muscle-list">
          {[...muscleTargets.entries()].sort((a, b) => b[1] - a[1]).map(([muscle, target]) => {
            const sets = muscleSets.get(muscle) ?? 0;
            const ratio = sets / Math.max(1, target);
            const status = ratio < 0.5 ? "low" : ratio <= 1.35 ? "balanced" : "high";
            return (
              <div key={muscle} className={status}><span>{muscle}<small>{status === "low" ? "Låg" : status === "balanced" ? "Lagom" : "Hög"}</small></span><i><b style={{ width: `${Math.min(100, (sets / maxMuscleSets) * 100)}%` }} /></i><strong>{sets}/{target}</strong></div>
            );
          })}
        </div>
      </section>

      <ProgressPhotoCard photos={state.progressPhotos} ownerToken={ownerToken} todayKey={todayKey} onChange={(progressPhotos) => setState((current) => ({ ...current, progressPhotos }))} />
    </>
  );
}

function MetricCard({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return <article className="metric-card"><span><Icon size={19} /></span><small>{label}</small><strong>{value}</strong><p>{note}</p></article>;
}

function ProfileView({
  state,
  setState,
  ownerToken,
  foodEntries,
  saveStatus,
  lastSyncedAt,
  hasPassword,
  onSetPassword,
  onRemovePassword,
  onLogout,
  onRestoreBackup,
}: {
  state: PersistedState;
  setState: React.Dispatch<React.SetStateAction<PersistedState>>;
  ownerToken: string;
  foodEntries: FoodEntry[];
  saveStatus: "loading" | "saved" | "offline" | "saving";
  lastSyncedAt: string | null;
  hasPassword: boolean;
  onSetPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onRemovePassword: (currentPassword: string) => Promise<void>;
  onLogout: () => void;
  onRestoreBackup: (payload: BackupPayload) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backupPreview, setBackupPreview] = useState<BackupPayload | null>(null);
  const [backupMessage, setBackupMessage] = useState("");
  const backupInput = useRef<HTMLInputElement>(null);
  const bmi = bmiValue(state.profile.weightKg, state.profile.heightCm);
  const updateProfile = (key: keyof PersistedState["profile"], value: string | number) => setState((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
  const addWeight = () => setState((current) => ({ ...current, weightHistory: [{ date: new Date().toISOString(), weight: current.profile.weightKg }, ...current.weightHistory].slice(0, 100) }));

  function downloadFile(name: string, contents: string, type: string) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportBackup() {
    const exportedAt = new Date().toISOString();
    const payload: BackupPayload = { format: "joxo-backup-v1", exportedAt, state, foodEntries };
    downloadFile(`joxo-backup-${stockholmDateKey(exportedAt)}.json`, JSON.stringify(payload, null, 2), "application/json");
    setState((current) => ({ ...current, lastManualBackupAt: exportedAt }));
    setBackupMessage("Fullständig säkerhetskopia hämtad.");
  }

  function exportCsv() {
    const escape = (value: string | number | boolean | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows: Array<Array<string | number | boolean | undefined>> = [["typ", "datum", "namn", "kalorier", "protein_g", "volym_kg", "set", "minuter", "vikt_kg", "vatten_ml", "kreatin", "vitaminer"]];
    state.history.forEach((entry) => rows.push(["träning", stockholmDateKey(entry.date), entry.name, "", "", entry.volume, entry.completedSets, entry.duration, "", "", "", ""]));
    foodEntries.forEach((entry) => rows.push(["mat", entryDate(entry, stockholmDateKey(new Date())), entry.name, entry.calories, entry.protein, "", "", "", "", "", "", ""]));
    state.dailyHealth.forEach((entry) => rows.push(["hälsa", entry.date, entry.note, "", "", "", "", "", entry.weightKg, entry.waterMl, entry.creatineTaken, entry.vitaminsTaken]));
    downloadFile(`joxo-data-${stockholmDateKey(new Date())}.csv`, `\uFEFF${rows.map((row) => row.map(escape).join(";")).join("\n")}`, "text/csv;charset=utf-8");
    setBackupMessage("CSV-exporten är hämtad.");
  }

  async function readBackup(file: File | undefined) {
    if (!file) return;
    setBackupMessage(""); setBackupPreview(null);
    try {
      const parsed = JSON.parse(await file.text()) as BackupPayload;
      if (parsed.format !== "joxo-backup-v1" || !parsed.state || typeof parsed.state !== "object" || !Array.isArray(parsed.foodEntries) || !Number.isFinite(Date.parse(parsed.exportedAt))) throw new Error("Ogiltigt backupformat.");
      if (parsed.state.history !== undefined && !Array.isArray(parsed.state.history)) throw new Error("Backuppens träningshistorik är skadad.");
      if (parsed.state.dailyHealth !== undefined && !Array.isArray(parsed.state.dailyHealth)) throw new Error("Backuppens hälsologg är skadad.");
      setBackupPreview(parsed);
    } catch (error) { setBackupMessage(error instanceof Error ? error.message : "Filen kunde inte läsas."); }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) { setBackupMessage("Den här webbläsaren stöder inte webbnotiser."); return; }
    const permission = await Notification.requestPermission();
    setState((current) => ({ ...current, reminders: { ...current.reminders, nativeEnabled: permission === "granted" } }));
    setBackupMessage(permission === "granted" ? "Mobilnotiser är aktiverade." : "Notiser tilläts inte i webbläsaren.");
  }

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    if (newPassword !== confirmPassword) {
      setProfileError("De nya lösenorden matchar inte.");
      return;
    }
    setPasswordBusy(true);
    try {
      await onSetPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfileSuccess(hasPassword ? "Lösenordet är ändrat." : "Profilen är nu lösenordsskyddad.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Lösenordet kunde inte sparas.");
    } finally {
      setPasswordBusy(false);
    }
  };

  const removePassword = async () => {
    setProfileError("");
    setProfileSuccess("");
    setPasswordBusy(true);
    try {
      await onRemovePassword(currentPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfileSuccess("Lösenordsskyddet är borttaget.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Lösenordet kunde inte tas bort.");
    } finally {
      setPasswordBusy(false);
    }
  };

  const copyProfileCode = async () => {
    if (!ownerToken) return;
    try {
      await navigator.clipboard.writeText(ownerToken);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setProfileError("Kunde inte kopiera automatiskt. Håll inne på koden och kopiera den manuellt.");
    }
  };

  return (
    <>
      <PageIntro eyebrow="PERSONLIGT UPPLÄGG" title="Profil & inställningar" description="Målen styr coachningen, men du bestämmer alltid." />
      <section className="profile-hero">
        <span className="large-avatar">{profileInitials(state.profile.name)}</span>
        <div><small>TRÄNAR 4× / VECKA</small><h2>{state.profile.name}</h2><p>{state.profile.goal}</p></div>
        <span className="profile-badge"><BadgeCheckIcon /> Aktiv</span>
      </section>

      <section className="settings-card bmi-card">
        <div className="bmi-score"><small>BMI</small><strong>{bmi === null ? "–" : formatNumber(bmi)}</strong><span>{bmi === null ? "Fyll i längd och vikt" : bmiLabel(bmi)}</span></div>
        <div><div className="section-heading"><div><span>KROPPSMÅTT</span><h3>Vikt i relation till längd</h3></div><Scale size={20} /></div><p>BMI är ett enkelt screeningmått för vuxna. Det skiljer inte mellan muskler och fett, så följ även midjemått, kroppssammansättning, prestation och hur du mår.</p></div>
      </section>

      <section className="settings-card profile-security-card">
        <div className="section-heading"><div><span>SÄKERHET</span><h3>{hasPassword ? "Lösenordsskyddad profil" : "Skydda din profil"}</h3></div><Lock size={20} /></div>
        <p className="profile-manager-intro">{hasPassword ? "Lösenord krävs nästa gång någon väljer din profil." : "Lägg till ett lösenord så att bara du kan öppna dina loggar och framsteg."}</p>
        <form className="profile-password-form" onSubmit={(event) => void savePassword(event)}>
          {hasPassword && <label><span>Nuvarande lösenord</span><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></label>}
          <div className="profile-password-grid">
            <label><span>{hasPassword ? "Nytt lösenord" : "Lösenord"}</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="Minst 4 tecken" /></label>
            <label><span>Upprepa lösenord</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></label>
          </div>
          {profileError && <p className="profile-error"><CircleAlert size={15} />{profileError}</p>}
          {profileSuccess && <p className="profile-success"><Check size={15} />{profileSuccess}</p>}
          <div className="profile-password-actions">
            <button className="secondary-action" type="submit" disabled={passwordBusy}>{passwordBusy ? <LoaderCircle className="spin" size={17} /> : <Lock size={17} />} {hasPassword ? "Ändra lösenord" : "Sätt lösenord"}</button>
            {hasPassword && <button className="danger-text-action" type="button" onClick={() => void removePassword()} disabled={passwordBusy}>Ta bort lösenord</button>}
          </div>
        </form>

        <details className="profile-recovery own-profile-recovery">
          <summary><KeyRound size={17} /><span><strong>Din profilkod</strong><small>För att återställa profilen på en annan enhet</small></span><ChevronDown size={17} /></summary>
          <div className="profile-recovery-body">
            <label><span>Privat profilkod</span><div className="profile-code-field"><input value={ownerToken} readOnly aria-label="Din profilkod" /><button type="button" onClick={() => void copyProfileCode()} disabled={!ownerToken}><Copy size={16} /> {copied ? "Kopierad" : "Kopiera"}</button></div></label>
            <p><ShieldAlert size={15} /> Dela bara koden med en enhet du själv kontrollerar.</p>
          </div>
        </details>
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
          <label className="wide"><span>Huvudmål</span><select value={state.profile.goal} onChange={(event) => updateProfile("goal", event.target.value)}><option>Starkare och mer muskler</option><option>Bygga muskler</option><option>Minska fett och behålla muskler</option><option>Må bättre och bli mer aktiv</option></select></label>
        </div>
        <button className="secondary-action" type="button" onClick={addWeight}><Scale size={17} /> Spara dagens vikt</button>
      </section>

      <section className="settings-card">
        <div className="section-heading"><div><span>TRÄNINGSUPPLÄGG</span><h3>Dina förutsättningar</h3></div><Dumbbell size={20} /></div>
        <div className="form-grid">
          <label><span>Träningsvana</span><select value={state.profile.experienceLevel} onChange={(event) => updateProfile("experienceLevel", event.target.value)}><option value="new">Nybörjare</option><option value="some">Tränat ett tag</option><option value="experienced">Erfaren</option></select></label>
          <label><span>Pass per vecka</span><div className="input-unit"><input type="number" min="1" max="7" value={state.profile.weeklyGoal} onChange={(event) => updateProfile("weeklyGoal", Number(event.target.value))} /><i>pass</i></div></label>
          <label><span>Passlängd</span><div className="input-unit"><input type="number" step="15" value={state.profile.sessionMinutes} onChange={(event) => updateProfile("sessionMinutes", Number(event.target.value))} /><i>min</i></div></label>
          <label><span>Träningsplats</span><select value={state.profile.trainingLocation} onChange={(event) => updateProfile("trainingLocation", event.target.value)}><option value="gym">Gym</option><option value="home">Hemma</option><option value="mixed">Blandat</option></select></label>
          <label className="wide"><span>Aktivitet utanför gymmet</span><select value={state.profile.activityLevel} onChange={(event) => updateProfile("activityLevel", event.target.value)}><option value="low">Låg</option><option value="medium">Medel</option><option value="high">Hög</option></select></label>
          <label className="wide"><span>Prioriterade områden</span><textarea value={state.profile.focusAreas} onChange={(event) => updateProfile("focusAreas", event.target.value)} placeholder="Vad vill du utveckla mest?" /></label>
          <label className="wide"><span>Begränsningar att ta hänsyn till</span><textarea value={state.profile.limitations} onChange={(event) => updateProfile("limitations", event.target.value)} placeholder="Frivilligt – till exempel känsligt knä eller axel" /></label>
        </div>
        <p className="fine-print">Uppgifterna används för att anpassa kommande träningsförslag. Vid skarp eller ihållande smärta bör du avstå från övningen och ta hjälp av legitimerad vårdpersonal.</p>
      </section>

      <section className="settings-card">
        <div className="section-heading"><div><span>KOSTMÅL</span><h3>Dagliga startmål</h3></div><Utensils size={20} /></div>
        <div className="form-grid two">
          <label><span>Kalorier</span><div className="input-unit"><input type="number" value={state.nutrition.calorieTarget} onChange={(event) => setState((current) => ({ ...current, nutrition: { ...current.nutrition, calorieTarget: Number(event.target.value) } }))} /><i>kcal</i></div></label>
          <label><span>Protein</span><div className="input-unit"><input type="number" value={state.nutrition.proteinTarget} onChange={(event) => setState((current) => ({ ...current, nutrition: { ...current.nutrition, proteinTarget: Number(event.target.value) } }))} /><i>g</i></div></label>
        </div>
        <p className="fine-print">Startmål är uppskattningar, inte medicinska råd. Justera efter vikttrend, prestation, hunger och hur livet faktiskt fungerar.</p>
      </section>

      <section className="settings-card reminder-settings-card">
        <div className="section-heading"><div><span>PERSONLIGA PÅMINNELSER</span><h3>Det du vill komma ihåg</h3></div><Bell size={20} /></div>
        <div className="reminder-toggle-grid">
          {([['workout', 'Träning', Dumbbell], ['protein', 'Proteinmål', Apple], ['creatine', 'Kreatin', Zap], ['vitamins', 'Vitaminer', Sparkles]] as const).map(([key, label, Icon]) => <button type="button" key={key} className={state.reminders[key] ? "active" : ""} aria-pressed={state.reminders[key]} onClick={() => setState((current) => ({ ...current, reminders: { ...current.reminders, [key]: !current.reminders[key] } }))}><Icon size={17} /><span><strong>{label}</strong><small>{state.reminders[key] ? "På" : "Av"}</small></span><Check size={15} /></button>)}
        </div>
        <label className="reminder-time"><span>Daglig kontrolltid</span><input type="time" value={state.reminders.dailyTime} onChange={(event) => setState((current) => ({ ...current, reminders: { ...current.reminders, dailyTime: event.target.value } }))} /></label>
        <button className="secondary-action" type="button" onClick={() => void enableNotifications()}><Bell size={17} /> {state.reminders.nativeEnabled ? "Mobilnotiser aktiverade" : "Aktivera mobilnotiser"}</button>
        <p className="fine-print">Webbappen kontrollerar påminnelser när den är öppen efter vald tid. Helt fristående pushnotiser kräver en framtida push-tjänst.</p>
      </section>

      <section className="settings-card data-center-card">
        <div className="section-heading"><div><span>DATACENTER</span><h3>Kontroll över dina loggar</h3></div><Archive size={20} /></div>
        <div className="data-status-row"><span className={saveStatus === "offline" ? "offline" : "online"}>{saveStatus === "offline" ? <CloudOff size={16} /> : <Cloud size={16} />}<strong>{saveStatus === "offline" ? "Sparad på enheten" : "Molnkopplad"}</strong><small>{lastSyncedAt ? `Senast synkad ${new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" }).format(new Date(lastSyncedAt))}` : "Inväntar första synkning"}</small></span><span><strong>{state.history.length}</strong><small>pass</small></span><span><strong>{foodEntries.length}</strong><small>matloggar</small></span><span><strong>{state.progressPhotos.length}</strong><small>bilder</small></span></div>
        <div className="data-center-actions"><button type="button" className="secondary-action" onClick={exportBackup}><Download size={17} /> Full backup</button><button type="button" className="secondary-action" onClick={exportCsv}><Download size={17} /> CSV</button><button type="button" className="secondary-action" onClick={() => backupInput.current?.click()}><Upload size={17} /> Återställ</button><input ref={backupInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void readBackup(event.target.files?.[0])} /></div>
        {state.lastManualBackupAt && <p className="fine-print">Senaste manuella backup: {progressDateLabel(stockholmDateKey(state.lastManualBackupAt))}.</p>}
        {backupMessage && <p className="progress-photo-message">{backupMessage}</p>}
        {backupPreview && <div className="backup-preview"><span><strong>Säkerhetskopia från {progressDateLabel(stockholmDateKey(backupPreview.exportedAt))}</strong><small>{backupPreview.state.history?.length ?? 0} pass · {backupPreview.foodEntries.length} matloggar</small></span><button type="button" className="primary-action" onClick={() => { onRestoreBackup(backupPreview); setBackupPreview(null); setBackupMessage("Säkerhetskopian är återställd och sparas nu."); }}>Bekräfta återställning</button><button type="button" onClick={() => setBackupPreview(null)}>Avbryt</button></div>}
        <p className="fine-print"><ShieldAlert size={14} /> En full backup innehåller personliga hälso- och träningsdata. Förvara filen privat.</p>
      </section>

      <button className="profile-logout-action" type="button" onClick={onLogout}><LogOut size={18} /><span><strong>Logga ut</strong><small>Gå tillbaka till profilväljaren</small></span><ChevronRight size={18} /></button>
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
  const [quickTool, setQuickTool] = useState<"" | "barcode" | "recipe">("");
  const [barcode, setBarcode] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [importDetails, setImportDetails] = useState<{ barcode?: string; recipeUrl?: string }>({});
  const [listening, setListening] = useState(false);
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
  const favorites = useMemo(() => {
    const unique = new Map<string, FoodEntry>();
    entries.filter((entry) => entry.details?.favorite).forEach((entry) => { if (!unique.has(entry.name)) unique.set(entry.name, entry); });
    return [...unique.values()].slice(0, 12);
  }, [entries]);

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

  function startSpeechInput() {
    const scope = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
    if (!Recognition) { setError("Röstinmatning stöds inte i den här webbläsaren. Du kan fortfarande skriva eller klistra in maten."); return; }
    const recognition = new Recognition();
    recognition.lang = "sv-SE"; recognition.interimResults = false;
    recognition.onresult = (event) => { const transcript = event.results[0]?.[0]?.transcript ?? ""; setDescription(transcript); setEstimate(null); setMatchGroups([]); };
    recognition.onerror = () => setError("Jag kunde inte höra maten. Försök igen eller skriv den.");
    recognition.onend = () => setListening(false);
    setListening(true); setError(""); recognition.start();
  }

  async function lookupBarcode() {
    if (!/^\d{7,14}$/.test(barcode.trim())) { setError("Skriv 7–14 siffror från streckkoden."); return; }
    setStatus("analyzing"); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/nutrition/barcode?code=${encodeURIComponent(barcode.trim())}`);
      const body = await response.json() as { estimate?: NutritionEstimate; error?: string };
      if (!response.ok || !body.estimate) throw new Error(body.error || "Produkten hittades inte.");
      setEstimate(body.estimate); setEstimateEngine("food-database"); setDescription(body.estimate.title); setImportDetails({ barcode: barcode.trim() }); setQuickTool("");
    } catch (lookupError) { setError(lookupError instanceof Error ? lookupError.message : "Streckkoden kunde inte läsas."); }
    finally { setStatus("idle"); }
  }

  async function importRecipeUrl() {
    try { new URL(recipeUrl); } catch { setError("Klistra in en fullständig https-länk till receptet."); return; }
    setStatus("analyzing"); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/nutrition/recipe-import?url=${encodeURIComponent(recipeUrl)}`);
      const body = await response.json() as { estimate?: NutritionEstimate; error?: string };
      if (!response.ok || !body.estimate) throw new Error(body.error || "Receptet kunde inte läsas.");
      setEstimate(body.estimate); setEstimateEngine("saved-recipe"); setDescription(body.estimate.title); setImportDetails({ recipeUrl }); setQuickTool("");
    } catch (importError) { setError(importError instanceof Error ? importError.message : "Receptet kunde inte importeras."); }
    finally { setStatus("idle"); }
  }

  async function quickLog(entry: FoodEntry) {
    const loggedAt = selectedDate === todayKey ? new Date().toISOString() : `${selectedDate}T12:00:00.000Z`;
    await onSave({ ...entry, id: crypto.randomUUID(), loggedAt, imageKey: null, imageType: null, details: { ...entry.details, favorite: true } });
    setSuccess(`${entry.name} loggades på ${nutritionDateLabel(selectedDate, todayKey).toLowerCase()}.`);
  }

  async function copyPreviousDay() {
    const sourceDate = shiftDate(selectedDate, -1);
    const sourceEntries = entries.filter((entry) => entryDate(entry, todayKey) === sourceDate);
    if (!sourceEntries.length) { setError("Det finns inga måltider att kopiera från föregående dag."); return; }
    setStatus("saving"); setError("");
    try {
      await Promise.all(sourceEntries.map((entry, index) => onSave({ ...entry, id: crypto.randomUUID(), loggedAt: `${selectedDate}T${String(12 + Math.floor(index / 60)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}:00.000Z`, imageKey: null, imageType: null })));
      setSuccess(`${sourceEntries.length} måltider kopierades från ${nutritionDateLabel(sourceDate, todayKey).toLowerCase()}.`);
    } catch (copyError) { setError(copyError instanceof Error ? copyError.message : "Dagen kunde inte kopieras."); }
    finally { setStatus("idle"); }
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
        details: { assumptions: estimate.assumptions, items: estimate.items, ...importDetails },
      }, imageBlob);
      setDescription("");
      setEstimate(null);
      setEstimateEngine("manual");
      setImportDetails({});
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
        <div className="nutrition-quick-tools">
          <button type="button" onClick={() => void copyPreviousDay()} disabled={status !== "idle"}><Copy size={16} /><span><strong>Kopiera gårdagen</strong><small>Alla måltider</small></span></button>
          <button type="button" className={quickTool === "barcode" ? "active" : ""} onClick={() => setQuickTool((current) => current === "barcode" ? "" : "barcode")}><ScanLine size={16} /><span><strong>Streckkod</strong><small>Open Food Facts</small></span></button>
          <button type="button" className={quickTool === "recipe" ? "active" : ""} onClick={() => setQuickTool((current) => current === "recipe" ? "" : "recipe")}><Link2 size={16} /><span><strong>Receptlänk</strong><small>Importera näring</small></span></button>
          <button type="button" className={listening ? "active" : ""} onClick={startSpeechInput}><Mic size={16} /><span><strong>{listening ? "Lyssnar …" : "Tala in"}</strong><small>Röst till text</small></span></button>
        </div>
        {quickTool === "barcode" && <div className="quick-import-panel"><label><span>Siffrorna under streckkoden</span><input inputMode="numeric" value={barcode} onChange={(event) => setBarcode(event.target.value.replace(/\D/g, ""))} placeholder="Till exempel 7310865004703" /></label><button type="button" className="primary-action" disabled={status !== "idle"} onClick={() => void lookupBarcode()}><ScanLine size={17} /> Hämta produkt</button><p>Du granskar alltid kcal och protein innan loggen sparas.</p></div>}
        {quickTool === "recipe" && <div className="quick-import-panel"><label><span>Länk till recept</span><input type="url" inputMode="url" value={recipeUrl} onChange={(event) => setRecipeUrl(event.target.value)} placeholder="https://…" /></label><button type="button" className="primary-action" disabled={status !== "idle"} onClick={() => void importRecipeUrl()}><Link2 size={17} /> Läs recept</button><p>Fungerar när receptsidan publicerar strukturerad recept- och näringsdata.</p></div>}
        {favorites.length > 0 && <div className="favorite-foods"><span><Star size={14} fill="currentColor" /> Favoriter</span><div>{favorites.map((entry) => <button type="button" key={entry.id} onClick={() => void quickLog(entry)}><strong>{entry.name}</strong><small>{entry.calories} kcal · {formatNumber(entry.protein)} g</small><Plus size={14} /></button>)}</div></div>}
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
            onChange={(event) => { setDescription(event.target.value); setEstimate(null); setMatchGroups([]); setEstimateEngine("manual"); setImportDetails({}); }}
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
                    <button className={`meal-favorite${entry.details?.favorite ? " active" : ""}`} type="button" onClick={() => void onSave({ ...entry, details: { ...entry.details, favorite: !entry.details?.favorite } })} aria-label={`${entry.details?.favorite ? "Ta bort" : "Lägg till"} ${entry.name} som favorit`}><Star size={15} fill={entry.details?.favorite ? "currentColor" : "none"} /></button>
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

function CoachSheet({ response, tip, video, onQuestion, onNextTip, onClose }: {
  response: string;
  tip: CoachTip;
  video: CoachVideo;
  onQuestion: (question: string) => void;
  onNextTip: () => void;
  onClose: () => void;
}) {
  const questions = [
    "Vad ska jag träna idag?",
    "Ge mig ett nytt tips",
    "Hur värmer jag upp?",
    "Bör jag höja vikten?",
    "Vad gör jag om tiden är knapp?",
    "Hur tränar jag vid träningsvärk?",
    "Hur håller jag motivationen?",
    "Hur mycket protein saknar jag?",
    "Har jag återhämtat mig?",
    "Vad gör jag om jag har ont?",
  ];
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet coach-sheet" role="dialog" aria-modal="true" aria-label="Joxo PT">
        <div className="sheet-handle" />
        <div className="sheet-head"><div><small>DIN PERSONLIGA COACH</small><h2>Joxo PT</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div>
        <div className="coach-inspiration">
          <Image src="/coach/joxo-motivation-v1.png" alt="En fokuserad styrketränande person framför en skivstång i ett mörkt gym" fill sizes="(max-width: 620px) 100vw, 588px" />
          <span><small>DAGENS MINDSET</small><strong>Du behöver inte vara redo.<br />Du behöver börja.</strong></span>
        </div>
        <div className="coach-daily-tip">
          <span><Lightbulb size={18} /></span>
          <div><small>{tip.category.toUpperCase()} · DAGENS TIPS</small><strong>{tip.title}</strong><p>{tip.body}</p></div>
          <button type="button" onClick={onNextTip} aria-label="Visa ett nytt tips"><RefreshCw size={17} /></button>
        </div>
        <div className="coach-message"><span><Brain size={22} /></span><p>{response || "Välj en fråga så använder jag din logg och dagsform för ett mer relevant svar."}</p></div>
        <div className="coach-section-title"><span>FRÅGA JOXO PT</span><small>{COACH_TIPS.length} råd i rotation</small></div>
        <div className="question-grid">{questions.map((question) => <button key={question} type="button" onClick={() => onQuestion(question)}>{question}<ChevronRight size={15} /></button>)}</div>
        <a className="coach-video-card" href={video.url} target="_blank" rel="noreferrer">
          <span><Play size={22} fill="currentColor" /></span>
          <div><small>INSPIRATION PÅ YOUTUBE · {video.channel.toUpperCase()}</small><strong>{video.title}</strong><p>{video.description}</p></div>
          <ExternalLink size={17} />
        </a>
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
