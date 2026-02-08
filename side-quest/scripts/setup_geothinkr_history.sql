-- Create table for GeoThinkr history
CREATE TABLE IF NOT EXISTS geothinkr_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES geothinkr_photos(photo_id) ON DELETE CASCADE,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, photo_id) -- Only one attempt per photo per user
);

-- Enable RLS
ALTER TABLE geothinkr_history ENABLE ROW LEVEL SECURITY;
-- Create policy to allow users to read their own history
DROP POLICY IF EXISTS "Users can read own history" ON geothinkr_history;
CREATE POLICY "Users can read own history" ON geothinkr_history FOR SELECT USING (true);
