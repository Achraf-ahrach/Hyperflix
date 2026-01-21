import { pgTable, integer, varchar, primaryKey, index, bigserial } from 'drizzle-orm/pg-core';
import { users } from './users';
import { movies } from './movies';

export const watchLaterMovies = pgTable('watch_later_movies', {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    
    userId: integer('user_id')
        .notNull()
        .references(() => users.id),
    movieId: varchar('movie_id')
        .notNull()
        .references(() => movies.id),
}

);