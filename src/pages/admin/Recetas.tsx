import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiX,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineExternalLink,
  HiOutlineCheckCircle,
  HiOutlineSearch,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import AutoFormattedText from '@/components/common/AutoFormattedText';

type Ingredient = {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
};

type Recipe = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  emoji: string;
  ingredients: Ingredient[];
  reference_url: string | null;
  created_at: string;
};

const CATEGORIES = ['General', 'Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Postre', 'Bebida'];

const CATEGORY_COLORS: Record<string, string> = {
  General:   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  Desayuno:  'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
  Almuerzo:  'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300',
  Cena:      'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
  Snack:     'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300',
  Postre:    'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300',
  Bebida:    'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300',
};

const EMOJIS = ['🍽️', '🍕', '🍝', '🥗', '🍜', '🥘', '🍲', '🌮', '🥙', '🍱', '🥞', '🧁', '🍰', '🥤', '☕', '🥩', '🍗', '🥚', '🫕', '🍛'];

const EMPTY_FORM = { name: '', description: '', category: 'General', emoji: '🍽️', reference_url: '' };
const EMPTY_INGREDIENT = { name: '', quantity: '' };

function getReferenceIcon(url: string) {
  if (url.includes('youtube') || url.includes('youtu.be')) return '▶️ YouTube';
  if (url.includes('instagram')) return '📸 Instagram';
  if (url.includes('tiktok')) return '🎵 TikTok';
  if (url.includes('facebook')) return '📘 Facebook';
  return '🔗 Ver referencia';
}

export default function Recetas() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [ingredientForm, setIngredientForm] = useState(EMPTY_INGREDIENT);
  const [editIngredients, setEditIngredients] = useState<Ingredient[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchRecipes(); }, []);

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Error al cargar recetas: ' + error.message);
    else if (data) setRecipes(data.map(r => ({ ...r, ingredients: r.ingredients || [] })));
    setLoading(false);
  };

  const openAddForm = () => {
    setEditingRecipe(null);
    setForm(EMPTY_FORM);
    setEditIngredients([]);
    setShowForm(true);
  };

  const openEditForm = (r: Recipe) => {
    setEditingRecipe(r);
    setForm({ name: r.name, description: r.description || '', category: r.category, emoji: r.emoji, reference_url: r.reference_url || '' });
    setEditIngredients([...r.ingredients]);
    setShowForm(true);
  };

  const addIngredientToForm = () => {
    if (!ingredientForm.name.trim()) { toast.error('El nombre del ingrediente es obligatorio'); return; }
    const newIng: Ingredient = { id: Date.now().toString(), name: ingredientForm.name.trim(), quantity: ingredientForm.quantity.trim(), checked: false };
    setEditIngredients(prev => [...prev, newIng]);
    setIngredientForm(EMPTY_INGREDIENT);
  };

  const removeIngredientFromForm = (id: string) => {
    setEditIngredients(prev => prev.filter(i => i.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (editingRecipe) {
        const { error } = await supabase
          .from('recipes')
          .update({ name: form.name, description: form.description, category: form.category, emoji: form.emoji, reference_url: form.reference_url || null, ingredients: editIngredients })
          .eq('id', editingRecipe.id);
        if (error) throw error;
        setRecipes(recipes.map(r => r.id === editingRecipe.id ? { ...r, ...form, ingredients: editIngredients, reference_url: form.reference_url || null } : r));
        toast.success('Receta actualizada');
      } else {
        const { data, error } = await supabase
          .from('recipes')
          .insert([{ user_id: user.id, ...form, reference_url: form.reference_url || null, ingredients: editIngredients }])
          .select();
        if (error) throw error;
        if (data) setRecipes([{ ...data[0], ingredients: editIngredients }, ...recipes]);
        toast.success('Receta creada');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingRecipe(null);
      setEditIngredients([]);
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const insertBullet = () => {
    setForm(prev => ({ ...prev, description: (prev.description || '') + (prev.description ? '\n• ' : '• ') }));
  };

  const deleteRecipe = async (id: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    setRecipes(recipes.filter(r => r.id !== id));
    toast.success('Receta eliminada');
  };

  const toggleIngredient = async (recipe: Recipe, ingId: string) => {
    const updatedIngredients = recipe.ingredients.map(i => i.id === ingId ? { ...i, checked: !i.checked } : i);
    await supabase.from('recipes').update({ ingredients: updatedIngredients }).eq('id', recipe.id);
    setRecipes(recipes.map(r => r.id === recipe.id ? { ...r, ingredients: updatedIngredients } : r));
  };

  const resetChecklist = async (recipe: Recipe) => {
    const updatedIngredients = recipe.ingredients.map(i => ({ ...i, checked: false }));
    await supabase.from('recipes').update({ ingredients: updatedIngredients }).eq('id', recipe.id);
    setRecipes(recipes.map(r => r.id === recipe.id ? { ...r, ingredients: updatedIngredients } : r));
    toast.success('Lista de compras reiniciada');
  };

  const filtered = recipes
    .filter(r => filterCategory === 'Todas' || r.category === filterCategory)
    .filter(r => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleTogglePin = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    const isNowPinned = togglePinItem({
      id: recipe.id,
      type: 'recipe',
      title: `${recipe.emoji} ${recipe.name}`,
      subtitle: recipe.category,
      path: '/admin/panel/recetas',
    });

    if (isNowPinned) {
      toast.success('¡Receta fijada en el inicio! 📌');
    } else {
      toast.info('Receta desfijada del inicio');
    }
    setRecipes([...recipes]);
  };

  if (loading) return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-12 w-36 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-48 rounded-[2rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
            Mis <span className="text-gradient">Recetas</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Guarda tus recetas favoritas con su lista de ingredientes para comprar.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={openAddForm}
          className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg flex items-center gap-2 shrink-0"
        >
          <HiOutlinePlus className="text-lg" />
          Nueva Receta
        </motion.button>
      </header>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar receta..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-[var(--vibrant-sky-blue)] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['Todas', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-dm-sans text-xl font-bold text-black dark:text-white">
                {editingRecipe ? 'Editar Receta' : 'Nueva Receta'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                <HiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Emoji selector */}
              <div className="space-y-2">
                <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Ícono</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                      className={`size-10 text-xl rounded-xl border-2 transition-all ${form.emoji === e ? 'border-black dark:border-white scale-110 bg-gray-100 dark:bg-gray-800' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                    >{e}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Nombre *</label>
                  <input
                    required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Pasta carbonara, Smoothie verde..."
                    className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Categoría</label>
                  <select
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 transition-all shadow-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Descripción (Opcional)</label>
                  <button
                    type="button"
                    onClick={insertBullet}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all"
                  >
                    + Agregar Viñeta (•)
                  </button>
                </div>
                <textarea
                  rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Notas o instrucciones breves... (Puedes usar saltos de línea y viñetas)"
                  className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm resize-none"
                />
              </div>

              {/* Ingredients */}
              <div className="space-y-3">
                <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Ingredientes</label>

                {/* Existing ingredients */}
                {editIngredients.length > 0 && (
                  <div className="space-y-2">
                    {editIngredients.map(ing => (
                      <div key={ing.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                        <span className="font-inter text-sm text-gray-800 dark:text-gray-100 flex-1">{ing.name}</span>
                        {ing.quantity && (
                          <span className="font-syne text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-lg">{ing.quantity}</span>
                        )}
                        <button type="button" onClick={() => removeIngredientFromForm(ing.id)} className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all">
                          <HiX className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add ingredient row */}
                <div className="flex gap-2">
                  <input
                    placeholder="Ingrediente..."
                    value={ingredientForm.name}
                    onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIngredientToForm())}
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                  />
                  <input
                    placeholder="Cantidad"
                    value={ingredientForm.quantity}
                    onChange={e => setIngredientForm({ ...ingredientForm, quantity: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIngredientToForm())}
                    className="w-28 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={addIngredientToForm}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all font-syne text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5 shrink-0"
                  >
                    <HiOutlinePlus />
                    Añadir
                  </button>
                </div>
                <p className="font-inter text-[11px] text-gray-400">Presiona Enter o el botón para añadir cada ingrediente.</p>
              </div>

              {/* Reference URL */}
              <div className="space-y-2">
                <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Enlace de Referencia (YouTube, Instagram, TikTok...)
                </label>
                <input
                  type="url"
                  value={form.reference_url}
                  onChange={e => setForm({ ...form, reference_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... o https://instagram.com/..."
                  className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 interactive-hover flex items-center gap-2">
                  {submitting ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {editingRecipe ? 'Guardar Cambios' : 'Crear Receta'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipes Grid */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 space-y-3">
          <div className="text-5xl">🍽️</div>
          <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-300">No hay recetas aquí aún</p>
          <p className="font-inter text-sm text-gray-400">¡Guarda tu primera receta favorita!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map(recipe => {
              const isExpanded = expandedId === recipe.id;
              const checkedCount = recipe.ingredients.filter(i => i.checked).length;
              const totalCount = recipe.ingredients.length;

              return (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-6 space-y-4 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl shrink-0">
                          {recipe.emoji}
                        </div>
                        <div>
                          <h3 className="font-dm-sans font-bold text-base text-black dark:text-white leading-tight">{recipe.name}</h3>
                          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider ${CATEGORY_COLORS[recipe.category] || CATEGORY_COLORS['General']}`}>
                            {recipe.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => handleTogglePin(e, recipe)}
                          className={`p-1.5 rounded-xl transition-all ${
                            isItemPinned(recipe.id)
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                              : 'text-gray-300 dark:text-gray-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          }`}
                          title={isItemPinned(recipe.id) ? 'Desfijar del inicio' : 'Fijar en el inicio'}
                        >
                          <span className="text-sm">{isItemPinned(recipe.id) ? '📌' : '📍'}</span>
                        </button>
                        <button onClick={() => openEditForm(recipe)} className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                          <HiOutlinePencil className="text-sm" />
                        </button>
                        <button onClick={() => deleteRecipe(recipe.id)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all">
                          <HiOutlineTrash className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {recipe.description && (
                      <AutoFormattedText text={recipe.description} className="text-sm text-gray-600 dark:text-gray-300 font-light" />
                    )}

                    {/* Progress bar */}
                    {totalCount > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">Ingredientes por comprar</span>
                          <span className="font-dm-sans text-xs font-bold text-gray-600 dark:text-gray-300">{checkedCount}/{totalCount}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
                            className={`h-full rounded-full transition-all ${checkedCount === totalCount && totalCount > 0 ? 'bg-emerald-500' : 'bg-[var(--vibrant-sky-blue)]'}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Reference Link */}
                    {recipe.reference_url && (
                      <a
                        href={recipe.reference_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 transition-all group"
                      >
                        <span>{getReferenceIcon(recipe.reference_url)}</span>
                        <HiOutlineExternalLink className="text-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    )}
                  </div>

                  {/* Expandable Ingredient Checklist */}
                  {totalCount > 0 && (
                    <div className="border-t border-gray-100/50 dark:border-gray-800/50">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : recipe.id)}
                        className="w-full px-6 py-3 flex items-center justify-between text-xs font-syne font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all"
                      >
                        <span>Lista de compras</span>
                        <div className="flex items-center gap-2">
                          {checkedCount > 0 && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300">
                              {checkedCount} listos
                            </span>
                          )}
                          {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 space-y-2">
                              {recipe.ingredients.map(ing => (
                                <motion.div
                                  key={ing.id}
                                  layout
                                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
                                    ing.checked
                                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30'
                                      : 'bg-white dark:bg-gray-900/60 border-gray-100/50 dark:border-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
                                  }`}
                                  onClick={() => toggleIngredient(recipe, ing.id)}
                                >
                                  <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    ing.checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'
                                  }`}>
                                    {ing.checked && <HiOutlineCheckCircle className="text-white text-xs" />}
                                  </div>
                                  <span className={`font-inter text-sm flex-1 ${ing.checked ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                    {ing.name}
                                  </span>
                                  {ing.quantity && (
                                    <span className="font-syne text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg shrink-0">
                                      {ing.quantity}
                                    </span>
                                  )}
                                </motion.div>
                              ))}

                              {checkedCount > 0 && (
                                <button
                                  onClick={() => resetChecklist(recipe)}
                                  className="mt-2 w-full py-2 text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
                                >
                                  ↺ Reiniciar lista de compras
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
