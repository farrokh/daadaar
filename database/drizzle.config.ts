// Drizzle Kit Configuration for Daadaar Platform
// Used for generating and running migrations

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema.ts',
  out: '../backend/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/daadaar',
  },
  verbose: true,
  strict: true,
});
