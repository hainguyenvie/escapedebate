import { supabase } from './server/db';

async function runMigration() {
    console.log('Running migration to add debate fields...');

    try {
        // Note: Supabase doesn't allow DDL via client, so this is for reference
        // You need to run this SQL in Supabase Dashboard > SQL Editor:

        const sql = `
ALTER TABLE debates 
ADD COLUMN IF NOT EXISTS refined_topic TEXT,
ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS moderator_intro TEXT;

UPDATE debates 
SET current_round = 1 
WHERE current_round IS NULL;
    `;

        console.log('\n=== MIGRATION SQL ===');
        console.log(sql);
        console.log('===================\n');
        console.log('Please run this SQL in your Supabase Dashboard > SQL Editor');
        console.log('URL: https://mlnipvrviqtfjexdufxz.supabase.co/project/mlnipvrviqtfjexdufxz/sql');

    } catch (error) {
        console.error('Error:', error);
    }
}

runMigration();
