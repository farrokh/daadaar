#!/usr/bin/env bun

import { eq } from 'drizzle-orm';
import { closeDatabaseConnection, db, schema } from '../backend/src/db';
import { iranianGovernmentOrganizations } from '../database/seed-data/iranian-government-organizations';

type OrganizationRecord = typeof schema.organizations.$inferInsert;

async function seedOrganizations(): Promise<void> {
  const idByKey = new Map<string, number>();
  let created = 0;
  let updated = 0;

  for (const organization of iranianGovernmentOrganizations) {
    const parentId = organization.parentKey
      ? idByKey.get(organization.parentKey) ?? null
      : null;

    if (organization.parentKey && parentId === null) {
      throw new Error(`Parent ${organization.parentKey} not processed before ${organization.key}`);
    }

    const existing = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.nameEn, organization.nameEn))
      .limit(1);

    const payload: OrganizationRecord = {
      name: organization.name,
      nameEn: organization.nameEn,
      description: organization.description,
      descriptionEn: organization.descriptionEn,
      logoUrl: organization.logoUrl ?? null,
      parentId,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(schema.organizations)
        .set(payload)
        .where(eq(schema.organizations.id, existing[0].id));
      idByKey.set(organization.key, existing[0].id);
      updated += 1;
      console.log(`↻ Updated organization: ${organization.nameEn}`);
      continue;
    }

    const [inserted] = await db
      .insert(schema.organizations)
      .values(payload)
      .returning({ id: schema.organizations.id });

    if (!inserted) {
      throw new Error(`Failed to insert organization ${organization.nameEn}`);
    }

    idByKey.set(organization.key, inserted.id);
    created += 1;
    console.log(`✅ Created organization: ${organization.nameEn}`);
  }

  console.log(`\nSeeding complete. Created: ${created}, Updated: ${updated}`);
}

async function main() {
  try {
    console.log('🌱 Seeding Iranian government organizations...');
    await seedOrganizations();
  } catch (error) {
    console.error('❌ Failed to seed organizations:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
}

main();
