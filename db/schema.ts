import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
};

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull().unique(),
  displayName: text("display_name").notNull().default("Jocke"),
  birthDate: text("birth_date").notNull().default("1988-04-08"),
  heightCm: doublePrecision("height_cm").notNull().default(190),
  weightKg: doublePrecision("weight_kg").notNull().default(105),
  goal: text("goal").notNull().default("Starkare och mer muskler"),
  weeklySessions: integer("weekly_sessions").notNull().default(4),
  ...timestamps,
});

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  source: text("source").notNull().default("local"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const workoutDays = pgTable("workout_days", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id),
  externalId: text("external_id"),
  name: text("name").notNull(),
  focus: text("focus").notNull().default(""),
  position: integer("position").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(70),
  ...timestamps,
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  technique: text("technique").notNull().default(""),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  ...timestamps,
});

export const plannedExercises = pgTable("planned_exercises", {
  id: serial("id").primaryKey(),
  workoutDayId: integer("workout_day_id").references(() => workoutDays.id),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  position: integer("position").notNull(),
  targetSets: integer("target_sets").notNull(),
  minReps: integer("min_reps").notNull(),
  maxReps: integer("max_reps").notNull(),
  targetWeight: doublePrecision("target_weight"),
  restSeconds: integer("rest_seconds").notNull().default(90),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull(),
  workoutDayKey: text("workout_day_key").notNull(),
  workoutName: text("workout_name").notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  durationMinutes: integer("duration_minutes"),
  totalVolume: doublePrecision("total_volume").notNull().default(0),
  note: text("note").notNull().default(""),
  ...timestamps,
});

export const completedSets = pgTable("completed_sets", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => workoutSessions.id),
  exerciseKey: text("exercise_key").notNull(),
  setNumber: integer("set_number").notNull(),
  weightKg: doublePrecision("weight_kg"),
  reps: integer("reps").notNull(),
  rpe: doublePrecision("rpe"),
  warmup: boolean("warmup").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  pain: boolean("pain").notNull().default(false),
  note: text("note").notNull().default(""),
  ...timestamps,
});

export const bodyMetrics = pgTable("body_metrics", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull(),
  measuredOn: text("measured_on").notNull(),
  weightKg: doublePrecision("weight_kg").notNull(),
  waistCm: doublePrecision("waist_cm"),
  note: text("note").notNull().default(""),
  ...timestamps,
});

export const readinessCheckins = pgTable("readiness_checkins", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull(),
  checkinDate: text("checkin_date").notNull(),
  sleepHours: doublePrecision("sleep_hours").notNull(),
  energy: integer("energy").notNull(),
  soreness: integer("soreness").notNull(),
  motivation: integer("motivation").notNull(),
  pain: boolean("pain").notNull().default(false),
  ...timestamps,
});

export const nutritionDays = pgTable("nutrition_days", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull(),
  nutritionDate: text("nutrition_date").notNull(),
  calorieTarget: integer("calorie_target").notNull(),
  proteinTarget: integer("protein_target").notNull(),
  waterMl: integer("water_ml").notNull().default(0),
  ...timestamps,
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  nutritionDayId: integer("nutrition_day_id").references(() => nutritionDays.id),
  mealType: text("meal_type").notNull(),
  name: text("name").notNull(),
  ...timestamps,
});

export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").references(() => meals.id),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  protein: doublePrecision("protein").notNull().default(0),
  carbs: doublePrecision("carbs").notNull().default(0),
  fat: doublePrecision("fat").notNull().default(0),
  fiber: doublePrecision("fiber").notNull().default(0),
  ...timestamps,
});

export const nutritionEntries = pgTable(
  "nutrition_entries",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    loggedAt: text("logged_at").notNull(),
    mealType: text("meal_type").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    calories: integer("calories").notNull(),
    protein: doublePrecision("protein").notNull().default(0),
    source: text("source").notNull().default("manual"),
    confidence: text("confidence"),
    imageKey: text("image_key"),
    imageType: text("image_type"),
    detailsJson: text("details_json").notNull().default("{}"),
    ...timestamps,
  },
  (table) => [uniqueIndex("nutrition_entries_owner_id_idx").on(table.owner, table.id)],
);

export const nutritionPhotos = pgTable(
  "nutrition_photos",
  {
    key: text("key").primaryKey(),
    owner: text("owner").notNull(),
    contentType: text("content_type").notNull(),
    dataBase64: text("data_base64").notNull(),
    byteSize: integer("byte_size").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("nutrition_photos_owner_key_idx").on(table.owner, table.key)],
);

export const coachRecommendations = pgTable("coach_recommendations", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  rationale: text("rationale").notNull().default(""),
  accepted: boolean("accepted"),
  ...timestamps,
});

export const userSnapshots = pgTable(
  "user_snapshots",
  {
    id: serial("id").primaryKey(),
    owner: text("owner").notNull(),
    stateJson: text("state_json").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_snapshots_owner_idx").on(table.owner)],
);
