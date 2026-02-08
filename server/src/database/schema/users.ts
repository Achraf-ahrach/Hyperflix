                                                                                                                                                                                                                                                                                                                                                                                                                                                      import { timestamp } from 'drizzle-orm/pg-core';
import { pgTable, serial, varchar, boolean } from 'drizzle-orm/pg-core';
import { languages } from './languages';
import { integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 1000 }), // Increased for OAuth URLs
  passwordHash: varchar('password_hash', { length: 255 }),
  provider: varchar('provider', { length: 50 }),
  providerId: varchar('provider_id', { length: 1000 }), // Increased for safety
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerificationExpires: varchar('email_verification_expires', {
    length: 50,
  }),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: varchar('password_reset_expires', { length: 50 }),                                                                                                                                            
  langue_code: varchar('langue_code', { length: 2 })
    .notNull()
    .references(() => languages.code)
    .default('en'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
