-- Containers no longer have a name of their own (the name belongs to what is inside),
-- and remember how their code was first read.
ALTER TABLE `containers` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `containers` ADD `source` text;
