ALTER TABLE "individuals" ADD COLUMN "shareable_uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "shareable_uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "shareable_uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shareable_uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
CREATE INDEX "individuals_shareable_uuid_idx" ON "individuals" USING btree ("shareable_uuid");--> statement-breakpoint
CREATE INDEX "organizations_shareable_uuid_idx" ON "organizations" USING btree ("shareable_uuid");--> statement-breakpoint
CREATE INDEX "reports_shareable_uuid_idx" ON "reports" USING btree ("shareable_uuid");--> statement-breakpoint
CREATE INDEX "users_shareable_uuid_idx" ON "users" USING btree ("shareable_uuid");--> statement-breakpoint
ALTER TABLE "individuals" ADD CONSTRAINT "individuals_shareable_uuid_unique" UNIQUE("shareable_uuid");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_shareable_uuid_unique" UNIQUE("shareable_uuid");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_shareable_uuid_unique" UNIQUE("shareable_uuid");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_shareable_uuid_unique" UNIQUE("shareable_uuid");