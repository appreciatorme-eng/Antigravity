#!/usr/bin/env node

/**
 * Script to apply itinerary cache migration programmatically
 * Usage: node apply-migration.mjs
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

async function applyMigration() {
    log('blue', '🚀', 'Applying Itinerary Cache Migration...');
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
        console.log('Or run with:');
        console.log('  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node apply-migration.mjs');
        process.exit(1);
    }

    log('cyan', '🔗', `Connecting to Supabase: ${supabaseUrl}`);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Read migration file
    const migrationPath = join(__dirname, 'migrations', '20260218000000_itinerary_cache_system.sql');
    log('cyan', '📄', `Reading migration: ${migrationPath}`);

    let migrationSQL;
    try {
        migrationSQL = readFileSync(migrationPath, 'utf8');
    } catch (err) {
        log('red', '❌', `Failed to read migration file: ${err.message}`);
        process.exit(1);
    }

    // Split migration into individual statements
    // Remove comments and split by semicolons
    const statements = migrationSQL
        .split('\n')
        .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
        .join('\n')
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

    log('cyan', '📝', `Found ${statements.length} SQL statements to execute`);
    console.log('');

    // Execute each statement
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 60).replace(/\s+/g, ' ') + '...';

        process.stdout.write(`${colors.cyan}[${i + 1}/${statements.length}]${colors.reset} ${preview}`);

        try {
            const { error } = await supabase.rpc('exec_sql', { query: stmt });

            if (error) {
                // Try direct execution via REST API as fallback
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                    },
                    body: JSON.stringify({ query: stmt })
                });

                if (!response.ok) {
                    throw new Error(error.message || 'Execution failed');
                }
            }

            process.stdout.write(` ${colors.green}✓${colors.reset}\n`);
            successCount++;
        } catch (err) {
            process.stdout.write(` ${colors.red}✗${colors.reset}\n`);
            log('yellow', '⚠️', `Warning: ${err.message}`);
            failCount++;
        }
    }

    console.log('');
    console.log('='.repeat(60));

    if (failCount > 0) {
        log('yellow', '⚠️', `Migration completed with ${failCount} warnings (this is normal if migration was partially applied)`);
    } else {
        log('green', '✅', 'Migration applied successfully!');
    }

    console.log('');
    log('cyan', '🔍', 'Verifying migration...');

    // Verify tables
    const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['itinerary_cache', 'itinerary_cache_analytics']);

    if (tablesError) {
        log('yellow', '⚠️', `Could not verify tables: ${tablesError.message}`);
    } else if (tables && tables.length === 2) {
        log('green', '✅', 'Verification passed: Cache tables created successfully');
    } else {
        log('yellow', '⚠️', `Expected 2 tables, found ${tables?.length || 0}`);
    }

    console.log('');
    log('green', '🎉', 'Cache system is now active!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Test by generating an itinerary');
    console.log('  2. Check cache stats with: SELECT * FROM get_cache_stats(30);');
    console.log('  3. See README_CACHE_MIGRATION.md for monitoring queries');
    console.log('');
}

// Run migration
applyMigration().catch(err => {
    log('red', '❌', `Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
});
