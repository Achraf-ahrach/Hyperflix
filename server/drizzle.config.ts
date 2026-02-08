import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from root
dotenv.config({ path: resolve(__dirname, '../.env.local') });

let databaseUrl = process.env.DATABASE_URL || '';

// When running locally (not in Docker), replace 'db' with 'localhost'
// Docker sets specific env vars we can check for
const isDocker = process.env.HOSTNAME || process.env.DOCKER_CONTAINER;
if (!isDocker && databaseUrl.includes('@db:')) {
  databaseUrl = databaseUrl.replace('@db:', '@localhost:');
}

export default {
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;
