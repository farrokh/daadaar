#!/usr/bin/env bun
/**
 * Check all individuals and their role occupancies in PRODUCTION
 * This script is meant to be run via CodeBuild against production database
 * Usage: bun run scripts/prod-check-individual-roles.ts
 */

import { eq } from 'drizzle-orm';
import { db, schema } from '../src/db';

async function checkAllIndividuals() {
  console.log('='.repeat(80));
  console.log('PRODUCTION DATABASE: Checking individuals and role occupancies');
  console.log('='.repeat(80));
  console.log();

  // Get all individuals
  const individuals = await db
    .select({
      id: schema.individuals.id,
      fullName: schema.individuals.fullName,
      fullNameEn: schema.individuals.fullNameEn,
      createdAt: schema.individuals.createdAt,
    })
    .from(schema.individuals)
    .orderBy(schema.individuals.id);

  console.log(`📊 Total individuals: ${individuals.length}\n`);

  for (const individual of individuals) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Individual: ${individual.fullName}`);
    console.log(`ID: ${individual.id}`);
    console.log(`English Name: ${individual.fullNameEn || 'N/A'}`);
    console.log(`Created: ${individual.createdAt}`);
    console.log('-'.repeat(80));

    // Get role occupancies
    const roleOccupancies = await db
      .select({
        id: schema.roleOccupancy.id,
        roleId: schema.roleOccupancy.roleId,
        roleTitle: schema.roles.title,
        roleTitleEn: schema.roles.titleEn,
        organizationId: schema.roles.organizationId,
        organizationName: schema.organizations.name,
        organizationNameEn: schema.organizations.nameEn,
        startDate: schema.roleOccupancy.startDate,
        endDate: schema.roleOccupancy.endDate,
      })
      .from(schema.roleOccupancy)
      .innerJoin(schema.roles, eq(schema.roleOccupancy.roleId, schema.roles.id))
      .innerJoin(schema.organizations, eq(schema.roles.organizationId, schema.organizations.id))
      .where(eq(schema.roleOccupancy.individualId, individual.id))
      .orderBy(schema.roleOccupancy.startDate);

    if (roleOccupancies.length === 0) {
      console.log('❌ NO ROLE OCCUPANCIES FOUND - This individual has no organization connection!');
    } else {
      console.log(`✅ Role Occupancies: ${roleOccupancies.length}`);
      for (const ro of roleOccupancies) {
        console.log(`\n  Role Occupancy ID: ${ro.id}`);
        console.log(`  ├─ Role: ${ro.roleTitle} (${ro.roleTitleEn || 'no EN'})`);
        console.log(`  ├─ Role ID: ${ro.roleId}`);
        console.log(`  ├─ Organization: ${ro.organizationName} (${ro.organizationNameEn || 'no EN'})`);
        console.log(`  ├─ Organization ID: ${ro.organizationId}`);
        console.log(`  ├─ Start Date: ${ro.startDate}`);
        console.log(`  └─ End Date: ${ro.endDate || 'ongoing (null)'}`);
      }
    }
  }

  // Also check all organizations
  console.log('\n\n' + '='.repeat(80));
  console.log('ALL ORGANIZATIONS');
  console.log('='.repeat(80));
  const organizations = await db
    .select({
      id: schema.organizations.id,
      name: schema.organizations.name,
      nameEn: schema.organizations.nameEn,
    })
    .from(schema.organizations)
    .orderBy(schema.organizations.id);

  for (const org of organizations) {
    console.log(`${org.id}: ${org.name} (${org.nameEn || 'no English name'})`);
  }

  // Check all roles
  console.log('\n\n' + '='.repeat(80));
  console.log('ALL ROLES');
  console.log('='.repeat(80));
  const roles = await db
    .select({
      id: schema.roles.id,
      title: schema.roles.title,
      titleEn: schema.roles.titleEn,
      organizationId: schema.roles.organizationId,
      organizationName: schema.organizations.name,
    })
    .from(schema.roles)
    .innerJoin(schema.organizations, eq(schema.roles.organizationId, schema.organizations.id))
    .orderBy(schema.roles.id);

  for (const role of roles) {
    console.log(`${role.id}: ${role.title} (${role.titleEn || 'no EN'}) - Org: ${role.organizationName} (ID: ${role.organizationId})`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80));
  process.exit(0);
}

checkAllIndividuals().catch(err => {
  console.error('❌ ERROR:', err);
  process.exit(1);
});
