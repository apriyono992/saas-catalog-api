-- Migration: remove all test seeded catalog data (products, categories, and related relations)

DELETE FROM "product_categories" 
WHERE "product_id" IN (
  SELECT "id" FROM "products" 
  WHERE "slug" LIKE 'test-%' OR "description" LIKE '%[TEST_CATALOG_SEED]%'
);
--> statement-breakpoint

DELETE FROM "product_images" 
WHERE "product_id" IN (
  SELECT "id" FROM "products" 
  WHERE "slug" LIKE 'test-%' OR "description" LIKE '%[TEST_CATALOG_SEED]%'
);
--> statement-breakpoint

DELETE FROM "marketplace_links" 
WHERE "product_id" IN (
  SELECT "id" FROM "products" 
  WHERE "slug" LIKE 'test-%' OR "description" LIKE '%[TEST_CATALOG_SEED]%'
);
--> statement-breakpoint

DELETE FROM "product_clicks" 
WHERE "product_id" IN (
  SELECT "id" FROM "products" 
  WHERE "slug" LIKE 'test-%' OR "description" LIKE '%[TEST_CATALOG_SEED]%'
);
--> statement-breakpoint

DELETE FROM "products" 
WHERE "slug" LIKE 'test-%' OR "description" LIKE '%[TEST_CATALOG_SEED]%';
--> statement-breakpoint

DELETE FROM "categories" 
WHERE "slug" LIKE 'test-%';
