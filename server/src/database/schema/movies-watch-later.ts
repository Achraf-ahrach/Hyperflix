import { pgTable, integer, varchar, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const watchLaterMovies = pgTable('watch_later_movies', {
    userId: integer('user_id')
        .notNull()
        .references(() => users.id),
    movieId: integer('movie_id')
        .notNull()
        .references(() => users.id),
},
    (table) => [
        primaryKey({ columns: [table.userId, table.movieId] }),
        index('idx_watch_later_movies_user').on(table.userId),
]
);