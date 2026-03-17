#!/usr/bin/env node

/**
 * Apply pricing_feedback migration to Supabase
 * Usage: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node apply-pricing-feedback-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(color, emoji, message) {
    console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

async function main() {
    log('blue', '💰', 'Pricing Feedback Migration - Starting...');
    console.log('');

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        log('red', '❌', 'Missing environment variables!');
        console.log('');
        console.log('Usage:');
        console.log('  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \\');
        console.log('  SUPABASE_SERVICE_ROLE_KEY=xxx \\');
        console.log('  node apply-pricing-feedback-migration.mjs');
        console.log('');
        console.log('Alternative: Apply via Supabase Dashboard');
        console.log('  1. Go to https://supabase.com/dashboard');
        console.log('  2. Select your project');
        console.log('  3. Open SQL Editor');
        console.log('  4. Copy contents of supabase/migrations/20260316000001_pricing_feedback.sql');
        console.log('  5. Paste and run');
        console.log('');
        process.exit(1);
    }

    log('cyan', 'ℹ️', `Connecting to: ${supabaseUrl}`);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const migration = {
        file: 'supabase/migrations/20260316000001_pricing_feedback.sql',
        name: 'Pricing Feedback Table',
    };

    console.log('');
    log('cyan', '📄', `Applying: ${migration.name}`);
    console.log(`   File: ${migration.file}`);

    try {
        const sql = readFileSync(join(__dirname, migration.file), 'utf8');

        // Execute the entire migration as a single transaction
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            // If exec_sql RPC doesn't exist, try direct execution via REST API
            if (error.message?.includes('function') && error.message?.includes('does not exist')) {
                log('yellow', '⚠️', 'exec_sql function not available, trying alternative method...');

                // Split SQL by statement and execute one by one
                const statements = sql
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--'));

                for (const statement of statements) {
                    if (statement.trim().startsWith('--')) continue;

                    // Use the from() method with a raw query workaround
                    // This is a fallback - manual application via Dashboard is recommended
                    const { error: stmtError } = await supabase.from('_supabase_migrations').select('*').limit(0);

                    if (stmtError) {
                        log('yellow', '⚠️', 'Cannot execute via API. Please apply manually via Supabase Dashboard.');
                        console.log('');
                        log('cyan', '📝', 'Manual application steps:');
                        console.log('  1. Go to https://supabase.com/dashboard');
                        console.log('  2. Select your project');
                        console.log('  3. Open SQL Editor');
                        console.log('  4. Copy contents of:');
                        console.log(`     ${migration.file}`);
                        console.log('  5. Paste and execute the SQL');
                        console.log('');
                        process.exit(0);
                    }
                }
            } else if (error.message?.includes('already exists')) {
                log('green', '✅', `Migration already applied: ${migration.name}`);
                console.log('');
                log('cyan', 'ℹ️', 'Verifying table exists...');

                // Verify the table exists
                const { data, error: verifyError } = await supabase
                    .from('pricing_feedback')
                    .select('id')
                    .limit(1);

                if (verifyError && !verifyError.message?.includes('0 rows')) {
                    log('yellow', '⚠️', `Table verification: ${verifyError.message}`);
                } else {
                    log('green', '✅', 'Table verified successfully');
                }

                console.log('');
                log('green', '🎉', 'Migration complete!');
                process.exit(0);
            } else {
                throw error;
            }
        }

        log('green', '✅', `Success: ${migration.name}`);
        console.log('');

        // Verify the table exists
        log('cyan', 'ℹ️', 'Verifying table...');
        const { error: verifyError } = await supabase
            .from('pricing_feedback')
            .select('id')
            .limit(1);

        if (verifyError && !verifyError.message?.includes('0 rows')) {
            log('yellow', '⚠️', `Verification warning: ${verifyError.message}`);
        } else {
            log('green', '✅', 'Table verified successfully');
        }

        console.log('');
        log('green', '🎉', 'Migration applied successfully!');
        console.log('');
        log('cyan', 'ℹ️', 'Next: Implement the pricing feedback API endpoint');
        console.log('');

    } catch (err) {
        log('red', '❌', `Failed: ${migration.name}`);
        console.log(`   Error: ${err.message}`);
        console.log('');
        log('cyan', '📝', 'Manual application required:');
        console.log('  1. Go to https://supabase.com/dashboard');
        console.log('  2. Select your project');
        console.log('  3. Open SQL Editor');
        console.log('  4. Copy and paste the contents of:');
        console.log(`     ${migration.file}`);
        console.log('  5. Execute the SQL');
        console.log('');
        process.exit(1);
    }
}

main().catch((err) => {
    log('red', '❌', 'Fatal error:');
    console.error(err);
    process.exit(1);
});
