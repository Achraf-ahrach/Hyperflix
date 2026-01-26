import {
    pgTable,
    bigserial,
    varchar,
    integer,
    numeric,
    text,
    bigint,
    timestamp,
    index,
    check,
  } from "drizzle-orm/pg-core";
  import { sql } from "drizzle-orm";
  
  export const movies = pgTable(
    "movies",
    {
      id: varchar("movie_id", { length: 50 }).primaryKey(),

      title: varchar("title", { length: 500 }).notNull(),
  
      productionYear: integer("production_year"),
  
      imdbRating: numeric("imdb_rating", { precision: 3, scale: 1 }),
  
      runtimeMinutes: integer("runtime_minutes"),
  
      summary: text("summary"),
  
      coverImageUrl: varchar("cover_image_url", { length: 500 }),
  
      filePath: varchar("file_path", { length: 500 }),
  
      fileSize: bigint("file_size", { mode: "number" }),
  
      videoFormat: varchar("video_format", { length: 20 }),
  
      videoCodec: varchar("video_codec", { length: 50 }),
  
      audioCodec: varchar("audio_codec", { length: 50 }),
  
      lastWatchedAt: timestamp("last_watched_at", {
        withTimezone: true,
        mode: "date",
      }),
  
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
      /* ---------- CHECK CONSTRAINTS ---------- */
  
      check(
        "movies_imdb_rating_check",
        sql`${table.imdbRating} >= 0 AND ${table.imdbRating} <= 10`
      ),
  
      check(
        "movies_runtime_minutes_check",
        sql`${table.runtimeMinutes} > 0`
      ),
  
      check(
        "movies_file_size_check",
        sql`${table.fileSize} >= 0`
      ),
  
      /* ---------- INDEXES ---------- */
  
      index("idx_movies_last_watched")
        .on(table.lastWatchedAt)
        .where(sql`${table.lastWatchedAt} IS NOT NULL`),
  
      index("idx_movies_imdb_rating").on(
        table.imdbRating.desc().nullsLast()
      ),
  
      index("idx_movies_production_year").on(
        table.productionYear.desc().nullsLast()
      ),
    ]
  );
  