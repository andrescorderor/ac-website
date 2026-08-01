import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nysuimuxefyixnvdpxae.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c3VpbXV4ZWZ5aXhudmRweGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NzkzNzcsImV4cCI6MjA2MjI1NTM3N30.Z-9dJkS4XGqMfZw597Gf1z18dJ4S6q3P8g0S5W1m2c4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeDuplicates() {
  console.log('Fetching all shopping list items...');
  const { data, error } = await supabase.from('shopping_list').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching items:', error);
    return;
  }

  console.log(`Total items found: ${data.length}`);

  const seen = new Set();
  const duplicateIds = [];

  for (const item of data) {
    const cleanName = item.name.trim().toLowerCase();
    if (seen.has(cleanName)) {
      duplicateIds.push(item.id);
    } else {
      seen.add(cleanName);
    }
  }

  console.log(`Found ${duplicateIds.length} duplicate items to delete.`);

  if (duplicateIds.length > 0) {
    const { error: delErr } = await supabase.from('shopping_list').delete().in('id', duplicateIds);
    if (delErr) {
      console.error('Error deleting duplicates:', delErr);
    } else {
      console.log(`Successfully purged ${duplicateIds.length} duplicate items!`);
    }
  } else {
    console.log('No duplicates found in database!');
  }
}

purgeDuplicates();
