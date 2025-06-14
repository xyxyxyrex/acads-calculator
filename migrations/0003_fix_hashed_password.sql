-- Drop the old index if it exists
DROP INDEX IF EXISTS "users_hashed_password_idx";

-- Make sure the column exists and has the correct type
ALTER TABLE "users" 
  ALTER COLUMN "hashed_password" TYPE text,
  ALTER COLUMN "hashed_password" DROP NOT NULL,
  ALTER COLUMN "hashed_password" DROP DEFAULT;

-- Create an index on hashed_password for faster lookups
CREATE INDEX IF NOT EXISTS "users_hashed_password_idx" ON "users" ("hashed_password");

-- Verify the table structure
COMMENT ON TABLE "users" IS 'Stores user authentication data';
COMMENT ON COLUMN "users"."hashed_password" IS 'BCrypt hashed password';

-- Update existing users to ensure they have a hashed password if they have a password
UPDATE "users" 
SET "hashed_password" = "password" 
WHERE "password" IS NOT NULL AND "hashed_password" IS NULL;

-- Set password to NULL for users with hashed passwords
UPDATE "users" 
SET "password" = NULL 
WHERE "hashed_password" IS NOT NULL;
