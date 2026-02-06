const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Force IPv4 resolution
dns.setDefaultResultOrder('ipv4first');

async function migrate() {
    const host = 'db.rtdjmykkgmirxdyfckqi.supabase.co';

    const client = new Client({
        host,
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: '9949879447reddY',
        ssl: { rejectUnauthorized: false },
    });

    try {
        // Explicit lookup to debug/ensure IP
        const addresses = await dns.promises.lookup(host, { family: 4 });
        console.log(`🔍 Resolved ${host} to ${addresses.address}`);

        await client.connect();
        console.log('✅ Connected to Supabase Database');

        const sqlPath = path.join(__dirname, '../../supabase/migrations/20240206000000_init_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Running migration...');
        await client.query(sql);
        console.log('✅ Migration completed successfully!');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
