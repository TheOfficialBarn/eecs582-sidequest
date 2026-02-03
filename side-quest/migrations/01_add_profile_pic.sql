
-- Run this in the Supabase SQL Editor

-- 1. Add profile_picture_url to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- 2. (Optional) Add array of unlocked avatars if we want to track ownership
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS unlocked_avatars TEXT[] DEFAULT '{}';
