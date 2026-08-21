CREATE TABLE "body_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"measured_on" text NOT NULL,
	"weight_kg" double precision NOT NULL,
	"waist_cm" double precision,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"rationale" text DEFAULT '' NOT NULL,
	"accepted" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "completed_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"exercise_key" text NOT NULL,
	"set_number" integer NOT NULL,
	"weight_kg" double precision,
	"reps" integer NOT NULL,
	"rpe" double precision,
	"warmup" boolean DEFAULT false NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"pain" boolean DEFAULT false NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"technique" text DEFAULT '' NOT NULL,
	"image_url" text,
	"video_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer,
	"name" text NOT NULL,
	"calories" integer NOT NULL,
	"protein" double precision DEFAULT 0 NOT NULL,
	"carbs" double precision DEFAULT 0 NOT NULL,
	"fat" double precision DEFAULT 0 NOT NULL,
	"fiber" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"nutrition_day_id" integer,
	"meal_type" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"nutrition_date" text NOT NULL,
	"calorie_target" integer NOT NULL,
	"protein_target" integer NOT NULL,
	"water_ml" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"logged_at" text NOT NULL,
	"meal_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"calories" integer NOT NULL,
	"protein" double precision DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"confidence" text,
	"image_key" text,
	"image_type" text,
	"details_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_photos" (
	"key" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"content_type" text NOT NULL,
	"data_base64" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_day_id" integer,
	"exercise_id" integer,
	"position" integer NOT NULL,
	"target_sets" integer NOT NULL,
	"min_reps" integer NOT NULL,
	"max_reps" integer NOT NULL,
	"target_weight" double precision,
	"rest_seconds" integer DEFAULT 90 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"display_name" text DEFAULT 'Jocke' NOT NULL,
	"birth_date" text DEFAULT '1988-04-08' NOT NULL,
	"height_cm" double precision DEFAULT 190 NOT NULL,
	"weight_kg" double precision DEFAULT 105 NOT NULL,
	"goal" text DEFAULT 'Starkare och mer muskler' NOT NULL,
	"weekly_sessions" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_owner_unique" UNIQUE("owner")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"source" text DEFAULT 'local' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"checkin_date" text NOT NULL,
	"sleep_hours" double precision NOT NULL,
	"energy" integer NOT NULL,
	"soreness" integer NOT NULL,
	"motivation" integer NOT NULL,
	"pain" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"state_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer,
	"external_id" text,
	"name" text NOT NULL,
	"focus" text DEFAULT '' NOT NULL,
	"position" integer NOT NULL,
	"duration_minutes" integer DEFAULT 70 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"workout_day_key" text NOT NULL,
	"workout_name" text NOT NULL,
	"started_at" text NOT NULL,
	"completed_at" text,
	"duration_minutes" integer,
	"total_volume" double precision DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "completed_sets" ADD CONSTRAINT "completed_sets_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_nutrition_day_id_nutrition_days_id_fk" FOREIGN KEY ("nutrition_day_id") REFERENCES "public"."nutrition_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_exercises" ADD CONSTRAINT "planned_exercises_workout_day_id_workout_days_id_fk" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_exercises" ADD CONSTRAINT "planned_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nutrition_entries_owner_id_idx" ON "nutrition_entries" USING btree ("owner","id");--> statement-breakpoint
CREATE UNIQUE INDEX "nutrition_photos_owner_key_idx" ON "nutrition_photos" USING btree ("owner","key");--> statement-breakpoint
CREATE UNIQUE INDEX "user_snapshots_owner_idx" ON "user_snapshots" USING btree ("owner");