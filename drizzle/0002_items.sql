CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`container_id` integer NOT NULL,
	`name` text NOT NULL,
	`note` text,
	`vacuumed` integer NOT NULL,
	`location` text NOT NULL,
	`best_before` text,
	`fill` text NOT NULL,
	`grams` integer,
	`created_at` integer NOT NULL,
	`removed_at` integer,
	FOREIGN KEY (`container_id`) REFERENCES `containers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `items_container_idx` ON `items` (`container_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `items_active_idx` ON `items` (`container_id`) WHERE "items"."removed_at" is null;