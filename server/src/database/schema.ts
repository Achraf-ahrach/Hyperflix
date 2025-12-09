import { create } from 'domain';
import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: varchar('created_at', { length: 50 }).notNull(),
  updatedAt: varchar('updated_at', { length: 50 }).notNull(),
});
