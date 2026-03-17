CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" varchar(20) DEFAULT 'doctor' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "notified_top_10" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "notified_top_20" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "attended_at" timestamp;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "email" varchar(255);