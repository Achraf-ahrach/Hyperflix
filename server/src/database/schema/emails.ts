


import { pgTable, integer, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

export const mailTokens = pgTable('user_mail_tokens', {
  id: integer('id')
    .notNull().primaryKey()
    .references(() => users.id),
  token: varchar('token', { length: 500 }).notNull(),
});