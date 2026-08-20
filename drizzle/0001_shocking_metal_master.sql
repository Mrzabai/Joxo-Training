DROP TABLE `notion_sync_settings`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`source` text DEFAULT 'local' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_programs`("id", "owner", "name", "source", "active", "created_at", "updated_at") SELECT "id", "owner", "name", "source", "active", "created_at", "updated_at" FROM `programs`;--> statement-breakpoint
DROP TABLE `programs`;--> statement-breakpoint
ALTER TABLE `__new_programs` RENAME TO `programs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;