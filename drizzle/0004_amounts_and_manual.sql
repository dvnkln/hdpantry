ALTER TABLE `containers` ADD `manual` integer DEFAULT false NOT NULL;--> statement-breakpoint
-- Containers typed by hand before the way of reading was recorded: their raw content is just the code
UPDATE `containers` SET `source` = 'manual' WHERE `source` IS NULL AND upper(`raw_content`) = upper(`code`);--> statement-breakpoint
UPDATE `containers` SET `manual` = 1 WHERE `source` = 'manual';--> statement-breakpoint
DROP INDEX `containers_code_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `containers_code_idx` ON `containers` (`code`,`manual`);--> statement-breakpoint
ALTER TABLE `items` ADD `amount` real;--> statement-breakpoint
ALTER TABLE `items` ADD `unit` text;--> statement-breakpoint
-- What was recorded in grams so far becomes an amount with the unit g
UPDATE `items` SET `amount` = `grams`, `unit` = 'g' WHERE `grams` IS NOT NULL;
