CREATE TABLE "marketplaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"icon_url" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "default_strike_percentage" varchar(10) DEFAULT '35';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "strike_price" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "marketplace_links" ADD COLUMN "marketplace_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "marketplaces_slug_unique" ON "marketplaces" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "marketplace_links" ADD CONSTRAINT "marketplace_links_marketplace_id_marketplaces_id_fk" FOREIGN KEY ("marketplace_id") REFERENCES "public"."marketplaces"("id") ON DELETE set null ON UPDATE no action;