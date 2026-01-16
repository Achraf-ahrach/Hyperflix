
import {
  pgTable,
  bigserial,
  bigint,
  text,
  timestamp,
  index,
  check,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { comments } from "./comments";


export const commentLikes = pgTable(
  "comment_likes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    commentId: bigint("comment_id", { mode: "number" })
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_comment_likes_comment_id").on(table.commentId),
    index("idx_comment_likes_user_id").on(table.userId),
    unique("unique_user_comment_like").on(table.userId, table.commentId),
  ]
);