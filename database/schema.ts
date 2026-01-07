// Drizzle ORM Schema for Daadaar Platform
// PostgreSQL database schema with type-safe table definitions

import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin']);
export const oauthProviderEnum = pgEnum('oauth_provider', ['google', 'github', 'twitter']);
export const voteTypeEnum = pgEnum('vote_type', ['upvote', 'downvote']);
export const banTargetTypeEnum = pgEnum('ban_target_type', ['user', 'session']);
export const banActionEnum = pgEnum('ban_action', ['ban', 'unban']);
export const contentReportReasonEnum = pgEnum('content_report_reason', [
  'spam',
  'misinformation',
  'harassment',
  'inappropriate',
  'duplicate',
  'other',
]);
export const contentReportStatusEnum = pgEnum('content_report_status', [
  'pending',
  'reviewing',
  'resolved',
  'dismissed',
]);
export const reportableContentTypeEnum = pgEnum('reportable_content_type', [
  'report',
  'organization',
  'individual',
  'user',
  'media',
]);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video', 'document', 'audio']);

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export const organizations = pgTable(
  'organizations',
  {
    id: serial('id').primaryKey(),
    shareableUuid: uuid('shareable_uuid').defaultRandom().unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    nameEn: varchar('name_en', { length: 255 }), // English translation
    description: text('description'),
    descriptionEn: text('description_en'), // English translation
    logoUrl: text('logo_url'), // Organization logo URL
    parentId: integer('parent_id'),
    createdByUserId: integer('created_by_user_id'),
    sessionId: uuid('session_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('organizations_name_idx').on(table.name),
    index('organizations_parent_idx').on(table.parentId),
    index('organizations_created_by_idx').on(table.createdByUserId),
    index('organizations_shareable_uuid_idx').on(table.shareableUuid),
  ]
);

// ============================================================================
// ORGANIZATION HIERARCHY
// ============================================================================

export const organizationHierarchy = pgTable(
  'organization_hierarchy',
  {
    parentId: integer('parent_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    childId: integer('child_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    createdByUserId: integer('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    sessionId: uuid('session_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    primaryKey({ columns: [table.parentId, table.childId] }),
    index('org_hierarchy_parent_idx').on(table.parentId),
    index('org_hierarchy_child_idx').on(table.childId),
  ]
);

// ============================================================================
// ROLES (Positions within organizations)
// ============================================================================

export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    titleEn: varchar('title_en', { length: 255 }), // English translation
    description: text('description'),
    descriptionEn: text('description_en'), // English translation
    createdByUserId: integer('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    sessionId: uuid('session_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('roles_organization_idx').on(table.organizationId),
    index('roles_title_idx').on(table.title),
  ]
);

// ============================================================================
// INDIVIDUALS (People who hold roles)
// ============================================================================

export const individuals = pgTable(
  'individuals',
  {
    id: serial('id').primaryKey(),
    shareableUuid: uuid('shareable_uuid').defaultRandom().unique().notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    fullNameEn: varchar('full_name_en', { length: 255 }), // English translation
    biography: text('biography'),
    biographyEn: text('biography_en'), // English translation
    profileImageUrl: text('profile_image_url'),
    dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
    createdByUserId: integer('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    sessionId: uuid('session_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('individuals_name_idx').on(table.fullName),
    index('individuals_name_en_idx').on(table.fullNameEn),
    index('individuals_shareable_uuid_idx').on(table.shareableUuid),
  ]
);

// ============================================================================
// ROLE OCCUPANCY (Timeline of individuals in roles)
// ============================================================================

export const roleOccupancy = pgTable(
  'role_occupancy',
  {
    id: serial('id').primaryKey(),
    individualId: integer('individual_id')
      .references(() => individuals.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: integer('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }), // null = currently in role
    createdByUserId: integer('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    sessionId: uuid('session_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('role_occupancy_individual_idx').on(table.individualId),
    index('role_occupancy_role_idx').on(table.roleId),
    index('role_occupancy_dates_idx').on(table.startDate, table.endDate),
  ]
);

// ============================================================================
// USERS (Registered users - optional, can be anonymous)
// ============================================================================

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    shareableUuid: uuid('shareable_uuid').defaultRandom().unique().notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    username: varchar('username', { length: 50 }).unique().notNull(),
    displayName: varchar('display_name', { length: 100 }),
    profileImageUrl: text('profile_image_url'),
    passwordHash: text('password_hash'), // null for OAuth users
    oauthProvider: oauthProviderEnum('oauth_provider'), // google, github, twitter, etc.
    oauthId: varchar('oauth_id', { length: 255 }),
    role: userRoleEnum('role').default('user').notNull(),
    isBanned: boolean('is_banned').default(false).notNull(),
    bannedAt: timestamp('banned_at', { withTimezone: true }),
    bannedUntil: timestamp('banned_until', { withTimezone: true }), // null = permanent ban
    banReason: text('ban_reason'),
    isVerified: boolean('is_verified').default(false).notNull(),
    verificationToken: varchar('verification_token', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('users_email_idx').on(table.email),
    index('users_username_idx').on(table.username),
    index('users_oauth_idx').on(table.oauthProvider, table.oauthId),
    index('users_role_idx').on(table.role),
    index('users_banned_idx').on(table.isBanned),
    index('users_shareable_uuid_idx').on(table.shareableUuid),
  ]
);

// ============================================================================
// USER TRUST SCORES
// ============================================================================

export const userTrustScores = pgTable(
  'user_trust_scores',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    trustScore: real('trust_score').default(0).notNull(), // 0-100 scale
    highConfidenceReports: integer('high_confidence_reports').default(0).notNull(),
    highlyVotedReports: integer('highly_voted_reports').default(0).notNull(),
    accurateRoleDataCount: integer('accurate_role_data_count').default(0).notNull(),
    contributionMonths: integer('contribution_months').default(0).notNull(),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('trust_scores_user_idx').on(table.userId),
    index('trust_scores_score_idx').on(table.trustScore),
  ]
);

// ============================================================================
// REPORTS (User-submitted reports/claims)
// ============================================================================

export const reports = pgTable(
  'reports',
  {
    id: serial('id').primaryKey(),
    shareableUuid: uuid('shareable_uuid').defaultRandom().unique().notNull(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }), // null for anonymous
    sessionId: uuid('session_id'), // for anonymous submissions
    title: varchar('title', { length: 500 }).notNull(),
    titleEn: varchar('title_en', { length: 500 }), // English translation
    content: text('content').notNull(),
    contentEn: text('content_en'), // English translation
    incidentDate: timestamp('incident_date', { withTimezone: true }),
    incidentLocation: varchar('incident_location', { length: 255 }),
    incidentLocationEn: varchar('incident_location_en', { length: 255 }),
    upvoteCount: integer('upvote_count').default(0).notNull(),
    downvoteCount: integer('downvote_count').default(0).notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('reports_user_idx').on(table.userId),
    index('reports_session_idx').on(table.sessionId),
    index('reports_created_at_idx').on(table.createdAt),
    index('reports_votes_idx').on(table.upvoteCount, table.downvoteCount),
    index('reports_published_idx').on(table.isPublished),
    index('reports_incident_date_idx').on(table.incidentDate),
    index('reports_submitted_by_user_id_idx').on(table.userId),
    index('reports_submitted_by_session_id_idx').on(table.sessionId),
    index('reports_shareable_uuid_idx').on(table.shareableUuid),
  ]
);

// ============================================================================
// REPORT LINKS (Links reports to individuals + roles + time periods)
// ============================================================================

export const reportLinks = pgTable(
  'report_links',
  {
    id: serial('id').primaryKey(),
    reportId: integer('report_id')
      .references(() => reports.id, { onDelete: 'cascade' })
      .notNull(),
    individualId: integer('individual_id')
      .references(() => individuals.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: integer('role_id').references(() => roles.id, { onDelete: 'set null' }),
    startDate: timestamp('start_date', { withTimezone: true }), // Time period context
    endDate: timestamp('end_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('report_links_report_idx').on(table.reportId),
    index('report_links_individual_idx').on(table.individualId),
    index('report_links_role_idx').on(table.roleId),
  ]
);

// ============================================================================
// VOTES (Community votes on reports)
// ============================================================================

export const votes = pgTable(
  'votes',
  {
    id: serial('id').primaryKey(),
    reportId: integer('report_id')
      .references(() => reports.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // null for anonymous
    sessionId: uuid('session_id'), // for anonymous votes
    voteType: voteTypeEnum('vote_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('votes_report_idx').on(table.reportId),
    index('votes_user_idx').on(table.userId),
    index('votes_session_idx').on(table.sessionId),
    // Unique constraints to prevent duplicate votes
    uniqueIndex('votes_user_report_unique').on(table.userId, table.reportId),
    uniqueIndex('votes_session_report_unique').on(table.sessionId, table.reportId),
    // Ensure at least one of userId or sessionId is provided to prevent orphan votes
    // that bypass deduplication (NULL values are distinct in unique indexes)
    check('votes_user_or_session_required', sql`user_id IS NOT NULL OR session_id IS NOT NULL`),
  ]
);

// ============================================================================
// MEDIA (Attached media files for reports)
// ============================================================================

export const media = pgTable(
  'media',
  {
    id: serial('id').primaryKey(),
    reportId: integer('report_id').references(() => reports.id, { onDelete: 'cascade' }),
    s3Key: varchar('s3_key', { length: 500 }).notNull(),
    s3Bucket: varchar('s3_bucket', { length: 255 }).notNull(),
    originalFilename: varchar('original_filename', { length: 500 }),
    mimeType: varchar('mime_type', { length: 100 }),
    mediaType: mediaTypeEnum('media_type').notNull(),
    fileSizeBytes: integer('file_size_bytes'),
    uploadedByUserId: integer('uploaded_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    uploadedBySessionId: uuid('uploaded_by_session_id'),
    isProcessed: boolean('is_processed').default(false).notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('media_report_idx').on(table.reportId),
    index('media_s3_key_idx').on(table.s3Key),
    index('media_type_idx').on(table.mediaType),
    index('media_uploaded_by_user_id_idx').on(table.uploadedByUserId),
    index('media_uploaded_by_session_id_idx').on(table.uploadedBySessionId),
    index('media_is_deleted_idx').on(table.isDeleted),
  ]
);

// ============================================================================
// AI VERIFICATION (AI confidence scores and analysis)
// ============================================================================

export const aiVerification = pgTable(
  'ai_verification',
  {
    id: serial('id').primaryKey(),
    reportId: integer('report_id')
      .references(() => reports.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    confidenceScore: real('confidence_score').notNull(), // 0-100 scale
    analysisJson: text('analysis_json'), // Full AI analysis stored as JSON
    consistencyScore: real('consistency_score'), // Consistency with other reports
    credibilityScore: real('credibility_score'), // Source credibility
    factCheckSummary: text('fact_check_summary'),
    factCheckSummaryEn: text('fact_check_summary_en'),
    flags: text('flags'), // JSON array of warning flags
    modelUsed: varchar('model_used', { length: 100 }), // e.g., "gpt-4"
    processingTimeMs: integer('processing_time_ms'),
    isManualOverride: boolean('is_manual_override').default(false).notNull(),
    overrideByUserId: integer('override_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    overrideReason: text('override_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('ai_verification_report_idx').on(table.reportId),
    index('ai_verification_confidence_idx').on(table.confidenceScore),
  ]
);

// ============================================================================
// BAN HISTORY (Audit log of all ban/unban actions)
// ============================================================================

export const banHistory = pgTable(
  'ban_history',
  {
    id: serial('id').primaryKey(),
    targetType: banTargetTypeEnum('target_type').notNull(),
    targetUserId: integer('target_user_id').references(() => users.id, { onDelete: 'cascade' }),
    targetSessionId: uuid('target_session_id'),
    action: banActionEnum('action').notNull(),
    reason: text('reason'),
    bannedUntil: timestamp('banned_until', { withTimezone: true }), // null = permanent
    bannedByUserId: integer('banned_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('ban_history_target_user_idx').on(table.targetUserId),
    index('ban_history_target_session_idx').on(table.targetSessionId),
    index('ban_history_action_idx').on(table.action),
    index('ban_history_created_at_idx').on(table.createdAt),
  ]
);

// ============================================================================
// CONTENT REPORTS (User reports of content for moderation)
// ============================================================================

export const contentReports = pgTable(
  'content_reports',
  {
    id: serial('id').primaryKey(),
    contentType: reportableContentTypeEnum('content_type').notNull(),
    contentId: integer('content_id').notNull(), // ID of the reported content
    reporterUserId: integer('reporter_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reporterSessionId: uuid('reporter_session_id'),
    reason: contentReportReasonEnum('reason').notNull(),
    description: text('description'),
    status: contentReportStatusEnum('status').default('pending').notNull(),
    reviewedByUserId: integer('reviewed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('content_reports_content_idx').on(table.contentType, table.contentId),
    index('content_reports_reporter_user_idx').on(table.reporterUserId),
    index('content_reports_reporter_session_idx').on(table.reporterSessionId),
    index('content_reports_status_idx').on(table.status),
    index('content_reports_created_at_idx').on(table.createdAt),
  ]
);

// ============================================================================
// PROOF OF WORK CHALLENGES (For rate limiting and abuse prevention)
// ============================================================================

export const powChallenges = pgTable(
  'pow_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id'),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    resource: varchar('resource', { length: 100 }).notNull(), // e.g., "report-submission", "voting"
    difficulty: integer('difficulty').notNull(), // Number of leading zeros required
    nonce: varchar('nonce', { length: 64 }).notNull(),
    isUsed: boolean('is_used').default(false).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('pow_challenges_session_idx').on(table.sessionId),
    index('pow_challenges_user_idx').on(table.userId),
    index('pow_challenges_expires_idx').on(table.expiresAt),
    index('pow_challenges_is_used_idx').on(table.isUsed),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  parent: one(organizations, {
    fields: [organizations.parentId],
    references: [organizations.id],
    relationName: 'parentChild',
  }),
  children: many(organizations, { relationName: 'parentChild' }),
  createdBy: one(users, {
    fields: [organizations.createdByUserId],
    references: [users.id],
  }),
  roles: many(roles),
  hierarchyAsParent: many(organizationHierarchy, { relationName: 'hierarchyParent' }),
  hierarchyAsChild: many(organizationHierarchy, { relationName: 'hierarchyChild' }),
}));

export const organizationHierarchyRelations = relations(organizationHierarchy, ({ one }) => ({
  parent: one(organizations, {
    fields: [organizationHierarchy.parentId],
    references: [organizations.id],
    relationName: 'hierarchyParent',
  }),
  child: one(organizations, {
    fields: [organizationHierarchy.childId],
    references: [organizations.id],
    relationName: 'hierarchyChild',
  }),
  createdBy: one(users, {
    fields: [organizationHierarchy.createdByUserId],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [roles.createdByUserId],
    references: [users.id],
  }),
  occupancies: many(roleOccupancy),
  reportLinks: many(reportLinks),
}));

export const individualsRelations = relations(individuals, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [individuals.createdByUserId],
    references: [users.id],
  }),
  roleOccupancies: many(roleOccupancy),
  reportLinks: many(reportLinks),
}));

export const roleOccupancyRelations = relations(roleOccupancy, ({ one }) => ({
  individual: one(individuals, {
    fields: [roleOccupancy.individualId],
    references: [individuals.id],
  }),
  role: one(roles, {
    fields: [roleOccupancy.roleId],
    references: [roles.id],
  }),
  createdBy: one(users, {
    fields: [roleOccupancy.createdByUserId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  trustScore: one(userTrustScores, {
    fields: [users.id],
    references: [userTrustScores.userId],
  }),
  reports: many(reports),
  votes: many(votes),
  createdOrganizations: many(organizations),
  createdRoles: many(roles),
  createdIndividuals: many(individuals),
  banHistory: many(banHistory, { relationName: 'targetUser' }),
  bansPerformed: many(banHistory, { relationName: 'bannedBy' }),
  contentReportsSubmitted: many(contentReports, { relationName: 'reporter' }),
  contentReportsReviewed: many(contentReports, { relationName: 'reviewer' }),
}));

export const userTrustScoresRelations = relations(userTrustScores, ({ one }) => ({
  user: one(users, {
    fields: [userTrustScores.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  reportLinks: many(reportLinks),
  votes: many(votes),
  media: many(media),
  aiVerification: one(aiVerification, {
    fields: [reports.id],
    references: [aiVerification.reportId],
  }),
}));

export const reportLinksRelations = relations(reportLinks, ({ one }) => ({
  report: one(reports, {
    fields: [reportLinks.reportId],
    references: [reports.id],
  }),
  individual: one(individuals, {
    fields: [reportLinks.individualId],
    references: [individuals.id],
  }),
  role: one(roles, {
    fields: [reportLinks.roleId],
    references: [roles.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  report: one(reports, {
    fields: [votes.reportId],
    references: [reports.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  report: one(reports, {
    fields: [media.reportId],
    references: [reports.id],
  }),
  uploadedByUser: one(users, {
    fields: [media.uploadedByUserId],
    references: [users.id],
  }),
}));

export const aiVerificationRelations = relations(aiVerification, ({ one }) => ({
  report: one(reports, {
    fields: [aiVerification.reportId],
    references: [reports.id],
  }),
  overrideByUser: one(users, {
    fields: [aiVerification.overrideByUserId],
    references: [users.id],
  }),
}));

export const banHistoryRelations = relations(banHistory, ({ one }) => ({
  targetUser: one(users, {
    fields: [banHistory.targetUserId],
    references: [users.id],
    relationName: 'targetUser',
  }),
  bannedBy: one(users, {
    fields: [banHistory.bannedByUserId],
    references: [users.id],
    relationName: 'bannedBy',
  }),
}));

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  reporter: one(users, {
    fields: [contentReports.reporterUserId],
    references: [users.id],
    relationName: 'reporter',
  }),
  reviewer: one(users, {
    fields: [contentReports.reviewedByUserId],
    references: [users.id],
    relationName: 'reviewer',
  }),
}));
