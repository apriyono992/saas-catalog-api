ALTER TABLE "store_settings" ADD COLUMN "storage_driver" varchar(20) DEFAULT 'local';--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "s3_endpoint" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "s3_region" varchar(50) DEFAULT 'auto';--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "s3_bucket" varchar(255);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "s3_access_key_id" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "s3_secret_access_key" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "s3_public_url_base" text;