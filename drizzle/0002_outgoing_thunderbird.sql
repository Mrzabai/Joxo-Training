CREATE TABLE `nutrition_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`logged_at` text NOT NULL,
	`meal_type` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`calories` integer NOT NULL,
	`protein` real DEFAULT 0 NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`confidence` text,
	`image_key` text,
	`image_type` text,
	`details_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nutrition_entries_owner_id_idx` ON `nutrition_entries` (`owner`,`id`);