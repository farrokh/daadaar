#!/usr/bin/env bun

import { and, eq } from 'drizzle-orm';
import { iranianGovernmentOrganizations } from '../../../database/seed-data/iranian-government-organizations';
import { closeDatabaseConnection, db, schema } from './index';

type OrganizationRecord = typeof schema.organizations.$inferInsert;

async function seedOrganizations(): Promise<void> {
  const idByKey = new Map<string, number>();
  let created = 0;
  let updated = 0;
  let edgesCreated = 0;

  if (process.env.CLEAN === 'true') {
    console.log('🧹 Cleaning existing organizations...');
    await db.delete(schema.organizationHierarchy);
    await db.delete(schema.organizations);
    console.log('✅ Organizations cleaned.');
  }

  for (const organization of iranianGovernmentOrganizations) {
    const parentId = organization.parentKey ? (idByKey.get(organization.parentKey) ?? null) : null;

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

    let currentId: number;

    if (existing.length > 0) {
      currentId = existing[0].id;
      await db
        .update(schema.organizations)
        .set(payload)
        .where(eq(schema.organizations.id, currentId));
      idByKey.set(organization.key, currentId);
      updated += 1;
      console.log(`↻ Updated organization: ${organization.nameEn}`);
    } else {
      const [inserted] = await db
        .insert(schema.organizations)
        .values(payload)
        .returning({ id: schema.organizations.id });

      if (!inserted) {
        throw new Error(`Failed to insert organization ${organization.nameEn}`);
      }

      currentId = inserted.id;
      idByKey.set(organization.key, currentId);
      created += 1;
      console.log(`✅ Created organization: ${organization.nameEn}`);
    }

    // Handle Hierarchy Edge
    if (parentId !== null) {
      const existingEdge = await db
        .select()
        .from(schema.organizationHierarchy)
        .where(
          and(
            eq(schema.organizationHierarchy.parentId, parentId),
            eq(schema.organizationHierarchy.childId, currentId)
          )
        )
        .limit(1);

      if (existingEdge.length === 0) {
        await db.insert(schema.organizationHierarchy).values({
          parentId,
          childId: currentId,
        });
        edgesCreated += 1;
        console.log(`   └─ 🔗 Created edge: ${organization.parentKey} -> ${organization.key}`);
      }
    }
  }

  console.log(
    `\nSeeding complete. Created: ${created}, Updated: ${updated}, Edges: ${edgesCreated}`
  );
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
