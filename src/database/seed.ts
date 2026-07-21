import 'dotenv/config';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const email = (
    process.env.SEED_SUPERADMIN_EMAIL ?? 'superadmin@example.com'
  ).toLowerCase();
  const password = process.env.SEED_SUPERADMIN_PASSWORD ?? 'ChangeMe123!';

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (existing) {
    console.log(`Superadmin already exists: ${email}`);
    await pool.end();
    return;
  }

  const passwordHash = (await argon2.hash(password)) as string;
  await db.insert(schema.users).values({
    tenantId: null,
    email,
    passwordHash,
    role: 'superadmin',
    isActive: true,
  });

  console.log(`Superadmin created: ${email}`);
  await pool.end();
}

seed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
