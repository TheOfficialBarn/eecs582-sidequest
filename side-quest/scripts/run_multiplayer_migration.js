
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

		console.log("Running migration...");

		// 1. is_multiplayer flag
		await client.query(`
            ALTER TABLE quests 
            ADD COLUMN IF NOT EXISTS is_multiplayer BOOLEAN DEFAULT FALSE;
        `);
		console.log("SUCCESS: Added is_multiplayer column.");

		// 2. winner_id (only for multiplayer quests)
		await client.query(`
            ALTER TABLE quests 
            ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES users(user_id);
        `);
		console.log("SUCCESS: Added winner_id column.");

		// 3. reward_points (custom points for quests)
		await client.query(`
            ALTER TABLE quests 
            ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 100;
        `);
		console.log("SUCCESS: Added reward_points column.");

		// 4. Create an RPC function to atomically claim a quest
		// This prevents race conditions where two people win at the exact same millisecond.
		/*
		CREATE OR REPLACE FUNCTION claim_quest(p_quest_id UUID, p_user_id UUID, p_points INTEGER)
		RETURNS BOOLEAN AS $$
		DECLARE
			v_is_multiplayer BOOLEAN;
			v_winner_id UUID;
		BEGIN
			-- Check if quest is multiplayer
			SELECT is_multiplayer, winner_id INTO v_is_multiplayer, v_winner_id
			FROM quests WHERE quest_id = p_quest_id;

			IF NOT v_is_multiplayer THEN
				RETURN TRUE; -- Not a multiplayer quest, proceed as normal
			END IF;

			IF v_winner_id IS NOT NULL THEN
				RETURN FALSE; -- Already won
			END IF;

			-- Try to set winner
			UPDATE quests 
			SET winner_id = p_user_id 
			WHERE quest_id = p_quest_id AND winner_id IS NULL;

			IF FOUND THEN
				 -- If we successfully set the winner, give them points
				 UPDATE users SET points = points + p_points WHERE user_id = p_user_id;
				 RETURN TRUE;
			ELSE
				 RETURN FALSE; -- Lost the race
			END IF;
		END;
		$$ LANGUAGE plpgsql;
		*/

		// I will execute this via query since standard PG client can do it.
		await client.query(`
        CREATE OR REPLACE FUNCTION claim_quest(p_quest_id UUID, p_user_id UUID)
        RETURNS BOOLEAN AS $$
        DECLARE
            v_is_multiplayer BOOLEAN;
            v_winner_id UUID;
            v_points INTEGER;
        BEGIN
            -- Check if quest is multiplayer
            SELECT is_multiplayer, winner_id, reward_points INTO v_is_multiplayer, v_winner_id, v_points
            FROM quests WHERE quest_id = p_quest_id;

            -- If it's not a multiplayer quest, we treat it as "claimed" success so logic proceeds
            -- (The calling API handles the "normal" progress insert for single player)
            IF NOT v_is_multiplayer THEN
                RETURN TRUE; 
            END IF;

            -- If already won, return false
            IF v_winner_id IS NOT NULL THEN
                RETURN FALSE; 
            END IF;

            -- Try to set winner
            UPDATE quests 
            SET winner_id = p_user_id 
            WHERE quest_id = p_quest_id AND winner_id IS NULL;

            IF FOUND THEN
                 -- If we successfully set the winner, give them points
                 UPDATE users SET points = points + (v_points) WHERE user_id = p_user_id;
                 RETURN TRUE;
            ELSE
                 RETURN FALSE; -- Lost the race
            END IF;
        END;
        $$ LANGUAGE plpgsql;
       `);
		console.log("SUCCESS: Created claim_quest RPC function.");

	} catch (err) {
		console.error("Migration failed:", err);
	} finally {
		await client.end();
	}
}

runMigration();
