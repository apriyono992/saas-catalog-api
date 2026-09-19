ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "products_tenant_id_deleted_at_idx" ON "products" USING btree ("tenant_id","deleted_at");