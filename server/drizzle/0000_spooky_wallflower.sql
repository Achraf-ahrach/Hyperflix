CREATE TABLE "movies" (
	"movie_id" varchar(50) PRIMARY KEY NOT NULL,
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
	"parent_id" bigint,
	"movie_id" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_content_length_check" CHECK (length("comments"."content") > 0 AND length("comments"."content") <= 2000)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"avatar_url" varchar(255),
	"password_hash" varchar(255),
	"provider" varchar(50),
	"provider_id" varchar(255),
	"created_at" varchar(50) NOT NULL,
	"updated_at" varchar(50) NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_mail_tokens" (
	"id" integer PRIMARY KEY NOT NULL,
	"token" varchar(500) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_likes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"comment_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_comment_like" UNIQUE("user_id","comment_id")
);
--> statement-breakpoint
CREATE TABLE "comment_media" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"comment_id" bigint NOT NULL,
	"type" varchar(20) NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_media_type_check" CHECK ("comment_media"."type" IN ('image', 'video'))
);
--> statement-breakpoint
CREATE TABLE "watched_movies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"movie_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_later_movies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"movie_id" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_movie_id_movies_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("movie_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mail_tokens" ADD CONSTRAINT "user_mail_tokens_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_media" ADD CONSTRAINT "comment_media_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_movies" ADD CONSTRAINT "watched_movies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_movies" ADD CONSTRAINT "watched_movies_movie_id_movies_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("movie_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_later_movies" ADD CONSTRAINT "watch_later_movies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_later_movies" ADD CONSTRAINT "watch_later_movies_movie_id_movies_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("movie_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_movies_last_watched" ON "movies" USING btree ("last_watched_at") WHERE "movies"."last_watched_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_movies_imdb_rating" ON "movies" USING btree ("imdb_rating" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_movies_production_year" ON "movies" USING btree ("production_year" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_comments_parent_id" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_comments_movie_id" ON "comments" USING btree ("movie_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_comments_user_id" ON "comments" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_comments_created_at" ON "comments" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_comment_likes_comment_id" ON "comment_likes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_comment_likes_user_id" ON "comment_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_comment_media_comment_id" ON "comment_media" USING btree ("comment_id");