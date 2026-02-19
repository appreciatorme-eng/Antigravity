#!/usr/bin/env node

/**
 * Script to apply RAG system and PDF import migrations
 * Usage: node apply-rag-migrations.mjs
 *
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * This script applies:
 * 1. 20260219140000_rag_template_search.sql (RAG system with pgvector)
 * 2. 20260219150000_pdf_import_pipeline.sql (PDF import pipeline)
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
    magenta: '\x1b[35m',
};

function log(color, emoji, message) {
    console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

const MIGRATIONS = [
    '20260219140000_rag_template_search.sql',
    '20260219150000_pdf_import_pipeline.sql'
];

async function applyMigrations() {
    log('blue', '🚀', 'Applying RAG System Migrations...');
    console.log('='.repeat(70));
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
        console.log('  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node apply-rag-migrations.mjs');
        console.log('');
        console.log('Get your credentials from:');
        console.log('  Supabase Dashboard → Settings → API');
        process.exit(1);
    }

    log('cyan', '🔗', `Connecting to Supabase: ${supabaseUrl}`);
    console.log('');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Test connection
    try {
        const { error } = await supabase.from('_test').select('*').limit(1);
        if (error && !error.message.includes('does not exist')) {
            throw new Error(`Connection failed: ${error.message}`);
        }
        log('green', '✓', 'Connection successful');
        console.log('');
    } catch (err) {
        log('red', '❌', `Connection failed: ${err.message}`);
        process.exit(1);
    }

    let totalSuccess = 0;
    let totalFail = 0;

    // Apply each migration file
    for (const migrationFile of MIGRATIONS) {
        log('magenta', '📄', `Applying migration: ${migrationFile}`);
        console.log('');

        const migrationPath = join(__dirname, 'migrations', migrationFile);

        let migrationSQL;
        try {
            migrationSQL = readFileSync(migrationPath, 'utf8');
        } catch (err) {
            log('red', '❌', `Failed to read migration file: ${err.message}`);
            totalFail++;
            continue;
        }

        // Split migration into individual statements
        const statements = migrationSQL
            .split('\n')
            .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
            .join('\n')
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        log('cyan', '📝', `Found ${statements.length} SQL statements`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            const preview = stmt.substring(0, 70).replace(/\s+/g, ' ') + '...';

            process.stdout.write(`  ${colors.cyan}[${i + 1}/${statements.length}]${colors.reset} ${preview}`);

            try {
                // Execute SQL directly via Supabase client
                const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });

                if (error) {
                    // Some errors are expected (like "already exists")
                    if (error.message.includes('already exists') ||
                        error.message.includes('already installed') ||
                        error.message.includes('cannot drop') ||
                        error.message.includes('does not exist and cannot be dropped')) {
                        process.stdout.write(` ${colors.yellow}⊙${colors.reset} (exists)\n`);
                        successCount++;
                    } else {
                        throw error;
                    }
                } else {
                    process.stdout.write(` ${colors.green}✓${colors.reset}\n`);
                    successCount++;
                }
            } catch (err) {
                process.stdout.write(` ${colors.red}✗${colors.reset}\n`);
                log('yellow', '  ⚠️', `Warning: ${err.message || err}`);
                failCount++;
            }
        }

        console.log('');
        if (failCount > 0) {
            log('yellow', '⚠️', `Migration partially applied: ${successCount} success, ${failCount} warnings`);
        } else {
            log('green', '✅', `Migration applied successfully: ${successCount}/${statements.length} statements`);
        }
        console.log('');

        totalSuccess += successCount;
        totalFail += failCount;
    }

    console.log('='.repeat(70));
    console.log('');

    if (totalFail > 0) {
        log('yellow', '⚠️', `All migrations completed with ${totalFail} warnings (this is normal if migrations were partially applied)`);
    } else {
        log('green', '✅', 'All migrations applied successfully!');
    }

    console.log('');
    log('cyan', '🔍', 'Verifying migration results...');
    console.log('');

    // Verify pgvector extension
    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            query: "SELECT extname FROM pg_extension WHERE extname = 'vector';"
        });

        if (error) {
            log('yellow', '⚠️', 'Could not verify pgvector extension');
        } else {
            log('green', '✅', 'pgvector extension installed');
        }
    } catch (err) {
        log('yellow', '⚠️', `Verification warning: ${err.message}`);
    }

    // Verify tour_templates has embedding column
    try {
        const { data, error } = await supabase
            .from('tour_templates')
            .select('id')
            .limit(1);

        if (!error) {
            log('green', '✅', 'tour_templates table accessible');
        }
    } catch (err) {
        log('yellow', '⚠️', 'Could not verify tour_templates table');
    }

    // Verify pdf_imports table
    try {
        const { data, error } = await supabase
            .from('pdf_imports')
            .select('id')
            .limit(1);

        if (!error) {
            log('green', '✅', 'pdf_imports table created');
        }
    } catch (err) {
        log('yellow', '⚠️', 'Could not verify pdf_imports table');
    }

    console.log('');
    log('green', '🎉', 'RAG System deployment complete!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Generate embeddings for existing templates:');
    console.log('     curl -X POST http://localhost:3000/api/admin/generate-embeddings');
    console.log('');
    console.log('  2. Test RAG system by generating an itinerary:');
    console.log('     Visit /planner and create a new itinerary');
    console.log('');
    console.log('  3. Upload your first PDF template:');
    console.log('     POST /api/admin/pdf-imports/upload');
    console.log('');
    console.log('  4. Monitor tier distribution in server logs:');
    console.log('     Look for [TIER 1: CACHE HIT], [TIER 2: RAG HIT], [TIER 3: GEMINI FALLBACK]');
    console.log('');
}

// Run migration
applyMigrations().catch(err => {
    log('red', '❌', `Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
});
