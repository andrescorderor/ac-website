import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpijsgxcjynqtrclkbnq.supabase.co';
const supabaseKey = 'sb_publishable_MVibXQf39R9rP1sWSshMWQ_aX5JzbmZ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: notes, error } = await supabase.from('notes').select('*');
  if (error) {
    console.error('Error fetching notes:', error);
    return;
  }

  console.log('Found notes:', notes.map(n => ({ id: n.id, title: n.title })));

  let tattooNote = notes.find(n => 
    n.title.toLowerCase().includes('tatuaj') || 
    n.content.toLowerCase().includes('tatuaj') ||
    n.title.toLowerCase().includes('tattoo')
  );

  const newIdeas = [
    '• Veni, Vidi, Vici',
    '• Escorpión',
    '• Frases de Kanye y Kendrick de canciones',
    '• Serpiente',
    '• Gato negro',
    '• Fasting Buddha sculpture',
    '• Flecha siempre hacia arriba',
    '• Romanos 8:18',
    '• 1 Pedro 4:1',
    '• Salmo 118:1',
    '• Isaías 6:8',
    '• Romanos 14:8',
    '• Manos de Padre',
    '• "No resucitar" (https://www.instagram.com/p/DWSQ7AWDzSS/?img_index=3&igsh=czVidmZ3eWNhOXBs)',
    '• Tatuaje jester, filosofía del jester',
    '• Tatuaje los diamantes se forjan bajo presion',
    '• Chicken Joe Pepe el pollo tattoo',
    '• Tatuaje flores: Concepto el propósito de vivir el momento aquí y ahora',
    '• Brújula o faro',
    '• Fénix',
    '• Manos de papás',
    '• Número 3',
    '• San Miguel arcángel',
    '• Gálatas 2:20'
  ];

  if (!tattooNote) {
    console.log('No existing tattoo note found. Creating a new note titled "Ideas de Tatuajes"...');
    const newContent = `### Ideas de Tatuajes 🎨\n\n${newIdeas.join('\n')}`;
    const { data: created, error: createError } = await supabase.from('notes').insert([
      {
        title: 'Ideas de Tatuajes 🎨',
        content: newContent,
        category: 'Ideas',
        is_pinned: true,
      }
    ]).select();

    if (createError) {
      console.error('Error creating note:', createError);
    } else {
      console.log('Created tattoo note successfully:', created);
    }
  } else {
    console.log('Found tattoo note:', tattooNote.title);
    let updatedContent = tattooNote.content.trim();
    if (!updatedContent.endsWith('\n')) updatedContent += '\n';

    // Add items that are not already present
    for (const idea of newIdeas) {
      const cleanText = idea.replace('• ', '').split(' (')[0];
      if (!updatedContent.toLowerCase().includes(cleanText.toLowerCase())) {
        updatedContent += `${idea}\n`;
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('notes')
      .update({ content: updatedContent })
      .eq('id', tattooNote.id)
      .select();

    if (updateError) {
      console.error('Error updating note:', updateError);
    } else {
      console.log('Updated tattoo note successfully:', updated);
    }
  }
}

main();
