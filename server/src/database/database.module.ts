// server/src/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index';

export const DRIZZLE = 'DB_CONNECTION';
export const PG_POOL = 'PG_POOL';

@Global()
@Module({
  imports: [ConfigModule], // Needs ConfigModule to read .env
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        const pool = new Pool({
          connectionString,
        });

        return drizzle(pool, { schema });
      },
    },
    
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
