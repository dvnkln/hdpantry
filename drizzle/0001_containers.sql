CREATE TABLE `containers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`size` text,
	`type_code` text,
	`name` text,
	`raw_content` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `containers_code_unique` ON `containers` (`code`);