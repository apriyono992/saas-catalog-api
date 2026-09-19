import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { like, or, inArray } from 'drizzle-orm';
import * as schema from './schema';

async function cleanCatalog() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('--- Cleaning Test Catalog Seed (Categories & Products) ---');

  // Find all test products by slug prefix 'test-%' or description containing '[TEST_CATALOG_SEED]'
  const testProducts = await db.query.products.findMany({
    where: or(
      like(schema.products.slug, 'test-%'),
      like(schema.products.description, '%[TEST_CATALOG_SEED]%')
    ),
    columns: { id: true, name: true },
  });

  const testProductIds = testProducts.map((p) => p.id);
  console.log(`Found ${testProductIds.length} test products to delete.`);

  if (testProductIds.length > 0) {
    // 1. Delete associated product categories
    await db
      .delete(schema.productCategories)
      .where(inArray(schema.productCategories.productId, testProductIds));

    // 2. Delete associated product images
    await db
      .delete(schema.productImages)
      .where(inArray(schema.productImages.productId, testProductIds));

    // 3. Delete associated marketplace links
    await db
      .delete(schema.marketplaceLinks)
      .where(inArray(schema.marketplaceLinks.productId, testProductIds));

    // 4. Delete product clicks if any
    await db
      .delete(schema.productClicks)
      .where(inArray(schema.productClicks.productId, testProductIds));

    // 5. Delete products
    await db
      .delete(schema.products)
      .where(inArray(schema.products.id, testProductIds));

    console.log(`✓ Deleted ${testProductIds.length} test products and associated relations.`);
  }

  // Find all test categories (slugs starting with 'test-%')
  // We delete deepest children first by looping until none remain
  let deletedTotalCategories = 0;
  while (true) {
    const testCategories = await db.query.categories.findMany({
      where: like(schema.categories.slug, 'test-%'),
      columns: { id: true },
    });

    if (testCategories.length === 0) break;

    // Delete in bulk - foreign key on parent_id will cascade or we delete
    const result = await db
      .delete(schema.categories)
      .where(like(schema.categories.slug, 'test-%'))
      .returning();

    deletedTotalCategories += result.length;
    break;
  }

  console.log(`✓ Deleted ${deletedTotalCategories} test categories.`);
  console.log('\n✓ Test Catalog Cleaned Successfully!');
  await pool.end();
}

cleanCatalog().catch((err) => {
  console.error('Error cleaning test catalog:', err);
  process.exit(1);
});
