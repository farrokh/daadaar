#!/usr/bin/env bun

import { and, eq, or } from 'drizzle-orm';
import { closeDatabaseConnection, db, schema } from './index';

const DEFAULT_MEMBER_ROLE_TITLE = 'Member';
const DEFAULT_MEMBER_ROLE_DESCRIPTION = 'Default role for organization members';

const DRY_RUN = process.env.DRY_RUN === 'true';

async function backfillMemberRoles() {
  try {
    const organizations = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations);

    if (organizations.length === 0) {
      console.log('✅ No organizations found.');
      return;
    }

    const existingRoles = await db
      .select({
        id: schema.roles.id,
        organizationId: schema.roles.organizationId,
      })
      .from(schema.roles)
      .where(
        or(
          eq(schema.roles.title, DEFAULT_MEMBER_ROLE_TITLE),
          eq(schema.roles.titleEn, DEFAULT_MEMBER_ROLE_TITLE)
        )
      );

    const orgsWithMemberRole = new Set(existingRoles.map(role => role.organizationId));
    const missingOrgIds = organizations
      .map(org => org.id)
      .filter(orgId => !orgsWithMemberRole.has(orgId));

    if (missingOrgIds.length === 0) {
      console.log('✅ All organizations already have a Member role.');
      return;
    }

    console.log(`🔎 Found ${missingOrgIds.length} org(s) missing a Member role.`);

    if (DRY_RUN) {
      console.log('🧪 DRY_RUN=true; skipping inserts.');
      return;
    }

    const insertedRoles = await db
      .insert(schema.roles)
      .values(
        missingOrgIds.map(organizationId => ({
          organizationId,
          title: DEFAULT_MEMBER_ROLE_TITLE,
          titleEn: DEFAULT_MEMBER_ROLE_TITLE,
          description: DEFAULT_MEMBER_ROLE_DESCRIPTION,
          descriptionEn: DEFAULT_MEMBER_ROLE_DESCRIPTION,
          createdByUserId: null,
          sessionId: null,
        }))
      )
      .returning({ id: schema.roles.id, organizationId: schema.roles.organizationId });

    console.log(`✅ Created ${insertedRoles.length} Member role(s).`);
  } catch (error) {
    console.error('❌ Failed to backfill member roles:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
}

backfillMemberRoles();
