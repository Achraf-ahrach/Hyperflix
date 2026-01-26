




import { pgTable, integer, varchar, primaryKey } from 'drizzle-orm/pg-core';


export const languages = pgTable('languages', {
  id: integer('id')
    .notNull().primaryKey(),
  code: varchar('code', { length: 2 }).notNull().unique(),
});