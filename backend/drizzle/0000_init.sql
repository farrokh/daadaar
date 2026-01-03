CREATE TYPE "public"."ban_action" AS ENUM('ban', 'unban');--> statement-breakpoint
CREATE TYPE "public"."ban_target_type" AS ENUM('user', 'session');--> statement-breakpoint
CREATE TYPE "public"."content_report_reason" AS ENUM('spam', 'misinformation', 'harassment', 'inappropriate', 'duplicate', 'other');--> statement-breakpoint
CREATE TYPE "public"."content_report_status" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video', 'document', 'audio');--> statement-breakpoint
CREATE TYPE "public"."oauth_provider" AS ENUM('google', 'github', 'twitter');--> statement-breakpoint
CREATE TYPE "public"."reportable_content_type" AS ENUM('report', 'organization', 'individual', 'user', 'media');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('upvote', 'downvote');--> statement-breakpoint
CREATE TABLE "ai_verification" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"confidence_score" real NOT NULL,
	"analysis_json" text,
	"consistency_score" real,
	"credibility_score" real,
	"fact_check_summary" text,
	"fact_check_summary_en" text,
	"flags" text,
	"model_used" varchar(100),
	"processing_time_ms" integer,
	"is_manual_override" boolean DEFAULT false NOT NULL,
	"override_by_user_id" integer,
	"override_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_verification_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "ban_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" "ban_target_type" NOT NULL,
	"target_user_id" integer,
	"target_session_id" uuid,
	"action" "ban_action" NOT NULL,
	"reason" text,
	"banned_until" timestamp with time zone,
	"banned_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_type" "reportable_content_type" NOT NULL,
	"content_id" integer NOT NULL,
	"reporter_user_id" integer,
	"reporter_session_id" uuid,
	"reason" "content_report_reason" NOT NULL,
	"description" text,
	"status" "content_report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_user_id" integer,
	"reviewed_at" timestamp with time zone,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "individuals" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"full_name_en" varchar(255),
	"biography" text,
	"biography_en" text,
	"profile_image_url" text,
	"date_of_birth" timestamp with time zone,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"s3_bucket" varchar(255) NOT NULL,
	"original_filename" varchar(500),
	"mime_type" varchar(100),
	"media_type" "media_type" NOT NULL,
	"file_size_bytes" integer,
	"uploaded_by_user_id" integer,
	"uploaded_by_session_id" uuid,
	"is_processed" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_hierarchy" (
	"parent_id" integer NOT NULL,
	"child_id" integer NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_hierarchy_parent_id_child_id_pk" PRIMARY KEY("parent_id","child_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_en" varchar(255),
	"description" text,
	"description_en" text,
	"parent_id" integer,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pow_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"user_id" integer,
	"resource" varchar(100) NOT NULL,
	"difficulty" integer NOT NULL,
	"nonce" varchar(64) NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"individual_id" integer NOT NULL,
	"role_id" integer,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"session_id" uuid,
	"title" varchar(500) NOT NULL,
	"title_en" varchar(500),
	"content" text NOT NULL,
	"content_en" text,
	"incident_date" timestamp with time zone,
	"incident_location" varchar(255),
	"incident_location_en" varchar(255),
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"downvote_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_occupancy" (
	"id" serial PRIMARY KEY NOT NULL,
	"individual_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"title_en" varchar(255),
	"description" text,
	"description_en" text,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_trust_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"trust_score" real DEFAULT 0 NOT NULL,
	"high_confidence_reports" integer DEFAULT 0 NOT NULL,
	"highly_voted_reports" integer DEFAULT 0 NOT NULL,
	"accurate_role_data_count" integer DEFAULT 0 NOT NULL,
	"contribution_months" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_trust_scores_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(100),
	"profile_image_url" text,
	"password_hash" text,
	"oauth_provider" "oauth_provider",
	"oauth_id" varchar(255),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp with time zone,
	"banned_until" timestamp with time zone,
	"ban_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"user_id" integer,
	"session_id" uuid,
	"vote_type" "vote_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_verification" ADD CONSTRAINT "ai_verification_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_verification" ADD CONSTRAINT "ai_verification_override_by_user_id_users_id_fk" FOREIGN KEY ("override_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ban_history" ADD CONSTRAINT "ban_history_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ban_history" ADD CONSTRAINT "ban_history_banned_by_user_id_users_id_fk" FOREIGN KEY ("banned_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individuals" ADD CONSTRAINT "individuals_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_hierarchy" ADD CONSTRAINT "organization_hierarchy_parent_id_organizations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_hierarchy" ADD CONSTRAINT "organization_hierarchy_child_id_organizations_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_hierarchy" ADD CONSTRAINT "organization_hierarchy_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pow_challenges" ADD CONSTRAINT "pow_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_individual_id_individuals_id_fk" FOREIGN KEY ("individual_id") REFERENCES "public"."individuals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_occupancy" ADD CONSTRAINT "role_occupancy_individual_id_individuals_id_fk" FOREIGN KEY ("individual_id") REFERENCES "public"."individuals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_occupancy" ADD CONSTRAINT "role_occupancy_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_occupancy" ADD CONSTRAINT "role_occupancy_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_trust_scores" ADD CONSTRAINT "user_trust_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_verification_report_idx" ON "ai_verification" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "ai_verification_confidence_idx" ON "ai_verification" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX "ban_history_target_user_idx" ON "ban_history" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "ban_history_target_session_idx" ON "ban_history" USING btree ("target_session_id");--> statement-breakpoint
CREATE INDEX "ban_history_action_idx" ON "ban_history" USING btree ("action");--> statement-breakpoint
CREATE INDEX "ban_history_created_at_idx" ON "ban_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "content_reports_content_idx" ON "content_reports" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "content_reports_reporter_user_idx" ON "content_reports" USING btree ("reporter_user_id");--> statement-breakpoint
CREATE INDEX "content_reports_reporter_session_idx" ON "content_reports" USING btree ("reporter_session_id");--> statement-breakpoint
CREATE INDEX "content_reports_status_idx" ON "content_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_reports_created_at_idx" ON "content_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "individuals_name_idx" ON "individuals" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "individuals_name_en_idx" ON "individuals" USING btree ("full_name_en");--> statement-breakpoint
CREATE INDEX "media_report_idx" ON "media" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "media_s3_key_idx" ON "media" USING btree ("s3_key");--> statement-breakpoint
CREATE INDEX "media_type_idx" ON "media" USING btree ("media_type");--> statement-breakpoint
CREATE INDEX "org_hierarchy_parent_idx" ON "organization_hierarchy" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "org_hierarchy_child_idx" ON "organization_hierarchy" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "organizations_name_idx" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "organizations_parent_idx" ON "organizations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "organizations_created_by_idx" ON "organizations" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "pow_challenges_session_idx" ON "pow_challenges" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "pow_challenges_user_idx" ON "pow_challenges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pow_challenges_expires_idx" ON "pow_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "report_links_report_idx" ON "report_links" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_links_individual_idx" ON "report_links" USING btree ("individual_id");--> statement-breakpoint
CREATE INDEX "report_links_role_idx" ON "report_links" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "reports_user_idx" ON "reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reports_session_idx" ON "reports" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reports_votes_idx" ON "reports" USING btree ("upvote_count","downvote_count");--> statement-breakpoint
CREATE INDEX "reports_published_idx" ON "reports" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "role_occupancy_individual_idx" ON "role_occupancy" USING btree ("individual_id");--> statement-breakpoint
CREATE INDEX "role_occupancy_role_idx" ON "role_occupancy" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_occupancy_dates_idx" ON "role_occupancy" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "roles_organization_idx" ON "roles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "roles_title_idx" ON "roles" USING btree ("title");--> statement-breakpoint
CREATE INDEX "trust_scores_user_idx" ON "user_trust_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trust_scores_score_idx" ON "user_trust_scores" USING btree ("trust_score");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_oauth_idx" ON "users" USING btree ("oauth_provider","oauth_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_banned_idx" ON "users" USING btree ("is_banned");--> statement-breakpoint
CREATE INDEX "votes_report_idx" ON "votes" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "votes_user_idx" ON "votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "votes_session_idx" ON "votes" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_user_report_unique" ON "votes" USING btree ("user_id","report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_session_report_unique" ON "votes" USING btree ("session_id","report_id");