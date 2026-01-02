import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema/index';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return result[0] || null;
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findByProviderId(provider: string, providerId: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.provider, provider),
          eq(schema.users.providerId, providerId),
        ),
      )
      .limit(1);
    return result[0] || null;
  }

  async createUser(userData: {
    email: string;
    username: string;
    passwordHash: string;
    avatarUrl?: string;
    provider?: string;
  }) {
    const now = new Date().toISOString();

    const result = await this.db
      .insert(schema.users)
      .values({
        email: userData.email,
        username: userData.username,
        passwordHash: userData.passwordHash,
        avatarUrl: userData.avatarUrl || null,
        provider: userData.provider || 'local',
        providerId: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return result[0];
  }

  async createOAuthUser(oauthData: {
    provider: string;
    providerId: string;
    email: string;
    username: string;
    avatarUrl?: string;
  }) {
    const now = new Date().toISOString();

    const result = await this.db
      .insert(schema.users)
      .values({
        email: oauthData.email,
        username: oauthData.username,
        passwordHash: '', // No password for OAuth users
        avatarUrl: oauthData.avatarUrl || null,
        provider: oauthData.provider,
        providerId: oauthData.providerId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return result[0];
  }

  async updateUserProvider(
    userId: number,
    providerData: { provider: string; providerId: string },
  ) {
    const now = new Date().toISOString();

    const result = await this.db
      .update(schema.users)
      .set({
        provider: providerData.provider,
        providerId: providerData.providerId,
        updatedAt: now,
      })
      .where(eq(schema.users.id, userId))
      .returning();

    return result[0];
  }
}
