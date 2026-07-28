import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineLockClosed,
  HiOutlineShoppingBag,
  HiOutlineColorSwatch,
  HiOutlineCheckCircle,
  HiOutlineBookOpen,
  HiOutlineCurrencyDollar,
  HiOutlineArrowRight,
  HiSparkles,
  HiOutlineSparkles,
  HiOutlineKey,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';

type ResultType = 'note' | 'task' | 'debt' | 'vault' | 'shopping' | 'reminder' | 'project' | 'checklist' | 'recipe' | 'finance';

type SearchResult = {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ElementType;
  categoryLabel: string;
  badgeColor: string;
  rawTitle?: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_META: Record<ResultType, { label: string; icon: React.ElementType; color: string }> = {
  note:      { label: 'Nota',          icon: HiOutlineDocumentText,  color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
  reminder:  { label: 'Fecha',         icon: HiOutlineCalendar,      color: 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300' },
  task:      { label: 'Tarea',         icon: HiOutlineClipboardList, color: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300' },
  debt:      { label: 'Deuda',         icon: HiOutlineUserGroup,     color: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300' },
  vault:     { label: 'Bóveda',        icon: HiOutlineLockClosed,    color: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' },
  shopping:  { label: 'Compra',        icon: HiOutlineShoppingBag,   color: 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300' },
  project:   { label: 'Proyecto',      icon: HiOutlineColorSwatch,   color: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300' },
  checklist: { label: 'Checklist',     icon: HiOutlineCheckCircle,   color: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300' },
  recipe:    { label: 'Receta',        icon: HiOutlineBookOpen,      color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' },
  finance:   { label: 'Gasto',         icon: HiOutlineCurrencyDollar,color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' },
};

/** Component to highlight search matches */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 dark:bg-amber-700/60 text-inherit rounded-sm px-px">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/** Component to parse inline **bold** text */
function ParseInlineBold({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-dm-sans font-bold text-gray-950 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

/** Component to render structured Markdown responses gracefully with UX polish */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-3 font-inter text-sm sm:text-base leading-relaxed sm:leading-7 tracking-normal text-gray-800 dark:text-gray-200">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-2" />;

        // Final follow-up question (e.g. "¿Te gustaría que te ayude...?")
        if (line.startsWith('¿') || (line.endsWith('?') && line.length < 130)) {
          return (
            <div key={idx} className="mt-5 p-3.5 bg-indigo-50/90 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-xs sm:text-sm font-inter font-medium flex items-start gap-2.5 shadow-sm">
              <span className="text-base shrink-0 mt-0.5">💡</span>
              <div className="flex-1 leading-relaxed"><ParseInlineBold text={line} /></div>
            </div>
          );
        }

        // Section header (e.g. "Estilo La Michoacana:" or "**Estilo La Michoacana:**")
        if (line.endsWith(':') && line.length < 80 && !line.startsWith('-') && !line.startsWith('*')) {
          return (
            <div key={idx} className="pt-4 pb-1">
              <h4 className="font-dm-sans font-bold text-sm sm:text-base text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2 pb-1.5 border-b border-indigo-100 dark:border-indigo-950/60">
                <span className="size-2 rounded-full bg-indigo-500 shrink-0" />
                <ParseInlineBold text={line} />
              </h4>
            </div>
          );
        }

        // Numbered item (e.g., "1. **Horchata La Michoacana**")
        const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-3 pt-2 pb-0.5">
              <span className="flex items-center justify-center size-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-dm-sans text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                {numberedMatch[1]}
              </span>
              <div className="flex-1 text-gray-900 dark:text-gray-100 font-dm-sans text-sm sm:text-base leading-snug">
                <ParseInlineBold text={numberedMatch[2]} />
              </div>
            </div>
          );
        }

        // Bullet item (e.g., "- **Ingredientes:** Leche...")
        const bulletMatch = line.match(/^[\-\*]\s+(.*)/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-3 pl-3 py-1">
              <span className="size-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0 mt-2.5 shadow-xs" />
              <div className="flex-1 text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                <ParseInlineBold text={bulletMatch[1]} />
              </div>
            </div>
          );
        }

        // Regular text line
        return (
          <p key={idx} className="text-gray-800 dark:text-gray-200 leading-relaxed">
            <ParseInlineBold text={line} />
          </p>
        );
      })}
    </div>
  );
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [mode, setMode] = useState<'search' | 'ai'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // AI Assistant State
  const [apiKey, setApiKey] = useState<string>(() => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('ac_gemini_api_key') || '';
  });
  const [tempApiKeyInput, setTempApiKeyInput] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);
  const [aiThinking, setAiThinking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Focus input and reset search on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 80);
      searchAll('');
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (mode !== 'search') return;
    const timer = setTimeout(() => {
      if (isOpen) searchAll(query);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, isOpen, mode]);

  // Scroll chat to bottom
  useEffect(() => {
    if (mode === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChat, aiThinking, mode]);

  const handleSelectResult = (path: string, item?: SearchResult) => {
    onClose();
    let cleanTitle = item?.rawTitle || item?.title || '';
    // Strip leading emojis and whitespace
    cleanTitle = cleanTitle.replace(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/gu, '').trim();
    const targetUrl = cleanTitle ? `${path}?search=${encodeURIComponent(cleanTitle)}` : path;
    navigate(targetUrl);
  };

  // Keyboard navigation for search mode
  useEffect(() => {
    if (!isOpen || mode !== 'search') return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, -1));
      }
      if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        const item = results[activeIndex];
        handleSelectResult(item.path, item);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, mode, results, activeIndex]);

  // Keyboard navigation for ESC in AI mode
  useEffect(() => {
    if (!isOpen || mode !== 'ai') return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, mode]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${activeIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const searchAll = useCallback(async (searchTerm: string) => {
    setSearching(true);
    const term = searchTerm.toLowerCase().trim();
    // Normalize diacritics so "matricula" matches "Matrícula", "cafe" matches "café", etc.
    const termNorm = term.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    try {
      let notesQ = supabase.from('notes').select('*').order('created_at', { ascending: false });
      let remindersQ = supabase.from('reminders').select('*').order('created_at', { ascending: false });
      let tasksQ = supabase.from('tasks').select('*').order('created_at', { ascending: false });
      let debtsQ = supabase.from('debts').select('*').order('created_at', { ascending: false });
      // Vault: always load ALL items — filtered 100% client-side with accent-insensitive comparison
      const vaultQ = supabase.from('vault_items').select('*').order('created_at', { ascending: false }).limit(500);
      let shoppingQ = supabase.from('shopping_list').select('*').order('created_at', { ascending: false });
      let projectsQ = supabase.from('creative_projects').select('*').order('created_at', { ascending: false });

      let checklistQ = supabase.from('monthly_checklist_items').select('*').order('created_at', { ascending: false });
      let recipesQ = supabase.from('recipes').select('*').order('created_at', { ascending: false });
      let financeQ = supabase.from('finance_expenses').select('*').order('created_at', { ascending: false });

      if (term) {
        notesQ = notesQ.or(`title.ilike.%${term}%,content.ilike.%${term}%,category.ilike.%${term}%`).limit(50);
        remindersQ = remindersQ.or(`title.ilike.%${term}%,category.ilike.%${term}%`).limit(50);
        tasksQ = tasksQ.or(`title.ilike.%${term}%,description.ilike.%${term}%`).limit(50);
        debtsQ = debtsQ.or(`debtor_name.ilike.%${term}%,concept.ilike.%${term}%`).limit(50);
        // vault has no server-side filter — all items already loaded above
        shoppingQ = shoppingQ.or(`name.ilike.%${term}%,location.ilike.%${term}%`).limit(50);
        projectsQ = projectsQ.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`).limit(50);
        checklistQ = checklistQ.or(`title.ilike.%${term}%,category.ilike.%${term}%`).limit(50);
        recipesQ = recipesQ.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`).limit(50);
        financeQ = financeQ.or(`concept.ilike.%${term}%,category.ilike.%${term}%`).limit(50);
      } else {
        notesQ = notesQ.limit(20);
        remindersQ = remindersQ.limit(20);
        tasksQ = tasksQ.limit(20);
        debtsQ = debtsQ.limit(20);
        shoppingQ = shoppingQ.limit(20);
        projectsQ = projectsQ.limit(20);
        checklistQ = checklistQ.limit(20);
        recipesQ = recipesQ.limit(20);
        financeQ = financeQ.limit(20);
      }

      const [nts, rem, tsk, dbt, vlt, shp, prj, chk, rec, fin] = await Promise.all([
        notesQ,
        remindersQ,
        tasksQ,
        debtsQ,
        vaultQ,
        shoppingQ,
        projectsQ,
        checklistQ,
        recipesQ,
        financeQ,
      ]);

      const items: SearchResult[] = [];
      const push = (r: SearchResult) => items.push(r);

      nts.data?.forEach(n => {
        if (!term || n.title.toLowerCase().includes(term) || n.content?.toLowerCase().includes(term) || n.category?.toLowerCase().includes(term)) {
          push({ id: n.id, type: 'note', title: n.title, subtitle: n.category || n.content?.slice(0, 70), path: '/admin/panel/notas', icon: TYPE_META.note.icon, categoryLabel: TYPE_META.note.label, badgeColor: TYPE_META.note.color, rawTitle: n.title });
        }
      });

      rem.data?.forEach(r => {
        if (!term || r.title.toLowerCase().includes(term) || r.category?.toLowerCase().includes(term)) {
          push({ id: r.id, type: 'reminder', title: r.title, subtitle: `${r.date || r.event_date || 'Sin fecha'}${r.time ? ` · ${r.time}` : ''}`, path: '/admin/panel/recordatorios', icon: TYPE_META.reminder.icon, categoryLabel: TYPE_META.reminder.label, badgeColor: TYPE_META.reminder.color, rawTitle: r.title });
        }
      });

      tsk.data?.forEach(t => {
        if (!term || t.title.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term)) {
          push({ id: t.id, type: 'task', title: t.title, subtitle: t.completed ? '✓ Completada' : t.due_date ? `Vence: ${t.due_date}` : 'Pendiente', path: '/admin/panel/pendientes', icon: TYPE_META.task.icon, categoryLabel: TYPE_META.task.label, badgeColor: TYPE_META.task.color, rawTitle: t.title });
        }
      });

      dbt.data?.forEach(d => {
        if (!term || d.debtor_name.toLowerCase().includes(term) || d.concept?.toLowerCase().includes(term)) {
          push({ id: d.id, type: 'debt', title: d.debtor_name, subtitle: `$${d.amount}${d.concept ? ` · ${d.concept}` : ''}`, path: '/admin/panel/deudas', icon: TYPE_META.debt.icon, categoryLabel: TYPE_META.debt.label, badgeColor: TYPE_META.debt.color, rawTitle: d.debtor_name });
        }
      });

      vlt.data?.forEach(v => {
        // Normalize diacritics in both the field and the search term for robust accent-insensitive matching
        const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const titleNorm = normalize(v.title);
        const contentNorm = v.content ? normalize(v.content) : '';
        const catNorm = v.category ? normalize(v.category) : '';
        if (!termNorm || titleNorm.includes(termNorm) || contentNorm.includes(termNorm) || catNorm.includes(termNorm)) {
          push({ id: v.id, type: 'vault', title: v.title, subtitle: v.category ? `${v.category} · ${v.content?.slice(0, 50)}...` : (v.content?.slice(0, 70) || '🔒 Texto seguro en bóveda'), path: '/admin/panel/vault', icon: TYPE_META.vault.icon, categoryLabel: TYPE_META.vault.label, badgeColor: TYPE_META.vault.color, rawTitle: v.title });
        }
      });

      shp.data?.forEach(s => {
        if (!term || s.name.toLowerCase().includes(term) || s.location?.toLowerCase().includes(term)) {
          push({ id: s.id, type: 'shopping', title: s.name, subtitle: `${s.bought ? '✓ Comprado' : 'Por comprar'}${s.location ? ` · ${s.location}` : ''}`, path: '/admin/panel/compras', icon: TYPE_META.shopping.icon, categoryLabel: TYPE_META.shopping.label, badgeColor: TYPE_META.shopping.color, rawTitle: s.name });
        }
      });

      prj.data?.forEach(p => {
        if (!term || p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term)) {
          push({ id: p.id, type: 'project', title: `${p.emoji || '🎨'} ${p.name}`, subtitle: p.category, path: '/admin/panel/proyectos', icon: TYPE_META.project.icon, categoryLabel: TYPE_META.project.label, badgeColor: TYPE_META.project.color, rawTitle: p.name });
        }
      });

      chk.data?.forEach(c => {
        if (!term || c.title.toLowerCase().includes(term) || c.category?.toLowerCase().includes(term)) {
          push({ id: c.id, type: 'checklist', title: c.title, subtitle: c.category, path: '/admin/panel/checklist', icon: TYPE_META.checklist.icon, categoryLabel: TYPE_META.checklist.label, badgeColor: TYPE_META.checklist.color, rawTitle: c.title });
        }
      });

      rec.data?.forEach(r => {
        if (!term || r.name.toLowerCase().includes(term) || r.category?.toLowerCase().includes(term) || r.description?.toLowerCase().includes(term)) {
          push({ id: r.id, type: 'recipe', title: `${r.emoji || '🍽️'} ${r.name}`, subtitle: r.category, path: '/admin/panel/recetas', icon: TYPE_META.recipe.icon, categoryLabel: TYPE_META.recipe.label, badgeColor: TYPE_META.recipe.color, rawTitle: r.name });
        }
      });

      fin.data?.forEach(f => {
        if (!term || f.concept.toLowerCase().includes(term) || f.category?.toLowerCase().includes(term)) {
          push({ id: f.id, type: 'finance', title: f.concept, subtitle: `$${f.amount} · ${f.category}`, path: '/admin/panel/finanzas', icon: TYPE_META.finance.icon, categoryLabel: TYPE_META.finance.label, badgeColor: TYPE_META.finance.color, rawTitle: f.concept });
        }
      });

      setResults(items);
      setActiveIndex(-1);
    } catch (err) {
      console.error('Error en búsqueda global:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const saveApiKey = () => {
    const key = tempApiKeyInput.trim();
    if (!key) return;
    localStorage.setItem('ac_gemini_api_key', key);
    setApiKey(key);
    setShowKeyConfig(false);
    toast.success('¡Gemini API Key guardada!');
  };

  const getActiveApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY || apiKey || localStorage.getItem('ac_gemini_api_key') || '';
  };

  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = aiPrompt.trim();
    if (!promptText || aiThinking) return;

    const currentKey = getActiveApiKey();

    if (!currentKey) {
      setShowKeyConfig(true);
      return;
    }

    const newChat: ChatMessage[] = [...aiChat, { role: 'user', content: promptText }];
    setAiChat(newChat);
    setAiPrompt('');
    setAiThinking(true);

    try {
      // Fetch full database snapshot for context
      const [exp, tsk, dbt, vlt, shp, rem, nts, prj, chk, rec] = await Promise.all([
        supabase.from('finance_expenses').select('amount, category, date, concept').order('date', { ascending: false }).limit(25),
        supabase.from('tasks').select('title, completed, due_date').order('created_at', { ascending: false }).limit(25),
        supabase.from('debts').select('debtor_name, amount, concept, settled').order('created_at', { ascending: false }).limit(25),
        supabase.from('vault_items').select('title, category').limit(25),
        supabase.from('shopping_list').select('name, location, bought, quantity').limit(25),
        supabase.from('reminders').select('title, category, date, time').order('date', { ascending: false }).limit(25),
        supabase.from('notes').select('title, category, content').order('created_at', { ascending: false }).limit(25),
        supabase.from('creative_projects').select('name, category, status, description').limit(25),
        supabase.from('monthly_checklist_items').select('title, category').limit(25),
        supabase.from('recipes').select('name, category, ingredients, description').limit(25),
      ]);

      const formattedContext = `
📌 TAREAS:
${tsk.data?.map(t => `- [${t.completed ? 'Completada' : 'Pendiente'}] ${t.title}${t.due_date ? ` (Vence: ${t.due_date})` : ''}`).join('\n') || 'Ninguna'}

💰 DEUDAS / CUENTAS POR COBRAR:
${dbt.data?.map(d => `- [${d.settled ? 'Cobrada' : 'Pendiente'}] ${d.debtor_name}: $${d.amount}${d.concept ? ` (${d.concept})` : ''}`).join('\n') || 'Ninguna'}

📊 GASTOS RECIENTES:
${exp.data?.map(e => `- $${e.amount} [${e.category}] ${e.concept || ''} (${e.date})`).join('\n') || 'Ninguno'}

🍽️ RECETAS GUARDADAS:
${rec.data?.map(r => `- ${r.name} [Categoría: ${r.category}]${r.ingredients ? ` (Ingredientes: ${r.ingredients.map((i: any) => i.name).join(', ')})` : ''}`).join('\n') || 'Ninguna'}

🎨 PROYECTOS CREATIVOS:
${prj.data?.map(p => `- ${p.name} [Categoría: ${p.category}, Estado: ${p.status}]${p.description ? `: ${p.description}` : ''}`).join('\n') || 'Ninguno'}

📅 FECHAS / RECORDATORIOS:
${rem.data?.map(r => `- ${r.title} [${r.category}] Fecha: ${r.date || 'Sin fecha'}${r.time ? ` ${r.time}` : ''}`).join('\n') || 'Ninguno'}

🔒 BÓVEDA (TÍTULOS):
${vlt.data?.map(v => `- ${v.title} [${v.category}]`).join('\n') || 'Ninguno'}

📝 NOTAS IMPORTANTES:
${nts.data?.map(n => `- ${n.title} [${n.category}]: ${n.content?.slice(0, 100) || ''}`).join('\n') || 'Ninguna'}

🛒 LISTA DE COMPRAS:
${shp.data?.map(s => `- [${s.bought ? 'Comprado' : 'Por comprar'}] ${s.name}${s.location ? ` @ ${s.location}` : ''}`).join('\n') || 'Ninguna'}

📋 CHECKLIST MENSUAL:
${chk.data?.map(c => `- ${c.title} [${c.category}]`).join('\n') || 'Ninguno'}
`.trim();

      const userPromptBody = `DATOS ACTUALES DEL PANEL:\n${formattedContext}\n\nPREGUNTA DE ANDRÉS: "${promptText}"`;

      let answer = '';
      let lastError = '';

      // Dynamic Discovery via ListModels API
      let discoveredModels: string[] = [];
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${currentKey}`);
        const listData = await listRes.json();
        if (listData.models && Array.isArray(listData.models)) {
          discoveredModels = listData.models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));
        }
      } catch (e) {
        // Fallback
      }

      const fallbackList = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash-8b',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ];

      const candidateModels = Array.from(new Set([...discoveredModels, ...fallbackList]));

      const requestPayload = {
        system_instruction: {
          parts: [{
            text: `Eres el Asistente Privado de Andrés en su panel personal.
REGLAS OBLIGATORIAS:
1. Responde DIRECTAMENTE a Andrés en español con un tono humano, atento, útil y profesional.
2. NUNCA escribas tu proceso de pensamiento, planeación, "thinking", razonamiento ni análisis interno en inglés ni en español.
3. NO incluyas encabezados como "User:", "Context:", "Role:", "Input Data:", "Drafting the response:", etc.
4. Responde con un formato limpio y estructurado usando viñetas o números cuando des listas.`
          }]
        },
        contents: [{ parts: [{ text: userPromptBody }] }]
      };

      for (const modelName of candidateModels) {
        for (const apiVer of ['v1beta', 'v1']) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/${apiVer}/models/${modelName}:generateContent?key=${currentKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
              }
            );
            const data = await res.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              answer = data.candidates[0].content.parts[0].text;
              break;
            }
            if (data.error) {
              lastError = data.error.message;
            }
          } catch (e: any) {
            lastError = e.message;
          }
        }
        if (answer) break;
      }

      if (!answer) {
        throw new Error(lastError || 'No se pudo obtener respuesta de la API.');
      }

      // Sanitize any residual thinking/scratchpad text just in case
      let cleanAnswer = answer;
      if (cleanAnswer.includes('Drafting the response:') || cleanAnswer.includes('Drafting response:')) {
        cleanAnswer = cleanAnswer.split(/Drafting (?:the )?response:/i).pop() || cleanAnswer;
      }
      cleanAnswer = cleanAnswer
        .split('\n')
        .filter(line => !/^\s*\*\s*(User|Context|Role|Input Data|User Question|I need to|Specifically|Constraint Check):/i.test(line))
        .join('\n')
        .trim();

      setAiChat([...newChat, { role: 'assistant', content: cleanAnswer }]);
    } catch (err: any) {
      toast.error('Error al consultar IA: ' + err.message);
      setAiChat([...newChat, { role: 'assistant', content: '❌ Ocurrió un error al consultar la API de Gemini: ' + err.message }]);
    } finally {
      setAiThinking(false);
    }
  };


  const handleTogglePin = (e: React.MouseEvent, res: SearchResult) => {
    e.stopPropagation();
    const isNowPinned = togglePinItem({ id: res.id, type: res.type, title: res.title, subtitle: res.subtitle, path: res.path });
    toast.info(isNowPinned ? '¡Fijado en el inicio! 📌' : 'Desfijado del inicio');
    setResults([...results]);
  };

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = r.categoryLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const flatResults = results;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-12 md:pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-lg"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-3xl border border-gray-200/60 dark:border-gray-800/60 shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header / Mode Selector */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800/80 space-y-3">
              <div className="flex items-center justify-between">
                {/* Mode Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl">
                  <button
                    onClick={() => setMode('search')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all ${
                      mode === 'search'
                        ? 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <HiOutlineSearch className="text-sm" />
                    <span>Buscador</span>
                  </button>
                  <button
                    onClick={() => setMode('ai')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all ${
                      mode === 'ai'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <HiSparkles className="text-sm text-amber-300 animate-pulse" />
                    <span>Asistente IA</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {mode === 'ai' && (
                    <button
                      onClick={() => setShowKeyConfig(!showKeyConfig)}
                      className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                      title="Configurar Gemini API Key (100% Gratis)"
                    >
                      <HiOutlineKey className="text-base" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    <HiOutlineX className="text-base" />
                  </button>
                </div>
              </div>

              {/* Input for Search Mode */}
              {mode === 'search' && (
                <div className="flex items-center gap-3">
                  {searching ? (
                    <div className="size-5 border-2 border-gray-300 dark:border-gray-600 border-t-[var(--vibrant-sky-blue)] rounded-full animate-spin shrink-0" />
                  ) : (
                    <HiOutlineSearch className="text-xl text-gray-400 dark:text-gray-500 shrink-0" />
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar en todo el panel (Notas, Tareas, Fechas, Recetas...)"
                    className="flex-1 bg-transparent font-inter text-base text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                      <HiOutlineX className="text-sm" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ═══ MODE: SEARCH ═══ */}
            {mode === 'search' && (
              <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-none min-h-[300px]">
                {searching ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <div className="skeleton size-10 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-4 w-3/5 rounded-lg" />
                          <div className="skeleton h-3 w-2/5 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="text-4xl">🔍</div>
                    <p className="font-dm-sans font-bold text-gray-700 dark:text-gray-300">
                      {query ? 'Sin resultados' : 'Empieza a escribir...'}
                    </p>
                    <p className="font-inter text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
                      {query
                        ? `No se encontró nada para "${query}" en ningún módulo.`
                        : 'Busca en notas, tareas, fechas, recetas, proyectos y más.'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3">
                    {Object.entries(grouped).map(([category, items]) => (
                      <div key={category} className="mb-4">
                        <div className="px-3 py-1.5 mb-1">
                          <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            {category} · {items.length}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {items.map(res => {
                            const globalIdx = flatResults.indexOf(res);
                            const pinned = isItemPinned(res.id);
                            const isActive = globalIdx === activeIndex;
                            const IconComp = res.icon;

                            return (
                              <motion.div
                                key={res.id}
                                data-idx={globalIdx}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleSelectResult(res.path, res)}
                                onMouseEnter={() => setActiveIndex(globalIdx)}
                                className={`group flex items-center justify-between gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${res.badgeColor}`}>
                                    <IconComp className="text-base" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-dm-sans font-bold text-sm text-gray-900 dark:text-gray-100 truncate leading-snug">
                                      <HighlightText text={res.title} query={query} />
                                    </p>
                                    {res.subtitle && (
                                      <p className="font-inter text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                        <HighlightText text={res.subtitle} query={query} />
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={e => handleTogglePin(e, res)}
                                    className={`p-1.5 rounded-xl transition-all ${
                                      pinned
                                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                        : 'text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                    }`}
                                    title={pinned ? 'Desfijar' : 'Fijar en inicio'}
                                  >
                                    <span className="text-sm">{pinned ? '📌' : '📍'}</span>
                                  </button>
                                  <HiOutlineArrowRight className={`text-sm text-gray-300 dark:text-gray-600 transition-all ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`} />
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ MODE: AI ASSISTANT ═══ */}
            {mode === 'ai' && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-[360px]">
                {/* API Key Config Banner / Modal */}
                {(!getActiveApiKey() || showKeyConfig) && (
                  <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/50 dark:border-amber-900/40 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-syne text-xs font-bold uppercase tracking-wider">
                        <HiOutlineKey className="text-base" />
                        <span>Configurar Gemini API Key (100% Gratis)</span>
                      </div>
                      {getActiveApiKey() && (
                        <button onClick={() => setShowKeyConfig(false)} className="text-xs text-gray-400 hover:text-gray-600">Ocultar</button>
                      )}
                    </div>
                    <p className="font-inter text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                      Google ofrece llaves de API gratuitas con 15 consultas por minuto. Consigue la tuya en 1 clic en{' '}
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold hover:text-amber-900 dark:hover:text-amber-100">
                        Google AI Studio
                      </a>{' '}
                      y pégala aquí:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={tempApiKeyInput}
                        onChange={e => setTempApiKeyInput(e.target.value)}
                        className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900 rounded-xl outline-none font-mono text-xs text-gray-900 dark:text-gray-100"
                      />
                      <button
                        onClick={saveApiKey}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none min-h-[220px]">
                  {aiChat.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="size-14 bg-indigo-100 dark:bg-indigo-950/60 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto text-2xl">
                        <HiOutlineSparkles />
                      </div>
                      <p className="font-dm-sans font-bold text-base text-gray-900 dark:text-gray-100">
                        ¡Hola! Soy tu asistente de panel personal.
                      </p>
                      <p className="font-inter text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">
                        Tengo acceso a la información de tus tareas, deudas, recetas, proyectos y finanzas para ayudarte a tomar decisiones o consultar datos.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {[
                          '¿Qué deudas tengo pendientes?',
                          '¿Qué tareas tengo para hoy?',
                          'Dime ideas de cena con mis recetas',
                          '¿Cuánto he gastado este mes?',
                        ].map(q => (
                          <button
                            key={q}
                            onClick={() => { setAiPrompt(q); }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-inter transition-all"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    aiChat.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-syne font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 px-1">
                            <HiSparkles className="text-xs" />
                            <span>Asistente IA</span>
                          </div>
                        )}
                        <div
                          className={`shadow-sm ${
                            msg.role === 'user'
                              ? 'max-w-[85%] px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none font-inter text-sm leading-relaxed border border-blue-500/20'
                              : 'max-w-[96%] p-6 sm:p-7 bg-gray-100/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 rounded-3xl rounded-tl-none border border-gray-200/70 dark:border-gray-800/70'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                          ) : (
                            <MarkdownRenderer content={msg.content} />
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}

                  {aiThinking && (
                    <div className="flex items-center gap-2 text-xs font-syne font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 p-2">
                      <div className="size-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Analizando tu información en el panel...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleAskAI} className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/50">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Hazle una consulta a tu información..."
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800 rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all"
                  />
                  {aiChat.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAiChat([])}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                      title="Borrar chat"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || aiThinking}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
                  >
                    <HiOutlinePaperAirplane className="text-base rotate-90" />
                  </button>
                </form>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50/60 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[10px] font-syne font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {mode === 'search' ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[9px]">↑↓</kbd>
                      Navegar
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[9px]">↵</kbd>
                      Abrir
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[9px]">ESC</kbd>
                      Cerrar
                    </span>
                  </div>
                  {results.length > 0 && <span>{results.length} resultado{results.length !== 1 ? 's' : ''}</span>}
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span>Asistente con IA (Gemini 1.5 Flash - 100% Gratis)</span>
                  <span>ESC para cerrar</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
