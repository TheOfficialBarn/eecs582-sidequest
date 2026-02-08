
const { Client } = require('pg');

const PASSWORD = process.env.DB_PASSWORD;
if (!PASSWORD) {
	console.error("Please provide DB_PASSWORD environment variable");
	process.exit(1);
}

const PROJECT_REF = 'flplzmlzfuzqofjtykqy';
const CONNECTION_STRING = `postgres://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

async function runMigration() {
	console.log("Connecting to database...");
	const client = new Client({
		connectionString: CONNECTION_STRING,
		ssl: { rejectUnauthorized: false }
	});

	try {
		await client.connect();

		console.log("Running comprehensive migration...");

		// 1. Ensure users have points
		await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;`);
		await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;`);
		console.log("SUCCESS: User columns checked.");

		// 2. GeoThinkr Table
		console.log("Running GeoThinkr migration...");

		// Create table
		await client.query(`
            CREATE TABLE IF NOT EXISTS geothinkr_photos (
                photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                image_url TEXT NOT NULL,
                x_coordinate INTEGER NOT NULL,
                y_coordinate INTEGER NOT NULL,
                location_name TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
		console.log("SUCCESS: Created geothinkr_photos table.");

		// Enable RLS
		await client.query(`ALTER TABLE geothinkr_photos ENABLE ROW LEVEL SECURITY;`);

		// Policy
		// Note: Creating policy might fail if it exists, so usually safer to drop if exists or ignore error.
		// Or check existence. For simplicity, just try-catch or use IF NOT EXISTS logic if PG supports it (it doesn't directly for policies without DO block).
		try {
			await client.query(`CREATE POLICY "Allow public read access" ON geothinkr_photos FOR SELECT USING (true);`);
			console.log("SUCCESS: Created read policy.");
		} catch (e) {
			console.log("Policy might already exist:", e.message);
		}

	} catch (err) {
		console.error("Migration failed:", err);
	} finally {
		await client.end();
	}
}

runMigration();
