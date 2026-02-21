const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
        .from("shared_itineraries")
        .select(`
            *,
            itineraries (
                *,
                clients ( id, profiles ( full_name, email ) ),
                organizations ( name, logo_url, primary_color )
            )
        `)
        .limit(1);

  console.log("DATA:", JSON.stringify(data, null, 2));
  console.log("ERROR:", JSON.stringify(error, null, 2));
}

test();
