
const { Client } = require('pg');

const PASSWORD = process.env.DB_PASSWORD;
if (!PASSWORD) {
	console.error("Please provide DB_PASSWORD environment variable");
	process.exit(1);
}

// Construct connection string for Supabase
// Host format: db.[project-ref].supabase.co
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

		console.log("Running migration...");

		// 1. Add profile_picture_url column
		await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
        `);
		console.log("SUCCESS: Added profile_picture_url column.");

		// 2. Add points column
		await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
        `);
		console.log("SUCCESS: Added points column.");

	} catch (err) {
		console.error("Migration failed:", err);
	} finally {
		await client.end();
	}
}

runMigration();
