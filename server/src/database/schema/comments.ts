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
import { relations, sql } from "drizzle-orm";



export const comments = pgTable(
  "comments",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    parentId: bigint("parent_id", { mode: "number" })
      .references(() => comments.id, { onDelete: "cascade" }),

    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),

    content: text("content").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
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
    index("idx_comments_parent_id").on(table.parentId),
    index("idx_comments_movie_id").on(table.movieId, table.createdAt.desc()),
    check(
      "comments_content_length_check",
      sql`length(${table.content}) > 0 AND length(${table.content}) <= 2000`
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

export const commentsRelations = relations(comments, ({ one, many }) => ({
  replies: many(comments, { relationName: "replies" }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "replies",
  }),
}));

// Usage:
// const data = await db.query.comments.findMany({
//   where: (comments, { and, eq, isNull }) => 
//     and(eq(comments.movieId, 1), isNull(comments.parentId)),
//   with: {
//     replies: true,
//   },
// });

