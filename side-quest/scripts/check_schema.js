
import { createAdminClient } from '../lib/supabase/admin.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Try .env.local first
dotenv.config({ path: '.env' });

async function checkSchema() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('User keys:', data && data.length > 0 ? Object.keys(data[0]) : 'No users found');
    }
}

checkSchema();
