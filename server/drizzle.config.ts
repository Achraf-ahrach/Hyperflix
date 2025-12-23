import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// POINT TO ROOT .ENV
dotenv.config({ path: resolve(__dirname, '../.env') });

const databaseUrl =
  process.env.DATABASE_URL?.replace('@db:', '@localhost:') || '';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
