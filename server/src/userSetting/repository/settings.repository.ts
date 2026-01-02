// src/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { users } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';



@Injectable()
export class SettingsRepository {
    constructor(
        @Inject(DRIZZLE) private readonly db : ReturnType<typeof drizzle>,
      ) {}
    
      async findById(id: number) {
        const result = this.db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0] ?? null;
      }
    
      async updateEmail(id: number, email: string) {
        await this.db
          .update(users)
          .set({ email })
          .where(eq(users.id, id));
      
        return this.findById(id);
      }
      
      async updatePassword(id: number, passwordHash: string) {
        await this.db
          .update(users)
          .set({ passwordHash })
          .where(eq(users.id, id));
      
        return this.findById(id);
      }
      
}
