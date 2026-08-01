import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpijsgxcjynqtrclkbnq.supabase.co';
const supabaseAnonKey = 'sb_publishable_MVibXQf39R9rP1sWSshMWQ_aX5JzbmZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const comidaItems = [
  { name: 'Banana peppers', price: null, bought: false },
  { name: 'Pollo (1 kg/semana)', price: 200, bought: true },
  { name: 'Carne', price: 250, bought: true },
  { name: 'Vino', price: 300, bought: true },
  { name: 'Helado Cookies & Cream (Aurrerá/Walmart)', price: 160, bought: true },
  { name: 'Aceite', price: 80, bought: true },
  { name: 'Lata de aceitunas', price: 60, bought: true },
  { name: 'Palmitos', price: 60, bought: true },
  { name: 'Aguacate', price: 60, bought: true },
  { name: 'Queso Panela', price: 54, bought: true },
  { name: 'Lechuga', price: 49, bought: true },
  { name: 'Leche', price: 44, bought: true },
  { name: 'Linaza', price: 38, bought: true },
  { name: 'Jitomate', price: 34, bought: true },
  { name: 'San Pellegrino', price: 33, bought: true },
  { name: 'Yema de huevo / Huevo tetrapack', price: 33, bought: true },
  { name: 'Limón', price: 31, bought: true },
  { name: 'Azúcar', price: 30, bought: true },
  { name: 'Champiñones', price: 30, bought: true },
  { name: 'Plátanos', price: 20, bought: true },
  { name: 'Ajonjolí', price: 17, bought: true },
  { name: 'Tortillas', price: 15, bought: true },
  { name: 'Halls', price: 12, bought: true },
  { name: 'Pepinillos', price: 69, bought: true },
  { name: 'Jitomates deshidratados', price: null, bought: true },
  { name: 'Semillas', price: null, bought: true },
  { name: 'Jengibre', price: null, bought: true },
  { name: 'Gordo lobo té', price: null, bought: true },
  { name: 'Pimiento', price: 89, bought: true },
  { name: 'Garrafón', price: null, bought: true },
  { name: 'Rice papers', price: null, bought: true },
  { name: 'Especias', price: null, bought: true },
  { name: 'Sal', price: null, bought: true },
  { name: 'Cúrcuma', price: null, bought: true },
];

const insumosItems = [
  { name: 'Papel de baño', price: 150, bought: true },
  { name: 'Trapeador', price: 130, bought: true },
  { name: 'Jabón ropa', price: 120, bought: true },
  { name: 'Jabón de trastes', price: 82, bought: true },
  { name: 'Cubeta', price: 80, bought: true },
  { name: 'Servilletas', price: 61, bought: true },
  { name: 'Jabón piso Pinol', price: 60, bought: true },
  { name: 'Bote basura grande', price: 40, bought: true },
  { name: 'Ziplock', price: 35, bought: true },
  { name: 'Guantes', price: 30, bought: true },
  { name: 'Bolsas basura', price: null, bought: true },
  { name: 'Mini bote de basura', price: null, bought: true },
  { name: 'Esponja de trastes', price: null, bought: true },
  { name: 'Spray de baño', price: null, bought: true },
  { name: 'Jabón manos', price: null, bought: true },
  { name: 'Bote jabón trastes', price: null, bought: true },
  { name: 'Encendedores', price: null, bought: false },
  { name: 'Perfume / Perfume gym', price: 400, bought: true },
  { name: 'Enjuague bucal', price: 80, bought: true },
  { name: 'Shampoo', price: 80, bought: true },
  { name: 'Crema facial', price: 72, bought: true },
  { name: 'Crema corporal', price: 70, bought: true },
  { name: 'Pasta de Dientes', price: 60, bought: true },
  { name: 'Cera para pelo', price: 56, bought: true },
  { name: 'Desodorante', price: null, bought: true },
  { name: 'Acondicionador', price: null, bought: true },
  { name: 'Exfoliante', price: null, bought: true },
  { name: 'Minoxidil', price: null, bought: true },
  { name: 'Vitaminas 760', price: null, bought: true },
];

async function insertAll() {
  let userId = null;

  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  if (profiles && profiles.length > 0) userId = profiles[0].id;

  if (!userId) {
    const { data: expenses } = await supabase.from('finance_expenses').select('user_id').limit(1);
    if (expenses && expenses.length > 0) userId = expenses[0].user_id;
  }

  if (!userId) {
    const { data: salaries } = await supabase.from('finance_salary').select('user_id').limit(1);
    if (salaries && salaries.length > 0) userId = salaries[0].user_id;
  }

  if (!userId) {
    console.error('Could not find user_id');
    return;
  }

  console.log('Found user_id:', userId);

  const records = [
    ...comidaItems.map(item => ({
      user_id: userId,
      name: item.name,
      price: item.price,
      bought: item.bought,
      priority: 'Media',
      location: '🍔 Comida | 🥗 Quincenal',
    })),
    ...insumosItems.map(item => ({
      user_id: userId,
      name: item.name,
      price: item.price,
      bought: item.bought,
      priority: 'Media',
      location: '🛒 Insumos | 🥗 Quincenal',
    })),
  ];

  const { data, error } = await supabase.from('shopping_list').insert(records).select();

  if (error) {
    console.error('Error inserting records:', error);
  } else {
    console.log(`SUCCESS! Inserted ${data.length} Mandado items into shopping_list!`);
  }
}

insertAll();
