ALTER TABLE `products` ADD `brand` text;--> statement-breakpoint
-- The maker the product database named becomes the brand of products looked up before
UPDATE `products` SET `brand` = (
	SELECT `brand` FROM `product_lookups`
	WHERE `product_lookups`.`barcode` = `products`.`barcode` AND `found` = 1 AND `brand` <> ''
) WHERE `barcode` IS NOT NULL;--> statement-breakpoint
-- … and leaves the name it was put behind ("Nut mix (Quixo)" → "Nut mix"): first in the packs
-- still called that, then in the product
UPDATE `items` SET `name` = (
	SELECT substr(`products`.`name`, 1, length(`products`.`name`) - length(`products`.`brand`) - 3)
	FROM `products` WHERE `products`.`id` = `items`.`product_id`
) WHERE `product_id` IN (
	SELECT `id` FROM `products` WHERE `brand` IS NOT NULL
		AND length(`name`) > length(`brand`) + 3
		AND substr(`name`, -length(`brand`) - 3) = ' (' || `brand` || ')'
) AND `name` = (SELECT `name` FROM `products` WHERE `products`.`id` = `items`.`product_id`);--> statement-breakpoint
UPDATE `products` SET `name` = substr(`name`, 1, length(`name`) - length(`brand`) - 3)
WHERE `brand` IS NOT NULL
	AND length(`name`) > length(`brand`) + 3
	AND substr(`name`, -length(`brand`) - 3) = ' (' || `brand` || ')';
