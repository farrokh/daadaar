#!/usr/bin/env bun

import { and, desc, eq, or, sql } from 'drizzle-orm';
import { closeDatabaseConnection, db, schema } from './index';

const DEFAULT_MEMBER_ROLE_TITLE = 'Member';
const DEFAULT_MEMBER_ROLE_DESCRIPTION = 'Default role for organization members';

const parseOptionalNumber = (value: string | undefined, label: string) => {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be a valid number`);
  }
  return parsed;
};

const getOrCreateDefaultRoleId = async ({
  organizationId,
  createdByUserId,
  sessionId,
}: {
  organizationId: number;
  createdByUserId: number | null;
  sessionId: string | null;
}) => {
  const [existingRole] = await db
    .select({ id: schema.roles.id })
    .from(schema.roles)
    .where(
      and(
        eq(schema.roles.organizationId, organizationId),
        or(
          eq(schema.roles.title, DEFAULT_MEMBER_ROLE_TITLE),
          eq(schema.roles.titleEn, DEFAULT_MEMBER_ROLE_TITLE)
        )
      )
    )
    .limit(1);

  if (existingRole) {
    return existingRole.id;
  }

  const [createdRole] = await db
    .insert(schema.roles)
    .values({
      organizationId,
      title: DEFAULT_MEMBER_ROLE_TITLE,
      titleEn: DEFAULT_MEMBER_ROLE_TITLE,
      description: DEFAULT_MEMBER_ROLE_DESCRIPTION,
      descriptionEn: DEFAULT_MEMBER_ROLE_DESCRIPTION,
      createdByUserId,
      sessionId,
    })
    .returning({ id: schema.roles.id });

  if (!createdRole) {
    throw new Error('Failed to create default role');
  }

  return createdRole.id;
};

async function resolveOrganizationId(): Promise<number> {
  const organizationIdEnv = parseOptionalNumber(process.env.ORGANIZATION_ID, 'ORGANIZATION_ID');
  const organizationNameEnv = process.env.ORGANIZATION_NAME?.trim();

  if (organizationIdEnv) {
    const [organization] = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, organizationIdEnv))
      .limit(1);

    if (!organization) {
      throw new Error(`Organization not found for ID ${organizationIdEnv}`);
    }

    return organizationIdEnv;
  }

  if (organizationNameEnv) {
    const organizations = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
      })
      .from(schema.organizations)
      .where(
        or(
          eq(schema.organizations.name, organizationNameEnv),
          eq(schema.organizations.nameEn, organizationNameEnv)
        )
      )
      .limit(2);

    if (organizations.length === 0) {
      throw new Error(`Organization not found for name "${organizationNameEnv}"`);
    }

    if (organizations.length > 1) {
      throw new Error(
        `Multiple organizations matched "${organizationNameEnv}". Use ORGANIZATION_ID instead.`
      );
    }

    return organizations[0].id;
  }

  throw new Error('ORGANIZATION_ID or ORGANIZATION_NAME is required to assign the role.');
}

async function resolveTargetIndividual() {
  const individualIdEnv = parseOptionalNumber(process.env.INDIVIDUAL_ID, 'INDIVIDUAL_ID');

  if (individualIdEnv) {
    const [individual] = await db
      .select({
        id: schema.individuals.id,
        fullName: schema.individuals.fullName,
        createdAt: schema.individuals.createdAt,
        createdByUserId: schema.individuals.createdByUserId,
        sessionId: schema.individuals.sessionId,
      })
      .from(schema.individuals)
      .where(eq(schema.individuals.id, individualIdEnv))
      .limit(1);

    if (!individual) {
      throw new Error(`Individual not found for ID ${individualIdEnv}`);
    }

    const [existingRole] = await db
      .select({ id: schema.roleOccupancy.id })
      .from(schema.roleOccupancy)
      .where(eq(schema.roleOccupancy.individualId, individualIdEnv))
      .limit(1);

    if (existingRole) {
      console.log(`✅ Individual ${individualIdEnv} already has a role occupancy.`);
      return null;
    }

    return individual;
  }

  const [individual] = await db
    .select({
      id: schema.individuals.id,
      fullName: schema.individuals.fullName,
      createdAt: schema.individuals.createdAt,
      createdByUserId: schema.individuals.createdByUserId,
      sessionId: schema.individuals.sessionId,
    })
    .from(schema.individuals)
    .where(
      sql`NOT EXISTS (
        SELECT 1 FROM ${schema.roleOccupancy}
        WHERE ${schema.roleOccupancy.individualId} = ${schema.individuals.id}
      )`
    )
    .orderBy(desc(schema.individuals.createdAt))
    .limit(1);

  if (!individual) {
    console.log('✅ No individuals found without role occupancy.');
    return null;
  }

  return individual;
}

async function backfillLatestIndividualRole() {
  try {
    const individual = await resolveTargetIndividual();
    if (!individual) {
      return;
    }

    const organizationId = await resolveOrganizationId();
    const roleId = await getOrCreateDefaultRoleId({
      organizationId,
      createdByUserId: individual.createdByUserId,
      sessionId: individual.sessionId,
    });

    await db.insert(schema.roleOccupancy).values({
      individualId: individual.id,
      roleId,
      startDate: new Date(),
      endDate: null,
      createdByUserId: individual.createdByUserId,
      sessionId: individual.sessionId,
    });

    console.log(
      `✅ Added default Member role for individual ${individual.id} (${individual.fullName}) in org ${organizationId}.`
    );
  } catch (error) {
    console.error('❌ Failed to backfill individual role:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
}

backfillLatestIndividualRole();
