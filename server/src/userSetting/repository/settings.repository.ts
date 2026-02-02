// src/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { users } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ProfileSettingsDto } from '../dto/profile-settings.dto';



@Injectable()
export class SettingsRepository {
    constructor(
        @Inject(DRIZZLE) private readonly db : ReturnType<typeof drizzle>,
      ) {}
    
      async findById(id: number) {
        const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0] ?? null;
      }
    
      async findByUsername(username: string) {
        const result =  await this.db.select().from(users).where(eq(users.username, username)).limit(1);
        return result[0] ?? null;
      }

      async findByEmail(email: string) {
        const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
        return result[0] ?? null;
      }


      async updateEmail(id: number, email: string) {
        await this.db
          .update(users)
          .set({ email })
          .where(eq(users.id, id));
      
        return true;
      }
      
      async updatePassword(id: number, passwordHash: string) {
        await this.db
          .update(users)
          .set({ passwordHash })
          .where(eq(users.id, id));
      
        return true;
      }
      
      async updateProfile(id: number, data: Partial<ProfileSettingsDto>) {
        const updateData: any = {};
        if (data.first_name !== undefined) updateData.firstName = data.first_name;
        if (data.last_name !== undefined) updateData.lastName = data.last_name;
        if (data.username !== undefined) updateData.username = data.username;

        await this.db.update(users).set(updateData).where(eq(users.id, id));
        return true;
      }

      async updateProfileAvatar(id: number, url: string)
      {
        await this.db.update(users).set({avatarUrl: url}).where(eq(users.id, id));
        return true;
      }

      async updateLanguage(id: number, langue_code: string) {
        await this.db.update(users).set({langue_code: langue_code}).where(eq(users.id, id));
        return true;
      }
}
