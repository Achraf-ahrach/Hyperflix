CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"avatar_url" varchar(255),
	"password_hash" varchar(255) NOT NULL,
	"created_at" varchar(50) NOT NULL,
	"updated_at" varchar(50) NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
