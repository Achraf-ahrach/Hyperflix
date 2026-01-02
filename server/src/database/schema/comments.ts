

import {
  pgTable,
  bigserial,
  bigint,
  text,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { movies } from "./movies";
import { sql } from "drizzle-orm";

export const comments = pgTable(
  "comments",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    userReplyToId: bigint("user_reply_to_id", { mode: "number" })
      .references(() => users.id, { onDelete: "cascade" }),

    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),

    content: text("content").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // CHECK constraint
    check(
      "comments_content_length_check",
      sql`length(${table.content}) > 0 AND length(${table.content}) <= 2000`
    ),

    // Indexes
    index("idx_comments_movie_id").on(
      table.movieId,
      table.createdAt.desc()
    ),

    index("idx_comments_user_id").on(
      table.userId,
      table.createdAt.desc()
    ),

    index("idx_comments_created_at").on(
      table.createdAt.desc()
    ),
]
);
