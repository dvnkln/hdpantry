CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barcode` text,
	`name` text NOT NULL,
	`category` text,
	`icon` text,
	`location` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_barcode_unique` ON `products` (`barcode`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`container_id` integer,
	`product_id` integer,
	`name` text NOT NULL,
	`note` text,
	`vacuumed` integer NOT NULL,
	`location` text NOT NULL,
	`best_before` text,
	`date_month` integer DEFAULT false NOT NULL,
	`date_manual` integer DEFAULT false NOT NULL,
	`category` text,
	`icon` text,
	`fill` text NOT NULL,
	`amount` real,
	`unit` text,
	`created_at` integer NOT NULL,
	`stored_on` text,
	`removed_at` integer,
	FOREIGN KEY (`container_id`) REFERENCES `containers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "items_belongs_to_one" CHECK(("container_id" is null) <> ("product_id" is null))
);
--> statement-breakpoint
INSERT INTO `__new_items`("id", "container_id", "product_id", "name", "note", "vacuumed", "location", "best_before", "date_month", "date_manual", "category", "icon", "fill", "amount", "unit", "created_at", "stored_on", "removed_at") SELECT "id", "container_id", NULL, "name", "note", "vacuumed", "location", "best_before", 0, "date_manual", "category", "icon", "fill", "amount", "unit", "created_at", "stored_on", "removed_at" FROM `items`;--> statement-breakpoint
DROP TABLE `items`;--> statement-breakpoint
ALTER TABLE `__new_items` RENAME TO `items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `items_container_idx` ON `items` (`container_id`);--> statement-breakpoint
CREATE INDEX `items_product_idx` ON `items` (`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `items_active_idx` ON `items` (`container_id`) WHERE "items"."removed_at" is null;