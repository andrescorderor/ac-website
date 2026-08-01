import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpijsgxcjynqtrclkbnq.supabase.co';
const supabaseKey = 'sb_publishable_MVibXQf39R9rP1sWSshMWQ_aX5JzbmZ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: shopping, error: err1 } = await supabase.from('shopping_list').select('user_id').limit(1);
  console.log('Shopping user_id:', shopping);

  const { data: notes, error: err2 } = await supabase.from('notes').select('*');
  console.log('Notes result:', notes, err2);
}

main();
