CREATE TABLE `containers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`size` text,
	`type_code` text,
	`raw_content` text NOT NULL,
	`source` text,
	`manual` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `containers_code_idx` ON `containers` (`code`,`manual`);--> statement-breakpoint
CREATE TABLE `food_memory` (
	`name` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`icon` text
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`container_id` integer NOT NULL,
	`name` text NOT NULL,
	`note` text,
	`vacuumed` integer NOT NULL,
	`location` text NOT NULL,
	`best_before` text,
	`date_manual` integer DEFAULT false NOT NULL,
	`category` text,
	`icon` text,
	`fill` text NOT NULL,
	`amount` real,
	`unit` text,
	`created_at` integer NOT NULL,
	`removed_at` integer,
	FOREIGN KEY (`container_id`) REFERENCES `containers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `items_container_idx` ON `items` (`container_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `items_active_idx` ON `items` (`container_id`) WHERE "items"."removed_at" is null;--> statement-breakpoint
CREATE TABLE `notification_channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`config` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_ok_at` integer,
	`last_error` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notification_channels_user` ON `notification_channels` (`user_id`);--> statement-breakpoint
CREATE TABLE `notifications_sent` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`kind` text NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_sent_once` ON `notifications_sent` (`user_id`,`item_id`,`kind`,`date`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`label` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_ok_at` integer,
	`enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_user` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`key` text PRIMARY KEY NOT NULL,
	`enabled` integer NOT NULL,
	`frequency` text NOT NULL,
	`time` text NOT NULL,
	`weekday` integer NOT NULL,
	`changed_at` integer NOT NULL,
	`last_run_at` integer,
	`last_duration_ms` integer,
	`last_freed_bytes` integer,
	`last_error` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);