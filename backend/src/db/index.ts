// Database connection and client for Daadaar Backend
// Uses Drizzle ORM with PostgreSQL

import type { PgDatabase } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
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
let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

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

function getDbInstance(): PostgresJsDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getQueryClient(), { schema });
  }
  return dbInstance;
}

// Create Drizzle ORM instance with schema (lazy) - properly typed
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop: string | symbol) {
    const instance = getDbInstance();
    // biome-ignore lint/suspicious/noExplicitAny: Proxy requires dynamic property access
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

// Export schema for use in queries
export { schema };

// Export types
export type Database = PostgresJsDatabase<typeof schema>;

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
