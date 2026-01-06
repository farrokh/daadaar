#!/usr/bin/env bun

import { closeDatabaseConnection, db, schema } from './index';

async function cleanupUsers() {
  try {
    console.log('👥 Fetching users...');
    const users = await db.select().from(schema.users);
    
    if (users.length === 0) {
      console.log('✅ No users found in database');
      return;
    }

    console.log(`📋 Found ${users.length} user(s). Deleting...`);
    
    // Cascading deletes should handle related records (reports, bans, etc.) 
    // if constraints are set up correctly. Otherwise we might need explicit deletes.
    await db.delete(schema.users);
    
    console.log(`✅ Deleted ${users.length} user(s)`);
    
  } catch (error) {
    console.error('❌ Failed to cleanup users:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
}

cleanupUsers();
