import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// POINT TO ROOT .ENV
dotenv.config({ path: resolve(__dirname, '../.env') });

// Only replace @db: with @localhost: when running locally (not in Docker)
// const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER === 'true';
const databaseUrl = process.env.DATABASE_URL || '';

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
