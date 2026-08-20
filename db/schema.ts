import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  owner: text("owner").notNull().unique(),
  displayName: text("display_name").notNull().default("Jocke"),
  birthDate: text("birth_date").notNull().default("1988-04-08"),
  heightCm: real("height_cm").notNull().default(190),
  weightKg: real("weight_kg").notNull().default(105),
  goal: text("goal").notNull().default("Starkare och mer muskler"),
  weeklySessions: integer("weekly_sessions").notNull().default(4),
  ...timestamps,
});

export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  source: text("source").notNull().default("local"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const workoutDays = sqliteTable("workout_days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("program_id").references(() => programs.id),
  externalId: text("external_id"),
  name: text("name").notNull(),
  focus: text("focus").notNull().default(""),
  position: integer("position").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(70),
  ...timestamps,
});

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  externalId: text("external_id"),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  technique: text("technique").notNull().default(""),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  ...timestamps,
});

export const plannedExercises = sqliteTable("planned_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutDayId: integer("workout_day_id").references(() => workoutDays.id),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  position: integer("position").notNull(),
  targetSets: integer("target_sets").notNull(),
  minReps: integer("min_reps").notNull(),
  maxReps: integer("max_reps").notNull(),
  targetWeight: real("target_weight"),
  restSeconds: integer("rest_seconds").notNull().default(90),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  owner: text("owner").notNull(),
  workoutDayKey: text("workout_day_key").notNull(),
  workoutName: text("workout_name").notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  durationMinutes: integer("duration_minutes"),
  totalVolume: real("total_volume").notNull().default(0),
  note: text("note").notNull().default(""),
  ...timestamps,
});

export const completedSets = sqliteTable("completed_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").references(() => workoutSessions.id),
  exerciseKey: text("exercise_key").notNull(),
  setNumber: integer("set_number").notNull(),
  weightKg: real("weight_kg"),
  reps: integer("reps").notNull(),
  rpe: real("rpe"),
  warmup: integer("warmup", { mode: "boolean" }).notNull().default(false),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  pain: integer("pain", { mode: "boolean" }).notNull().default(false),
  note: text("note").notNull().default(""),
  ...timestamps,
});

export const bodyMetrics = sqliteTable("body_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  owner: text("owner").notNull(),
  measuredOn: text("measured_on").notNull(),
  weightKg: real("weight_kg").notNull(),
  waistCm: real("waist_cm"),
  note: text("note").notNull().default(""),
  ...timestamps,
});

export const readinessCheckins = sqliteTable("readiness_checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  owner: text("owner").notNull(),
  checkinDate: text("checkin_date").notNull(),
  sleepHours: real("sleep_hours").notNull(),
  energy: integer("energy").notNull(),
  soreness: integer("soreness").notNull(),
  motivation: integer("motivation").notNull(),
  pain: integer("pain", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const nutritionDays = sqliteTable("nutrition_days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  owner: text("owner").notNull(),
  nutritionDate: text("nutrition_date").notNull(),
  calorieTarget: integer("calorie_target").notNull(),
  proteinTarget: integer("protein_target").notNull(),
  waterMl: integer("water_ml").notNull().default(0),
  ...timestamps,
});

export const meals = sqliteTable("meals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nutritionDayId: integer("nutrition_day_id").references(() => nutritionDays.id),
  mealType: text("meal_type").notNull(),
  name: text("name").notNull(),
  ...timestamps,
});

export const foodItems = sqliteTable("food_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mealId: integer("meal_id").references(() => meals.id),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein").notNull().default(0),
  carbs: real("carbs").notNull().default(0),
  fat: real("fat").notNull().default(0),
  fiber: real("fiber").notNull().default(0),
  ...timestamps,
});

export const coachRecommendations = sqliteTable("coach_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  owner: text("owner").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  rationale: text("rationale").notNull().default(""),
  accepted: integer("accepted", { mode: "boolean" }),
  ...timestamps,
});

export const userSnapshots = sqliteTable(
  "user_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    owner: text("owner").notNull(),
    stateJson: text("state_json").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_snapshots_owner_idx").on(table.owner)],
);
