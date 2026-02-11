import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { languages } from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seed() {
  // console.log('Seeding languages...');

  await db
    .insert(languages)
    .values([
      { id: 1, code: 'en' },
      { id: 2, code: 'fr' },
      { id: 3, code: 'ar' },
      { id: 4, code: 'es' },
    ])
    .onConflictDoNothing();

  // console.log('Languages seeded');
  process.exit(0);
}

seed().catch((err) => {
  // console.error('Seeding failed', err);
  process.exit(1);
});
