
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error("Missing env vars");
	process.exit(1);
}

const supabase = createClient(
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);

async function setupStorage() {
	console.log("Setting up storage...");

	// Check if bucket exists
	const { data: buckets, error: listError } = await supabase.storage.listBuckets();
	if (listError) {
		console.error("Error listing buckets:", listError);
		return;
	}

	const avatarBucket = buckets.find(b => b.name === 'avatars');

	if (avatarBucket) {
		console.log("Bucket 'avatars' already exists.");
	} else {
		console.log("Creating 'avatars' bucket...");
		const { data, error } = await supabase.storage.createBucket('avatars', {
			public: true,
			fileSizeLimit: 1024 * 1024 * 2, // 2MB
			allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
		});

		if (error) {
			console.error("Error creating bucket:", error);
		} else {
			console.log("Bucket 'avatars' created successfully.");
		}
	}
}

setupStorage();
