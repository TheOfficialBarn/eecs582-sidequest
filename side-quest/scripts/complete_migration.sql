-- 1. Add 'points' to 'users' table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 2. Add 'profile_picture_url' to 'users' table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- 3. Add Multiplayer columns to 'quests' table
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_multiplayer BOOLEAN DEFAULT FALSE;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES users(user_id);
ALTER TABLE quests ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 100;

-- 4. Create RPC function for claiming multiplayer quests
CREATE OR REPLACE FUNCTION claim_quest(p_quest_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_multiplayer BOOLEAN;
    v_winner_id UUID;
    v_points INTEGER;
BEGIN
    SELECT is_multiplayer, winner_id, reward_points INTO v_is_multiplayer, v_winner_id, v_points
    FROM quests WHERE quest_id = p_quest_id;

    IF NOT v_is_multiplayer THEN RETURN TRUE; END IF;
    IF v_winner_id IS NOT NULL THEN RETURN FALSE; END IF;

    UPDATE quests SET winner_id = p_user_id WHERE quest_id = p_quest_id AND winner_id IS NULL;

    IF FOUND THEN
            UPDATE users SET points = points + (v_points) WHERE user_id = p_user_id;
            RETURN TRUE;
    ELSE
            RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Create RPC function for incrementing points (safe concurrency)
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET points = points + amount
  WHERE users.user_id = increment_points.user_id;
END;
$$ LANGUAGE plpgsql;
