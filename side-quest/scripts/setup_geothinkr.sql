-- Create table for GeoThinkr photos
CREATE TABLE IF NOT EXISTS geothinkr_photos (
    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    x_coordinate INTEGER NOT NULL,
    y_coordinate INTEGER NOT NULL,
    location_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Optional, but good practice. For now publicly readable is fine or admin only write)
ALTER TABLE geothinkr_photos ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access" ON geothinkr_photos FOR SELECT USING (true);

-- Allow write access only to service role (admin) if we had authenticated admin users, but we use service role key in API routes so it bypasses RLS anyway.
