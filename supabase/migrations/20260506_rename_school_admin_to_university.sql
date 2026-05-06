-- Rename role: school_admin → university
-- Migration: 20260506_rename_school_admin_to_university

-- 1. Backfill any existing rows with the old role value
UPDATE app_users
SET primary_role = 'university'
WHERE primary_role = 'school_admin';

-- 2. Drop the old check constraint
ALTER TABLE app_users
DROP CONSTRAINT app_users_primary_role_check;

-- 3. Add the updated check constraint (same name)
ALTER TABLE app_users
ADD CONSTRAINT app_users_primary_role_check
CHECK (primary_role IN ('student', 'professor', 'university', 'admin'));
