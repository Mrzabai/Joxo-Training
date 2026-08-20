"use client";

import Image from "next/image";
import {
  Activity,
  Apple,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Cloud,
  CloudOff,
  Dumbbell,
  ExternalLink,
  Flame,
  Gauge,
  HeartPulse,
  Home,
  Link2,
  LoaderCircle,
  Minus,
  Moon,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Utensils,
  Waves,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXERCISE_COUNT, PROGRAM, getExerciseAdvice, type Exercise, type WorkoutDay } from "./lib/program";

type TabId = "today" | "plan" | "workout" | "progress" | "profile";

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
};

type PersistedState = {
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
  notion: {
    configured: boolean;
    lastSync: string;
    importedExercises: number;
    message: string;
  };
};

type Summary = {
  name: string;
  duration: number;
  volume: number;
  sets: number;
};

const initialState: PersistedState = {
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
  notion: {
    configured: false,
    lastSync: "2026-08-17T15:15:00.000Z",
    importedExercises: EXERCISE_COUNT,
    message: "Ditt aktuella program är importerat",
  },
};

const navItems: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: "today", label: "Idag", icon: Home },
  { id: "plan", label: "Schema", icon: CalendarDays },
  { id: "workout", label: "Träna", icon: Dumbbell },
  { id: "progress", label: "Framsteg", icon: BarChart3 },
  { id: "profile", label: "Profil", icon: UserRound },
];

const weekdayLabels = ["M", "T", "O", "T", "F", "L", "S"];
const STORAGE_KEY = "joxo-training-offline-v1";

function mergeState(saved: Partial<PersistedState>): PersistedState {
  return {
    ...initialState,
    ...saved,
    readiness: { ...initialState.readiness, ...saved.readiness },
    nutrition: { ...initialState.nutrition, ...saved.nutrition },
    profile: { ...initialState.profile, ...saved.profile },
    notion: { ...initialState.notion, ...saved.notion },
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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" }).format(new Date(value));
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

export default function TrainingApp({ todayLabel, greeting, nowIso }: { todayLabel: string; greeting: string; nowIso: string }) {
  const [tab, setTab] = useState<TabId>("today");
  const [state, setState] = useState<PersistedState>(initialState);
  const [program, setProgram] = useState<WorkoutDay[]>(PROGRAM);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"loading" | "saved" | "offline" | "saving">("loading");
  const [openDay, setOpenDay] = useState<string>("lower-a");
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachResponse, setCoachResponse] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rest, setRest] = useState<{ remaining: number; total: number } | null>(null);
  const [notionLoading, setNotionLoading] = useState(false);
  const saveAbort = useRef<AbortController | null>(null);

  const nextPass = useMemo(
    () => program.find((day) => day.id === state.nextPassId) ?? program[0],
    [program, state.nextPassId],
  );
  const activePass = useMemo(
    () => program.find((day) => day.id === state.activePassId) ?? null,
    [program, state.activePassId],
  );
  const nutritionTotals = useMemo(() => totalNutrition(state.nutrition.entries), [state.nutrition.entries]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      let local: Partial<PersistedState> | null = null;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        local = raw ? (JSON.parse(raw) as Partial<PersistedState>) : null;
      } catch {
        local = null;
      }

      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        const body = (await response.json()) as { state?: Partial<PersistedState> | null };
        if (!cancelled) {
          setState(mergeState(body.state ?? local ?? {}));
          setSaveStatus(response.ok ? "saved" : "offline");
        }
      } catch {
        if (!cancelled) {
          setState(mergeState(local ?? {}));
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
  }, []);

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

  const syncNotion = useCallback(async (silent = false) => {
    if (!silent) setNotionLoading(true);
    try {
      const response = await fetch("/api/notion", { method: "POST" });
      const body = (await response.json()) as {
        syncedAt?: string;
        importedExercises?: number;
        exercises?: Array<{
          id: string;
          name: string;
          pass: string;
          muscle: string;
          order: number;
          sets: number;
          minReps: number;
          maxReps: number;
          weight: number | null;
          startReps: number;
          technique: string;
          note: string;
          nextAdvice: string;
          notionUrl: string;
        }>;
        error?: string;
        setupRequired?: boolean;
      };

      if (response.ok && body.exercises) {
        setProgram((current) =>
          current.map((day) => ({
            ...day,
            exercises: day.exercises.map((exercise) => {
              const remote = body.exercises?.find(
                (item) => item.id === exercise.id || (item.name === exercise.name && item.pass.endsWith(day.name)),
              );
              return remote
                ? {
                    ...exercise,
                    ...remote,
                    restSeconds: exercise.restSeconds,
                    nextAdvice: remote.nextAdvice || exercise.nextAdvice,
                  }
                : exercise;
            }),
          })),
        );
      }

      setState((current) => ({
        ...current,
        notion: {
          configured: response.ok,
          lastSync: body.syncedAt ?? current.notion.lastSync,
          importedExercises: body.importedExercises ?? current.notion.importedExercises,
          message: response.ok
            ? "Synkad med Notion"
            : body.setupRequired
              ? "Programmet är importerat · automatisk synk behöver en Notion-nyckel"
              : body.error ?? "Synken misslyckades",
        },
      }));
    } catch {
      if (!silent) {
        setState((current) => ({
          ...current,
          notion: { ...current.notion, message: "Kunde inte nå Notion just nu" },
        }));
      }
    } finally {
      setNotionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    async function checkNotion() {
      try {
        const response = await fetch("/api/notion", { cache: "no-store" });
        const body = (await response.json()) as { configured?: boolean };
        if (cancelled) return;
        setState((current) => ({
          ...current,
          notion: { ...current.notion, configured: Boolean(body.configured) },
        }));
        const age = Date.now() - new Date(state.notion.lastSync).getTime();
        if (body.configured && age > 24 * 60 * 60 * 1000) void syncNotion(true);
      } catch {
        // Den importerade startkopian fortsätter fungera utan nätkontakt.
      }
    }
    void checkNotion();
    return () => {
      cancelled = true;
    };
  }, [hydrated, state.notion.lastSync, syncNotion]);

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
            onNutrition={() => setNutritionOpen(true)}
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
          />
        )}

        {tab === "progress" && <ProgressView state={state} program={program} />}

        {tab === "profile" && (
          <ProfileView
            state={state}
            setState={setState}
            notionLoading={notionLoading}
            onSync={() => void syncNotion(false)}
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

      {nutritionOpen && (
        <NutritionSheet
          nutrition={state.nutrition}
          onClose={() => setNutritionOpen(false)}
          onChange={(nutrition) => setState((current) => ({ ...current, nutrition }))}
        />
      )}

      {coachOpen && (
        <CoachSheet
          response={coachResponse}
          onQuestion={askCoach}
          onClose={() => setCoachOpen(false)}
        />
      )}

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

function PlanView({ program, openDay, setOpenDay, nextPassId, onStart }: { program: WorkoutDay[]; openDay: string; setOpenDay: (id: string) => void; nextPassId: string; onStart: (day: WorkoutDay) => void }) {
  return (
    <>
      <PageIntro eyebrow="NOTION-PROGRAM · 4 PASS" title="Ditt träningsschema" description="Fortsätt bara på nästa pass i ordningen när veckan förändras." />
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
                    <a key={exercise.id} className="plan-exercise" href={exercise.notionUrl} target="_blank" rel="noreferrer">
                      <span>{String(exercise.order).padStart(2, "0")}</span>
                      <span className="plan-exercise-thumb" aria-hidden="true">
                        <Image src={exercise.imageStart} alt="" width={96} height={96} sizes="52px" unoptimized />
                      </span>
                      <div className="plan-exercise-copy"><strong>{exercise.name}</strong><small>{exercise.muscle} · {exercise.sets} × {exercise.minReps}–{exercise.maxReps}</small></div>
                      <div className="target-weight">{exercise.weight ? `${exercise.weight} kg` : "Startvikt"}</div>
                      <ExternalLink size={14} />
                    </a>
                  ))}
                  <button className="primary-action" type="button" onClick={() => onStart(day)}><Play size={18} fill="currentColor" /> Starta {day.name}</button>
                </div>
              )}
            </article>
          );
        })}
      </section>
      <div className="notion-footnote"><Link2 size={16} /><span>27 övningar importerade från din aktuella träningslogg i Notion.</span></div>
    </>
  );
}

function WorkoutView({ activePass, nextPass, logs, onStart, onUpdateSet, onToggleSet, onFinish, onReset }: { activePass: WorkoutDay | null; nextPass: WorkoutDay; logs: Record<string, SetEntry[]>; onStart: (day: WorkoutDay) => void; onUpdateSet: (exerciseId: string, index: number, patch: Partial<SetEntry>) => void; onToggleSet: (exercise: Exercise, index: number) => void; onFinish: () => void; onReset: () => void }) {
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

function ExerciseCard({ exercise, sets, onUpdate, onToggle }: { exercise: Exercise; sets: SetEntry[]; onUpdate: (index: number, patch: Partial<SetEntry>) => void; onToggle: (index: number) => void }) {
  const [expanded, setExpanded] = useState(exercise.order === 1);
  const last = sets[sets.length - 1] ?? { weight: exercise.weight, reps: exercise.startReps, rpe: 8 };
  const advice = getExerciseAdvice(exercise, last.reps, last.rpe, last.weight);
  const complete = sets.filter((set) => set.done).length;

  return (
    <article className={`exercise-card ${complete === sets.length ? "complete" : ""}`}>
      <button
        className="exercise-visual"
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-label={`${expanded ? "Dölj" : "Visa"} set och teknik för ${exercise.name}`}
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
        <span className="exercise-status">{complete}/{sets.length} set <ChevronDown size={17} className={expanded ? "rotated" : ""} /></span>
      </button>
      <div className="exercise-title-row">
        <div><small>{exercise.sets} × {exercise.minReps}–{exercise.maxReps} · vila {Math.round(exercise.restSeconds / 15) * 15} sek</small><h2>{exercise.name}</h2></div>
        <a href={exercise.notionUrl} target="_blank" rel="noreferrer" aria-label={`Öppna ${exercise.name} i Notion`}><ExternalLink size={17} /></a>
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

function ProfileView({ state, setState, notionLoading, onSync }: { state: PersistedState; setState: React.Dispatch<React.SetStateAction<PersistedState>>; notionLoading: boolean; onSync: () => void }) {
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

      <section className="settings-card notion-card">
        <div className="section-heading"><div><span>DATASYNK</span><h3>Notion</h3></div><span className={`status-dot ${state.notion.configured ? "online" : ""}`} /></div>
        <div className="notion-status">
          <span className="notion-logo">N</span>
          <div><strong>{state.notion.message}</strong><p>{state.notion.importedExercises} övningar · senast {formatShortDate(state.notion.lastSync)}</p></div>
        </div>
        <button className="secondary-action" type="button" disabled={notionLoading} onClick={onSync}>{notionLoading ? <LoaderCircle size={17} className="spin" /> : <RefreshCw size={17} />} Synka nu</button>
        {!state.notion.configured && <div className="setup-note"><CircleAlert size={16} /><span>Din riktiga träningsplan är redan importerad. För automatisk dygnssynk behöver appen senare få en hemlig Notion-nyckel.</span></div>}
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

function NutritionSheet({ nutrition, onClose, onChange }: { nutrition: PersistedState["nutrition"]; onClose: () => void; onChange: (nutrition: PersistedState["nutrition"]) => void }) {
  const [name, setName] = useState("");
  const [meal, setMeal] = useState("Mellanmål");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const totals = totalNutrition(nutrition.entries);

  function addEntry() {
    if (!name.trim() || !calories) return;
    onChange({
      ...nutrition,
      entries: [...nutrition.entries, { id: crypto.randomUUID(), name: name.trim(), meal, calories: Number(calories), protein: Number(protein || 0) }],
    });
    setName("");
    setCalories("");
    setProtein("");
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Kostlogg">
        <div className="sheet-handle" />
        <div className="sheet-head"><div><small>KOST IDAG</small><h2>Mat & protein</h2></div><button type="button" onClick={onClose}><X size={20} /></button></div>
        <div className="nutrition-summary">
          <div><span><Apple size={18} /></span><small>Kalorier</small><strong>{totals.calories}</strong><p>{Math.max(0, nutrition.calorieTarget - totals.calories)} kvar</p></div>
          <div><span><Dumbbell size={18} /></span><small>Protein</small><strong>{formatNumber(totals.protein)} g</strong><p>{formatNumber(Math.max(0, nutrition.proteinTarget - totals.protein))} g kvar</p></div>
          <div><span><Waves size={18} /></span><small>Vatten</small><strong>{formatNumber(nutrition.waterMl / 1000)} l</strong><button type="button" onClick={() => onChange({ ...nutrition, waterMl: nutrition.waterMl + 250 })}>+250 ml</button></div>
        </div>
        <div className="food-form">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Vad åt du?" />
          <select value={meal} onChange={(event) => setMeal(event.target.value)}><option>Frukost</option><option>Lunch</option><option>Middag</option><option>Mellanmål</option></select>
          <label><span>kcal</span><input type="number" inputMode="numeric" value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="0" /></label>
          <label><span>protein</span><input type="number" inputMode="decimal" value={protein} onChange={(event) => setProtein(event.target.value)} placeholder="0 g" /></label>
          <button type="button" onClick={addEntry}><Plus size={18} /> Lägg till</button>
        </div>
        <div className="food-list">
          {nutrition.entries.length === 0 ? <div className="food-empty"><Utensils size={24} /><p>Ingen mat loggad än idag.</p></div> : nutrition.entries.map((entry) => (
            <div key={entry.id}><span><small>{entry.meal}</small><strong>{entry.name}</strong></span><span><strong>{entry.calories} kcal</strong><small>{entry.protein} g protein</small></span><button type="button" onClick={() => onChange({ ...nutrition, entries: nutrition.entries.filter((item) => item.id !== entry.id) })}><X size={15} /></button></div>
          ))}
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
