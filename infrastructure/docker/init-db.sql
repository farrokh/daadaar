-- PostgreSQL initialization script for Daadaar
-- This runs automatically when the container is first created

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Grant permissions (the daadaar user is created automatically by POSTGRES_USER env var)
-- Additional setup can be added here if needed

-- Log that initialization is complete
DO $$
BEGIN
  RAISE NOTICE 'Daadaar database initialized successfully!';
END $$;

