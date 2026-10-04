CREATE TABLE `food_memory` (
	`name` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`icon` text
);
--> statement-breakpoint
ALTER TABLE `items` ADD `date_manual` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `category` text;--> statement-breakpoint
ALTER TABLE `items` ADD `icon` text;--> statement-breakpoint
-- Dates recorded before suggestions existed were all typed by hand: they must stay as they are
UPDATE `items` SET `date_manual` = 1 WHERE `best_before` IS NOT NULL;
