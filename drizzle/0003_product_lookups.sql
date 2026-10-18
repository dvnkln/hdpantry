CREATE TABLE `product_lookups` (
	`barcode` text PRIMARY KEY NOT NULL,
	`found` integer NOT NULL,
	`name` text,
	`hints` text,
	`frozen` integer DEFAULT false NOT NULL,
	`looked_at` integer NOT NULL
);
