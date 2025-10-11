-- Initialize database for admin service
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database user if not exists (already handled by POSTGRES_USER env var)
-- The database and user are automatically created by the postgres Docker image

-- Set timezone
SET timezone = 'UTC';

-- Any additional database setup can go here
-- For example, creating additional schemas, setting up permissions, etc.

COMMENT ON DATABASE admin_service_db IS 'Admin Service Database for user management and OAuth2';