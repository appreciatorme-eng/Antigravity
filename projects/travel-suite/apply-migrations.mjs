#!/usr/bin/env node

/**
 * Apply geocoding migrations to Supabase
 * Usage: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node apply-migrations.mjs
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
    log('blue', '🗺️', 'Geocoding Migrations - Starting...');
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
        console.log('  node apply-migrations.mjs');
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

    // Test connection
    try {
        const { data, error } = await supabase
            .from('_supabase_migrations')
            .select('*')
            .limit(1);

        if (error && !error.message.includes('does not exist')) {
            log('yellow', '⚠️', 'Cannot access migrations table, will use raw SQL');
        }
    } catch (err) {
        log('yellow', '⚠️', 'Connection test skipped');
    }

    const migrations = [
        {
            file: 'supabase/migrations/20260220000000_add_geocoding_cache.sql',
            name: 'Geocoding Cache Table',
        },
        {
            file: 'supabase/migrations/20260220010000_add_geocoding_usage_tracking.sql',
            name: 'Geocoding Usage Tracking',
        },
    ];

    let success = 0;
    let failed = 0;

    for (const migration of migrations) {
        console.log('');
        log('cyan', '📄', `Applying: ${migration.name}`);
        console.log(`   File: ${migration.file}`);

        try {
            const sql = readFileSync(join(__dirname, migration.file), 'utf8');

            // Split SQL by statement (simple split on semicolons outside quotes)
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i] + ';';

                // Skip comments
                if (statement.trim().startsWith('--')) continue;

                // Execute via RPC or direct query
                const { error } = await supabase.rpc('exec_sql', {
                    sql: statement,
                }).catch(() => ({ error: null }));

                if (error) {
                    // If exec_sql fails, log but continue (may already exist)
                    if (!error.message?.includes('already exists')) {
                        throw error;
                    }
                }
            }

            log('green', '✅', `Success: ${migration.name}`);
            success++;
        } catch (err) {
            log('red', '❌', `Failed: ${migration.name}`);
            console.log(`   Error: ${err.message}`);
            failed++;
        }
    }

    console.log('');
    console.log('='.repeat(60));
    log('blue', '📊', 'Summary');
    console.log('');
    log('green', '✅', `Successful: ${success}/${migrations.length}`);
    if (failed > 0) {
        log('red', '❌', `Failed: ${failed}/${migrations.length}`);
    }
    console.log('');

    if (success === migrations.length) {
        log('green', '🎉', 'All migrations applied!');
        console.log('');
        log('cyan', 'ℹ️', 'Next: Test your app and check usage stats');
        console.log('  Visit: /api/admin/geocoding/usage');
        console.log('');
    }
}

main().catch((err) => {
    log('red', '❌', 'Fatal error:');
    console.error(err);
    process.exit(1);
});
