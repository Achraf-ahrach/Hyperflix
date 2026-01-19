import {
  pgTable,
  bigserial,
  bigint,
  text,
  timestamp,
  index,
  check,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { comments } from "./comments";
import { sql } from "drizzle-orm";

export const commentMedia = pgTable(
  "comment_media",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    commentId: bigint("comment_id", { mode: "number" })
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // 'image' or 'video'
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_comment_media_comment_id").on(table.commentId),
    check(
      "comment_media_type_check",
      sql`${table.type} IN ('image', 'video')`
    ),
  ]
);