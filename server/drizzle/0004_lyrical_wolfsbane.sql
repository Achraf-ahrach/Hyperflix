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
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_reply_to_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "parent_id" bigint;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "user_mail_tokens" ADD CONSTRAINT "user_mail_tokens_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_media" ADD CONSTRAINT "comment_media_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comment_likes_comment_id" ON "comment_likes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_comment_likes_user_id" ON "comment_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_comment_media_comment_id" ON "comment_media" USING btree ("comment_id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comments_parent_id" ON "comments" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "comments" DROP COLUMN "user_reply_to_id";