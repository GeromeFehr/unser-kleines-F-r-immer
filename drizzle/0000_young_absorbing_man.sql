CREATE TABLE `admins` (
	`role` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_user_id_unique` ON `admins` (`user_id`);--> statement-breakpoint
CREATE TABLE `app_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`place` text NOT NULL,
	`date` text NOT NULL,
	`story` text NOT NULL,
	`category` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`photo_url` text DEFAULT '' NOT NULL,
	`photo_alt` text DEFAULT '' NOT NULL,
	`is_example` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_memories_date` ON `memories` (`date`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
