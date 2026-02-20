const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('route.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src/app/api'); // changed to scan all api routes

for (const file of files) {
    let code = fs.readFileSync(file, 'utf8');
    // Find files that still have the old pattern OR the proxy pattern that fails TS
    if (code.includes('const supabaseAdmin = new Proxy({}')) {
        let replacement = `// Lazy initialization to avoid build-time errors
const getSupabaseAdmin = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Type-safe Proxy to automatically create client on first use
const supabaseAdmin = new Proxy({}, {
    get: (target, prop) => (getSupabaseAdmin() as any)[prop]
}) as ReturnType<typeof createClient>;`;

        code = code.replace(
            /\/\/ Lazy initialization[\s\S]*?as ReturnType<typeof createClient>;/,
            replacement
        );
        fs.writeFileSync(file, code);
        console.log(`Patched proxy in ${file}`);
    } else if (code.includes('const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;\nconst supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;\n\nconst supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);')) {
        let replacement = `// Lazy initialization to avoid build-time errors
const getSupabaseAdmin = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Type-safe Proxy to automatically create client on first use
const supabaseAdmin = new Proxy({}, {
    get: (target, prop) => (getSupabaseAdmin() as any)[prop]
}) as ReturnType<typeof createClient>;`;

        code = code.replace(
            /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL!;\nconst supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY!;\n+const supabaseAdmin = createClient\(supabaseUrl, supabaseServiceKey\);/,
            replacement
        );
        fs.writeFileSync(file, code);
        console.log(`Fixed global createClient in ${file}`);
    }
}
