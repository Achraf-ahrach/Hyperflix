CREATE TABLE "watched_movies" (
	"user_id" integer NOT NULL,
	"movie_id" integer NOT NULL,
	CONSTRAINT "watched_movies_user_id_movie_id_pk" PRIMARY KEY("user_id","movie_id")
);
--> statement-breakpoint
CREATE TABLE "watch_later_movies" (
	"user_id" integer NOT NULL,
	"movie_id" integer NOT NULL,
	CONSTRAINT "watch_later_movies_user_id_movie_id_pk" PRIMARY KEY("user_id","movie_id")
);
--> statement-breakpoint
ALTER TABLE "watched_movies" ADD CONSTRAINT "watched_movies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_movies" ADD CONSTRAINT "watched_movies_movie_id_users_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_later_movies" ADD CONSTRAINT "watch_later_movies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_later_movies" ADD CONSTRAINT "watch_later_movies_movie_id_users_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_watched_movies_user" ON "watched_movies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_watch_later_movies_user" ON "watch_later_movies" USING btree ("user_id");