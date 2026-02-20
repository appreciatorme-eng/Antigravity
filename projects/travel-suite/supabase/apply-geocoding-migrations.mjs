#!/usr/bin/env node

/**
 * Script to apply geocoding migrations programmatically
 * Usage: node apply-geocoding-migrations.mjs
 *
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
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

async function applyMigrations() {
    log('blue', '🗺️', 'Applying Geocoding Migrations...');
    console.log('='.repeat(60));
    console.log('');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        log('red', '❌', 'Error: Missing Supabase credentials!');
        console.log('');
        console.log('Please set the following environment variables:');
        console.log('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
        console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
        console.log('');
        process.exit(1);
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const migrations = [
        {
            name: 'Geocoding Cache Table',
            file: '20260220000000_add_geocoding_cache.sql',
            description: 'Creates cache table for storing geocoded locations',
        },
        {
            name: 'Geocoding Usage Tracking',
            file: '20260220010000_add_geocoding_usage_tracking.sql',
            description: 'Creates usage tracking and 90k limit enforcement',
        },
    ];

    let successCount = 0;
    let failCount = 0;

    for (const migration of migrations) {
        log('cyan', '📄', `Applying: ${migration.name}`);
        console.log(`   File: ${migration.file}`);
        console.log(`   Description: ${migration.description}`);
        console.log('');

        try {
            // Read migration file
            const migrationPath = join(__dirname, 'migrations', migration.file);
            const migrationSql = readFileSync(migrationPath, 'utf8');

            // Execute migration
            const { error } = await supabase.rpc('exec_sql', {
                sql_query: migrationSql,
            });

            if (error) {
                // If exec_sql doesn't exist, try direct query
                const { error: directError } = await supabase
                    .from('_supabase_migrations')
                    .select('*')
                    .limit(1);

                if (directError) {
                    // Use raw SQL execution
                    const { error: sqlError } = await supabase.rpc('query', {
                        query_text: migrationSql,
                    });

                    if (sqlError) {
                        throw sqlError;
                    }
                } else {
                    throw error;
                }
            }

            log('green', '✅', `Success: ${migration.name}`);
            successCount++;
        } catch (err) {
            log('red', '❌', `Failed: ${migration.name}`);
            console.log(`   Error: ${err.message}`);
            failCount++;
        }

        console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    log('blue', '📊', 'Migration Summary');
    console.log('');
    log('green', '✅', `Successful: ${successCount}/${migrations.length}`);
    if (failCount > 0) {
        log('red', '❌', `Failed: ${failCount}/${migrations.length}`);
    }
    console.log('');

    if (failCount === 0) {
        log('green', '🎉', 'All migrations applied successfully!');
        console.log('');
        log('cyan', 'ℹ️', 'Next steps:');
        console.log('  1. Generate a test itinerary');
        console.log('  2. Check usage stats: GET /api/admin/geocoding/usage');
        console.log('  3. Verify map shows correct coordinates');
        console.log('');
    } else {
        log('yellow', '⚠️', 'Some migrations failed. Please check the errors above.');
        console.log('');
        log('cyan', 'ℹ️', 'You can also apply migrations manually:');
        console.log('  1. Go to Supabase Dashboard → SQL Editor');
        console.log('  2. Copy contents of migration file');
        console.log('  3. Execute the SQL');
        console.log('');
    }

    process.exit(failCount > 0 ? 1 : 0);
}

// Run migrations
applyMigrations().catch((error) => {
    log('red', '❌', 'Fatal error:');
    console.error(error);
    process.exit(1);
});
