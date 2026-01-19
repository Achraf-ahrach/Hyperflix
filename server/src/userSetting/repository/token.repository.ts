// src/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { mailTokens, users } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';
import { eq , and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres'
@Injectable()
export class TokenRepository {
    constructor(
        @Inject(DRIZZLE) private readonly db : ReturnType<typeof drizzle>,
      ) {}
    
      async findByIdAndToken(id : number, token: string)
      {
        return this.db.select().from(mailTokens).where(
            and(
                eq(mailTokens.id, id), 
                eq(mailTokens.token, token)
            ));
      }

      async deleteById(id: number) {
        return this.db
          .delete(mailTokens)
          .where(eq(mailTokens.id, id));
      }
}
