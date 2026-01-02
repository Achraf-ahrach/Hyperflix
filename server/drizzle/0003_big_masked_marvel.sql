CREATE TABLE "movies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"production_year" integer,
	"imdb_rating" numeric(3, 1),
	"runtime_minutes" integer,
	"summary" text,
	"cover_image_url" varchar(500),
	"file_path" varchar(500),
	"file_size" bigint,
	"video_format" varchar(20),
	"video_codec" varchar(50),
	"audio_codec" varchar(50),
	"last_watched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movies_imdb_rating_check" CHECK ("movies"."imdb_rating" >= 0 AND "movies"."imdb_rating" <= 10),
	CONSTRAINT "movies_runtime_minutes_check" CHECK ("movies"."runtime_minutes" > 0),
	CONSTRAINT "movies_file_size_check" CHECK ("movies"."file_size" >= 0)
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"user_reply_to_id" bigint,
	"movie_id" bigint NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_content_length_check" CHECK (length("comments"."content") > 0 AND length("comments"."content") <= 2000)
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_reply_to_id_users_id_fk" FOREIGN KEY ("user_reply_to_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_movies_last_watched" ON "movies" USING btree ("last_watched_at") WHERE "movies"."last_watched_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_movies_imdb_rating" ON "movies" USING btree ("imdb_rating" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_movies_production_year" ON "movies" USING btree ("production_year" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_comments_movie_id" ON "comments" USING btree ("movie_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_comments_user_id" ON "comments" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_comments_created_at" ON "comments" USING btree ("created_at" DESC NULLS LAST);