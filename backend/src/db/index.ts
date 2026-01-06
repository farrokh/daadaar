// Database connection and client for Daadaar Backend
// Uses Drizzle ORM with PostgreSQL

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../database/schema';

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL environment variable is not set. Database operations will fail.');
}

// Create PostgreSQL connection
// For production, use connection pooling
const connectionString = DATABASE_URL || 'postgresql://localhost:5432/daadaar';

// Lazy initialization - don't connect until first query
let queryClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = postgres(connectionString, {
      max: 10, // Maximum number of connections in the pool
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout in seconds
    });
  }
  return queryClient;
}

// Create Drizzle ORM instance with schema (lazy)
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = drizzle(getQueryClient(), { schema });
    }
    return (dbInstance as any)[prop];
  },
});

// Export schema for use in queries
export { schema };

// Export types
export type Database = typeof db;

// Health check function for database connection
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();
  try {
    // Simple query to test connection
    const client = getQueryClient();
    await client`SELECT 1`;
    const latencyMs = Date.now() - startTime;
    return { connected: true, latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs,
    };
  }
}

// Graceful shutdown function
export async function closeDatabaseConnection(): Promise<void> {
  if (queryClient) {
    await queryClient.end();
    console.log('🔌 Database connection closed');
  }
}
