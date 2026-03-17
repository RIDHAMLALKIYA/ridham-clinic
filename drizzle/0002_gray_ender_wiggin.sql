ALTER TABLE "appointments" ADD COLUMN "notified_top10" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "notified_top20" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "notified_top_10";--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "notified_top_20";