-- ==========================================
-- SUPER MIGRATION SCRIPT (Run this in Supabase SQL Editor)
-- ==========================================

-- 1. Ensure 'users' table has points and profile picture
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- 2. Ensure 'quests' table has multiplayer support
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_multiplayer BOOLEAN DEFAULT FALSE;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES users(user_id);
ALTER TABLE quests ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 100;

-- 3. Create 'geothinkr_photos' table for the new game
CREATE TABLE IF NOT EXISTS geothinkr_photos (
    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    x_coordinate INTEGER NOT NULL,
    y_coordinate INTEGER NOT NULL,
    location_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on GeoThinkr table (public read)
ALTER TABLE geothinkr_photos ENABLE ROW LEVEL SECURITY;
-- Drop policy if exists to avoid error, then recreate
DROP POLICY IF EXISTS "Allow public read access" ON geothinkr_photos;
CREATE POLICY "Allow public read access" ON geothinkr_photos FOR SELECT USING (true);


-- 5. RPC: Atomic Claim for Multiplayer Quests
CREATE OR REPLACE FUNCTION claim_quest(p_quest_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_multiplayer BOOLEAN;
    v_winner_id UUID;
    v_points INTEGER;
BEGIN
    SELECT is_multiplayer, winner_id, reward_points INTO v_is_multiplayer, v_winner_id, v_points
    FROM quests WHERE quest_id = p_quest_id;

    -- If not multiplayer, just return true (allow normal completion)
    IF NOT v_is_multiplayer THEN RETURN TRUE; END IF;
    
    -- If already won, return false
    IF v_winner_id IS NOT NULL THEN RETURN FALSE; END IF;

    -- Atomic update: try to set winner_id where it is null
    UPDATE quests SET winner_id = p_user_id WHERE quest_id = p_quest_id AND winner_id IS NULL;

    IF FOUND THEN
            -- If we won the race, award points immediately
            UPDATE users SET points = points + (v_points) WHERE user_id = p_user_id;
            RETURN TRUE;
    ELSE
            RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- 6. RPC: Increment Points Safely
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET points = points + amount
  WHERE users.user_id = increment_points.user_id;
END;
$$ LANGUAGE plpgsql;
