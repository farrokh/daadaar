ALTER TABLE "individuals" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_hierarchy" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "role_occupancy" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "session_id" uuid;--> statement-breakpoint
CREATE INDEX "media_uploaded_by_user_id_idx" ON "media" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "media_uploaded_by_session_id_idx" ON "media" USING btree ("uploaded_by_session_id");--> statement-breakpoint
CREATE INDEX "media_is_deleted_idx" ON "media" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "pow_challenges_is_used_idx" ON "pow_challenges" USING btree ("is_used");--> statement-breakpoint
CREATE INDEX "reports_incident_date_idx" ON "reports" USING btree ("incident_date");--> statement-breakpoint
CREATE INDEX "reports_submitted_by_user_id_idx" ON "reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reports_submitted_by_session_id_idx" ON "reports" USING btree ("session_id");