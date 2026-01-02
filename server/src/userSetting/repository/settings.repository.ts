// src/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { users } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres'
@Injectable()
export class SettingsRepository {
    constructor(
        @Inject(DRIZZLE) private readonly db : ReturnType<typeof drizzle>,
      ) {}
    
      async findById(id: number) {
        return this.db.select().from(users).where(eq(users.id, id));
      }
    
      async updateSettings(
        id: number,
        data: Partial<{ email: string; }>,
      ) {
        await this.db.update(users).set(data).where(eq(users.id, id));
        return this.findById(id);
      }
}
