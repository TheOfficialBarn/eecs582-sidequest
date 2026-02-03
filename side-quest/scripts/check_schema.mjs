
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error("Missing env vars");
	process.exit(1);
}

function createAdminClient() {
	return createClient(
		SUPABASE_URL,
		SUPABASE_SERVICE_ROLE_KEY,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		}
	)
}

async function checkSchema() {
	console.log("Checking schema...");
	const supabase = createAdminClient();
	const { data, error } = await supabase.from('users').select('*').limit(1);
	if (error) {
		console.error('Error:', error);
	} else {
		console.log('User keys:', data && data.length > 0 ? Object.keys(data[0]) : 'No users found');
		if (data && data.length > 0) {
			console.log('Sample user:', data[0]);
		}
	}
}

checkSchema();
