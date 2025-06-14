-- Verify the users table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'users';

-- Check if we have users with hashed passwords
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN hashed_password IS NOT NULL THEN 1 END) as users_with_hashed_password,
    COUNT(CASE WHEN password IS NOT NULL THEN 1 END) as users_with_plain_password
FROM 
    users;

-- If needed, update existing users to move passwords to hashed_password
-- This is a one-time migration for existing users
UPDATE users 
SET 
    hashed_password = password,
    password = NULL 
WHERE 
    password IS NOT NULL 
    AND hashed_password IS NULL
    AND password LIKE '$2a$%'; -- Only update if password is already hashed
