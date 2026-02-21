const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.example', 'utf8');
const urlMatch = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseAdmin = createClient(
  urlMatch ? urlMatch[1] : process.env.NEXT_PUBLIC_SUPABASE_URL,
  keyMatch ? keyMatch[1] : process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabaseAdmin
    .from("shared_itineraries")
    .select(`
        *,
        itineraries (
            *,
            clients ( id, profiles ( full_name, email ) ),
            profiles!itineraries_user_id_fkey (
                organizations!profiles_organization_id_fkey ( name, logo_url, primary_color )
            )
        )
    `)
    .eq("share_code", "5c0156ea-2fcb-41a0-a51d-a22df82cd455")
    .single();

  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

test();
