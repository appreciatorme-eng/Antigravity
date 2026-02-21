import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
        .from("shared_itineraries")
        .select(`
            *,
            itineraries (
                *,
                clients ( id, profiles ( full_name, email ) ),
                profiles!itineraries_user_id_fkey ( 
                    organizations ( name, logo_url, primary_color )
                )
            )
        `)
        .limit(1);
        
  console.log({ error });
}
check();
