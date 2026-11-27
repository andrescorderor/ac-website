import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchWithCache, invalidateCache } from '@/lib/cache';
import { motion, AnimatePresence } from 'framer-motion';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { parseTaskMeta, serializeDescriptionWithMeta } from '@/lib/taskMeta';
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
  HiOutlineExternalLink,
  HiOutlineDatabase,
  HiOutlineBriefcase,
} from 'react-icons/hi';
import { FaDumbbell } from 'react-icons/fa';
import { useToast } from '@/components/common/ToastContext';

type ResultType = 'note' | 'task' | 'debt' | 'vault' | 'shopping' | 'reminder' | 'project' | 'checklist' | 'recipe' | 'finance' | 'plant' | 'bookmark' | 'workout' | 'lead' | 'backup';

type AiActionPayload = {
  type: 'create_task' | 'create_expense' | 'create_mandado' | 'create_note';
  summary: string;
  payload: Record<string, any>;
};

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
  action?: AiActionPayload;
  actionExecuted?: boolean;
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
  plant:     { label: 'Planta',        icon: HiOutlineSparkles,      color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
  bookmark:  { label: 'Enlace',        icon: HiOutlineExternalLink,  color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' },
  workout:   { label: 'Rutina Gym',    icon: FaDumbbell,             color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' },
  lead:      { label: 'Prospecto CRM', icon: HiOutlineBriefcase,     color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
  backup:    { label: 'Sistema',       icon: HiOutlineDatabase,      color: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300' },
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

function readStoredGeminiKey(): string {
  try {
    return localStorage.getItem('ac_gemini_api_key') || '';
  } catch {
    return '';
  }
}

function writeStoredGeminiKey(key: string): void {
  try {
    localStorage.setItem('ac_gemini_api_key', key);
  } catch {
    // Ignore storage access errors in private browsing modes
  }
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [mode, setMode] = useState<'search' | 'ai'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // AI Assistant State
  const [apiKey, setApiKey] = useState<string>(() => {
    return import.meta.env.VITE_GEMINI_API_KEY || readStoredGeminiKey();
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
      // Use cached lightweight snapshot of the user's data with 2-minute TTL
      // This loads all lightweight entries once and performs 100% accent-insensitive matching client-side
      const resultsData = await fetchWithCache('search_global_dataset_v4', async () => {
        const [nts, rem, tsk, dbt, vlt, shp, prj, chk, rec, fin, plt, bkmRes, ldsRes] = await Promise.all([
          supabase.from('notes').select('id, title, category, content, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('reminders').select('*').order('created_at', { ascending: false }).limit(200),
          supabase.from('tasks').select('id, title, description, priority, completed, due_date, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('debts').select('*').order('created_at', { ascending: false }).limit(200),
          supabase.from('vault_items').select('id, title, category, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('shopping_list').select('id, name, location, price, bought, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('creative_projects').select('id, name, description, category, status, emoji, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('monthly_checklist_items').select('id, title, category, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('recipes').select('id, name, description, category, emoji, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('finance_expenses').select('id, concept, amount, category, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('plants').select('id, nickname, species, location, notes, emoji, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('bookmarks').select('id, title, url, category, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('public_leads').select('id, full_name, email, company, service_interest, status, source, created_at').order('created_at', { ascending: false }).limit(150),
        ]);

        return { nts, rem, tsk, dbt, vlt, shp, prj, chk, rec, fin, plt, bkmRes, ldsRes };
      }, 2 * 60 * 1000);

      const { nts, rem, tsk, dbt, vlt, shp, prj, chk, rec, fin, plt, bkmRes, ldsRes } = resultsData;

      const items: SearchResult[] = [];
      const push = (r: SearchResult) => items.push(r);

      // Helper function for diacritics removal
      const normalize = (s: string | null | undefined) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      nts.data?.forEach(n => {
        if (n.category?.startsWith('Fitness_Routine_Data:') || n.category?.startsWith('System_Store:')) return;
        const match = !termNorm || normalize(n.title).includes(termNorm) || normalize(n.content).includes(termNorm) || normalize(n.category).includes(termNorm);
        if (match) {
          push({ id: n.id, type: 'note', title: n.title, subtitle: n.category || n.content?.slice(0, 70), path: '/admin/panel/notas', icon: TYPE_META.note.icon, categoryLabel: TYPE_META.note.label, badgeColor: TYPE_META.note.color, rawTitle: n.title });
        }
      });

      // Prompts con Variables (stored in notes System_Store:prompt_templates)
      const promptStoreRow = nts.data?.find(n => n.category === 'System_Store:prompt_templates');
      if (promptStoreRow?.content) {
        try {
          const parsedPrompts = JSON.parse(promptStoreRow.content);
          if (Array.isArray(parsedPrompts)) {
            parsedPrompts.forEach((p: any) => {
              const match = !termNorm || normalize(p.title).includes(termNorm) || normalize(p.category).includes(termNorm) || normalize(p.body).includes(termNorm);
              if (match) {
                push({ id: p.id, type: 'note', title: p.title, subtitle: `Prompt · ${p.category}`, path: '/admin/panel/prompts', icon: TYPE_META.note.icon, categoryLabel: 'Prompts', badgeColor: TYPE_META.backup.color, rawTitle: p.title });
              }
            });
          }
        } catch {}
      }

      rem.data?.forEach(r => {
        const match = !termNorm || normalize(r.title).includes(termNorm) || normalize(r.category).includes(termNorm);
        if (match) {
          push({ id: r.id, type: 'reminder', title: r.title, subtitle: `${r.date || r.event_date || 'Sin fecha'}${r.time ? ` · ${r.time}` : ''}`, path: '/admin/panel/recordatorios', icon: TYPE_META.reminder.icon, categoryLabel: TYPE_META.reminder.label, badgeColor: TYPE_META.reminder.color, rawTitle: r.title });
        }
      });

      tsk.data?.forEach(t => {
        const meta = parseTaskMeta(t);
        const match =
          !termNorm ||
          normalize(t.title).includes(termNorm) ||
          normalize(meta.cleanDescription).includes(termNorm) ||
          normalize(meta.area).includes(termNorm) ||
          normalize(meta.priority).includes(termNorm) ||
          meta.tags.some(tg => normalize(tg).includes(termNorm));
        if (match) {
          const tagsText = meta.tags.length > 0 ? ` · #${meta.tags.join(' #')}` : '';
          push({
            id: t.id,
            type: 'task',
            title: t.title,
            subtitle: `${meta.area} · ${meta.priority}${tagsText} · ${t.completed ? '✓ Completada' : t.due_date ? `Vence: ${t.due_date}` : 'Pendiente'}`,
            path: '/admin/panel/pendientes',
            icon: TYPE_META.task.icon,
            categoryLabel: TYPE_META.task.label,
            badgeColor: TYPE_META.task.color,
            rawTitle: t.title,
          });
        }
      });

      dbt.data?.forEach((d: any) => {
        const isPayable = d.type === 'payable' || (d.concept && d.concept.startsWith('[Yo Debo]'));
        const cleanConcept = d.concept ? d.concept.replace(/^\[(Yo Debo|Me Deben)\]\s*/i, '') : '';
        const match = !termNorm || normalize(d.debtor_name).includes(termNorm) || (cleanConcept && normalize(cleanConcept).includes(termNorm));
        if (match) {
          const typeLabel = isPayable ? 'Yo Debo' : 'Me Deben';
          const statusLabel = d.settled ? (isPayable ? '✓ Pagada' : '✓ Cobrada') : (isPayable ? 'Por Pagar' : 'Por Cobrar');
          push({ 
            id: d.id, 
            type: 'debt', 
            title: `${d.debtor_name} (${typeLabel})`, 
            subtitle: `$${d.amount.toLocaleString()} · ${statusLabel}${cleanConcept ? ` · ${cleanConcept}` : ''}`, 
            path: '/admin/panel/deudas', 
            icon: TYPE_META.debt.icon, 
            categoryLabel: typeLabel, 
            badgeColor: isPayable ? 'rose' : TYPE_META.debt.color, 
            rawTitle: d.debtor_name 
          });
        }
      });

      vlt.data?.forEach(v => {
        const match = !termNorm || normalize(v.title).includes(termNorm) || normalize(v.category).includes(termNorm);
        if (match) {
          const sub = v.category
            ? `${v.category} · 🔒 Contenido protegido en Bóveda`
            : '🔒 Contenido protegido en Bóveda';

          push({ id: v.id, type: 'vault', title: v.title, subtitle: sub, path: '/admin/panel/vault', icon: TYPE_META.vault.icon, categoryLabel: TYPE_META.vault.label, badgeColor: TYPE_META.vault.color, rawTitle: v.title });
        }
      });

      shp.data?.forEach(s => {
        const match = !termNorm || normalize(s.name).includes(termNorm) || normalize(s.location).includes(termNorm);
        if (match) {
          push({ id: s.id, type: 'shopping', title: s.name, subtitle: `${s.bought ? '✓ Comprado' : 'Por comprar'}${s.location ? ` · ${s.location}` : ''}`, path: '/admin/panel/compras', icon: TYPE_META.shopping.icon, categoryLabel: TYPE_META.shopping.label, badgeColor: TYPE_META.shopping.color, rawTitle: s.name });
        }
      });

      prj.data?.forEach(p => {
        const match = !termNorm || normalize(p.name).includes(termNorm) || normalize(p.description).includes(termNorm) || normalize(p.category).includes(termNorm);
        if (match) {
          push({ id: p.id, type: 'project', title: `${p.emoji || '🎨'} ${p.name}`, subtitle: p.category, path: '/admin/panel/proyectos', icon: TYPE_META.project.icon, categoryLabel: TYPE_META.project.label, badgeColor: TYPE_META.project.color, rawTitle: p.name });
        }
      });

      chk.data?.forEach(c => {
        const match = !termNorm || normalize(c.title).includes(termNorm) || normalize(c.category).includes(termNorm);
        if (match) {
          push({ id: c.id, type: 'checklist', title: c.title, subtitle: c.category, path: '/admin/panel/checklist', icon: TYPE_META.checklist.icon, categoryLabel: TYPE_META.checklist.label, badgeColor: TYPE_META.checklist.color, rawTitle: c.title });
        }
      });

      rec.data?.forEach(r => {
        const match = !termNorm || normalize(r.name).includes(termNorm) || normalize(r.category).includes(termNorm) || normalize(r.description).includes(termNorm);
        if (match) {
          push({ id: r.id, type: 'recipe', title: `${r.emoji || '🍽️'} ${r.name}`, subtitle: r.category, path: '/admin/panel/recetas', icon: TYPE_META.recipe.icon, categoryLabel: TYPE_META.recipe.label, badgeColor: TYPE_META.recipe.color, rawTitle: r.name });
        }
      });

      fin.data?.forEach(f => {
        const match = !termNorm || normalize(f.concept).includes(termNorm) || normalize(f.category).includes(termNorm);
        if (match) {
          push({ id: f.id, type: 'finance', title: f.concept, subtitle: `$${f.amount} · ${f.category}`, path: '/admin/panel/finanzas', icon: TYPE_META.finance.icon, categoryLabel: TYPE_META.finance.label, badgeColor: TYPE_META.finance.color, rawTitle: f.concept });
        }
      });

      plt.data?.forEach(p => {
        const match = !termNorm || normalize(p.nickname).includes(termNorm) || normalize(p.species).includes(termNorm) || normalize(p.notes).includes(termNorm);
        if (match) {
          push({ id: p.id, type: 'plant', title: `${p.emoji || '🪴'} ${p.nickname}`, subtitle: `${p.species}${p.location ? ` · ${p.location}` : ''}`, path: '/admin/panel/plantas', icon: TYPE_META.plant.icon, categoryLabel: TYPE_META.plant.label, badgeColor: TYPE_META.plant.color, rawTitle: p.nickname });
        }
      });

      bkmRes.data?.forEach(b => {
        const match = !termNorm || normalize(b.title).includes(termNorm) || normalize(b.url).includes(termNorm) || normalize(b.category).includes(termNorm);
        if (match) {
          push({ id: b.id, type: 'bookmark', title: b.title, subtitle: `${b.category || 'General'} · ${b.url}`, path: '/admin/panel/enlaces', icon: TYPE_META.bookmark.icon, categoryLabel: TYPE_META.bookmark.label, badgeColor: TYPE_META.bookmark.color, rawTitle: b.title });
        }
      });

      ldsRes?.data?.forEach((l: any) => {
        const match =
          !termNorm ||
          normalize(l.full_name).includes(termNorm) ||
          normalize(l.email).includes(termNorm) ||
          normalize(l.company).includes(termNorm) ||
          normalize(l.service_interest).includes(termNorm) ||
          normalize(l.status).includes(termNorm);
        if (match) {
          push({
            id: l.id,
            type: 'lead',
            title: l.full_name,
            subtitle: `${l.status} · ${l.service_interest}${l.company ? ` · ${l.company}` : ''}`,
            path: '/admin/panel/leads',
            icon: TYPE_META.lead.icon,
            categoryLabel: TYPE_META.lead.label,
            badgeColor: TYPE_META.lead.color,
            rawTitle: l.full_name,
          });
        }
      });

      // Workout Routines (stored in notes with category Fitness_Routine_Data:)
      nts.data?.filter(n => n.category?.startsWith('Fitness_Routine_Data:')).forEach(w => {
        let routineSub = 'Rutina de Entrenamiento Gym';
        try {
          const parsed = JSON.parse(w.content);
          routineSub = `${parsed.dayType === 'Dia_A' ? '⚡ Día A' : '🔥 Día B'} • ${parsed.focusMuscles} (${parsed.exercises?.length || 0} ejercicios)`;
        } catch {}
        const match = !termNorm || normalize(w.title).includes(termNorm) || normalize(routineSub).includes(termNorm);
        if (match) {
          push({
            id: w.id,
            type: 'workout',
            title: w.title.replace('🏋️ ', ''),
            subtitle: routineSub,
            path: '/admin/panel/entrenamiento',
            icon: TYPE_META.workout.icon,
            categoryLabel: TYPE_META.workout.label,
            badgeColor: TYPE_META.workout.color,
            rawTitle: w.title,
          });
        }
      });

      // Quick navigation to new modules (Backup, Calendar 360, Divisor, CMS, Papelera)
      const moduleShortcuts = [
        { id: 'sys_calendario', title: 'Calendario Maestro 360°', subtitle: 'Agenda unificada de tareas, fechas, plantas y finanzas', path: '/admin/panel/calendario', keywords: ['calendario', 'agenda', '360', 'mes'] },
        { id: 'sys_mandado_scanner', title: 'Escáner de Mandado con Cámara', subtitle: 'Analiza fotos de tickets o lista para completar o agregar mandado', path: '/admin/panel/compras?scan=1', keywords: ['escaner', 'ticket', 'foto', 'camara', 'mandado', 'compras'] },
        { id: 'sys_divisor', title: 'Divisor de Cuentas Grupales', subtitle: 'Cálculo por personas/grupos y envío por WhatsApp', path: '/admin/panel/divisor', keywords: ['divisor', 'cuentas', 'dividir', 'grupos', 'whatsapp'] },
        { id: 'sys_prompts', title: 'Prompts & Variables', subtitle: 'Plantillas dinámicas {{variable}} listas para copiar', path: '/admin/panel/prompts', keywords: ['prompts', 'plantillas', 'variables'] },
        { id: 'sys_leads', title: 'Prospectos CRM (Leads Públicos)', subtitle: 'Seguimiento de clientes llegados desde la web, diagnóstico y asistente', path: '/admin/panel/leads', keywords: ['leads', 'prospectos', 'crm', 'clientes', 'diagnostico', 'ventas'] },
        { id: 'sys_portafolio', title: 'Mini-CMS del Portafolio', subtitle: 'Editar Hero y proyectos de la web pública', path: '/admin/panel/portafolio', keywords: ['portafolio', 'cms', 'hero', 'publico'] },
        { id: 'sys_papelera', title: 'Papelera de Reciclaje (30 días)', subtitle: 'Recuperar elementos eliminados recientemente', path: '/admin/panel/papelera', keywords: ['papelera', 'recuperar', 'eliminados', 'basura'] },
        { id: 'system_backup_module', title: 'Respaldo & Recuperación de Base de Datos', subtitle: 'Centro de exportación total (15 tablas), descarga JSON/CSV y restauración', path: '/admin/panel/respaldo', keywords: ['respaldo', 'backup', 'recuperacion', 'restaurar', 'exportar', 'base de datos'] },
      ];
      moduleShortcuts.forEach((mod) => {
        if (!termNorm || mod.keywords.some(k => k.includes(termNorm) || termNorm.includes(k)) || normalize(mod.title).includes(termNorm)) {
          push({
            id: mod.id,
            type: 'backup',
            title: mod.title,
            subtitle: mod.subtitle,
            path: mod.path,
            icon: TYPE_META.backup.icon,
            categoryLabel: TYPE_META.backup.label,
            badgeColor: TYPE_META.backup.color,
            rawTitle: mod.title,
          });
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
    writeStoredGeminiKey(key);
    setApiKey(key);
    setShowKeyConfig(false);
    toast.success('¡Gemini API Key guardada!');
  };

  const getActiveApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY || apiKey || readStoredGeminiKey();
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
      // Fetch database snapshot for context (vault secret content is never requested or transmitted)
      const aiContextData = await fetchWithCache('ai_db_snapshot_v4', async () => {
        const [exp, tsk, dbt, vlt, shp, rem, nts, prj, chk, rec, plt, bkm, sal, lds] = await Promise.all([
          supabase.from('finance_expenses').select('amount, category, concept, created_at').order('created_at', { ascending: false }).limit(25),
          supabase.from('tasks').select('title, description, priority, completed, due_date').order('created_at', { ascending: false }).limit(25),
          supabase.from('debts').select('*').order('created_at', { ascending: false }).limit(40),
          supabase.from('vault_items').select('id, title, category').limit(25),
          supabase.from('shopping_list').select('name, location, bought, quantity').limit(25),
          supabase.from('reminders').select('*').order('created_at', { ascending: false }).limit(25),
          supabase.from('notes').select('title, category, content').order('created_at', { ascending: false }).limit(25),
          supabase.from('creative_projects').select('name, category, status, description').limit(25),
          supabase.from('monthly_checklist_items').select('title, category').limit(25),
          supabase.from('recipes').select('name, category, ingredients, description').limit(25),
          supabase.from('plants').select('nickname, species, location, watering_frequency_days, last_watered_at').limit(25),
          supabase.from('bookmarks').select('title, url, category').limit(25),
          supabase.from('finance_salary').select('amount').limit(1),
          supabase.from('public_leads').select('full_name, company, service_interest, status, source, created_at').order('created_at', { ascending: false }).limit(20),
        ]);
        return { exp, tsk, dbt, vlt, shp, rem, nts, prj, chk, rec, plt, bkm, sal, lds };
      }, 3 * 60 * 1000);

      const { exp, tsk, dbt, vlt, shp, rem, nts, prj, chk, rec, plt, bkm, sal, lds } = aiContextData;

      const salaryAmount = sal.data?.[0]?.amount || 0;

      // Desglose de deudas: Lo que me deben (Cobrar) vs Lo que yo debo (Pagar)
      const debtsRaw = dbt.data || [];
      const receivablesList = debtsRaw.filter((d: any) => d.type !== 'payable' && !(d.concept && d.concept.startsWith('[Yo Debo]')));
      const payablesList = debtsRaw.filter((d: any) => d.type === 'payable' || (d.concept && d.concept.startsWith('[Yo Debo]')));
      
      const pendingReceivablesTotal = receivablesList.filter((d: any) => !d.settled).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
      const pendingPayablesTotal = payablesList.filter((d: any) => !d.settled).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
      const netDebtsBalance = pendingReceivablesTotal - pendingPayablesTotal;

      const formattedContext = `
💵 SALARIO CONFIGURADO:
- Salario Mensual: $${salaryAmount}
- Salario Quincenal: $${salaryAmount / 2}

📌 TAREAS:
${tsk.data?.map(t => {
  const m = parseTaskMeta(t);
  return `- [${t.completed ? 'Completada' : m.status}] (Área: ${m.area} · Prioridad: ${m.priority}${m.tags.length ? ` · Etiquetas: ${m.tags.join(', ')}` : ''}) ${t.title}${t.due_date ? ` (Vence: ${t.due_date})` : ''}${m.cleanDescription ? ` — Notas: ${m.cleanDescription.slice(0, 80)}` : ''}`;
}).join('\n') || 'Ninguna'}

💰 CUENTAS QUE ME DEBEN (POR COBRAR):
- Total pendiente a mi favor: $${pendingReceivablesTotal}
${receivablesList.map((d: any) => `- [${d.settled ? 'Cobrada' : 'Pendiente'}] ${d.debtor_name}: $${d.amount}${d.concept ? ` (${d.concept.replace(/^\[(Yo Debo|Me Deben)\]\s*/i, '')})` : ''}`).join('\n') || 'Ninguna'}

💳 DEUDAS QUE YO DEBO (POR PAGAR):
- Total pendiente que debo pagar: $${pendingPayablesTotal}
${payablesList.map((d: any) => `- [${d.settled ? 'Pagada' : 'Pendiente'}] A: ${d.debtor_name}: $${d.amount}${d.concept ? ` (${d.concept.replace(/^\[(Yo Debo|Me Deben)\]\s*/i, '')})` : ''}`).join('\n') || 'Ninguna'}

⚖️ BALANCE NETO DEUDAS: ${netDebtsBalance >= 0 ? `+$${netDebtsBalance} (a favor)` : `-$${Math.abs(netDebtsBalance)} (en contra)`}

📊 GASTOS RECIENTES:
${exp.data?.map(e => `- $${e.amount} [${e.category}] ${e.concept || ''} (${(e as any).date || (e.created_at ? e.created_at.split('T')[0] : 'Base')})`).join('\n') || 'Ninguno'}

🍽️ RECETAS GUARDADAS:
${rec.data?.map(r => `- ${r.name} [Categoría: ${r.category}]${r.ingredients ? ` (Ingredientes: ${r.ingredients.map((i: any) => i.name).join(', ')})` : ''}`).join('\n') || 'Ninguna'}

🎨 PROYECTOS CREATIVOS:
${prj.data?.map(p => `- ${p.name} [Categoría: ${p.category}, Estado: ${p.status}]${p.description ? `: ${p.description}` : ''}`).join('\n') || 'Ninguno'}

📅 FECHAS / RECORDATORIOS:
${rem.data?.map(r => `- ${r.title} [${r.category}] Fecha: ${r.date || r.event_date || 'Sin fecha'}${r.time ? ` ${r.time}` : ''}`).join('\n') || 'Ninguno'}

🔒 BÓVEDA (TÍTULOS):
${vlt.data?.map(v => `- ${v.title} [${v.category || 'General'}]`).join('\n') || 'Ninguno'}

📝 NOTAS IMPORTANTES:
${nts.data?.filter(n => !n.category?.startsWith('Fitness_Routine_Data:') && !n.category?.startsWith('System_Store:')).map(n => `- ${n.title} [${n.category}]: ${n.content?.slice(0, 100) || ''}`).join('\n') || 'Ninguna'}

🛒 LISTA DE COMPRAS:
${shp.data?.map(s => `- [${s.bought ? 'Comprado' : 'Por comprar'}] ${s.name}${s.location ? ` @ ${s.location}` : ''}`).join('\n') || 'Ninguno'}

📋 CHECKLIST MENSUAL:
${chk.data?.map(c => `- ${c.title} [${c.category}]`).join('\n') || 'Ninguno'}

🪴 MIS PLANTAS:
${plt.data?.map(p => `- ${p.nickname} (${p.species}) en ${p.location || 'Sin ubicación'}. Riego: cada ${p.watering_frequency_days} días. Último riego: ${p.last_watered_at || 'Sin fecha'}`).join('\n') || 'Ninguno'}

🏋️ RUTINAS DE ENTRENAMIENTO & GYM:
${nts.data?.filter(n => n.category?.startsWith('Fitness_Routine_Data:')).map(w => `- ${w.title}: ${w.content}`).join('\n') || 'Ninguna'}

🔗 ENLACES / MARCADORES:
${bkm.data?.map(b => `- ${b.title} [Categoría: ${b.category || 'General'}]: ${b.url}`).join('\n') || 'Ninguno'}

💼 PROSPECTOS CRM (LEADS WEB):
${lds?.data?.map((l: any) => `- [${l.status}] ${l.full_name}${l.company ? ` (${l.company})` : ''} — ${l.service_interest} (Origen: ${l.source})`).join('\n') || 'Ninguno'}

💾 MÓDULO DE RESPALDO Y RECUPERACIÓN:
- El panel cuenta con un módulo dedicado en /admin/panel/respaldo que cubre las 16 tablas completas de la base de datos (con exportación JSON/CSV y motor de restauración / importación).
`.trim();

      const userPromptBody = `DATOS ACTUALES DEL PANEL:\n${formattedContext}\n\nPREGUNTA DE ANDRÉS: "${promptText}"`;

      let answer = '';
      let lastError = '';

      // Dynamic Discovery via ListModels API
      let discoveredModels: string[] = [];
      try {
        const listRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          headers: { 'x-goog-api-key': currentKey },
        });
        const listData = await listRes.json();
        if (listData.models && Array.isArray(listData.models)) {
          const excluded = ['embedding', 'imagen', 'veo', 'tts', 'audio', 'aqa', 'lyria', 'robotics', 'computer-use'];
          discoveredModels = listData.models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => String(m.name || '').replace(/^models\//, ''))
            .filter(
              (name: string) =>
                name.startsWith('gemini-') && !excluded.some((kw) => name.toLowerCase().includes(kw))
            );
        }
      } catch (e) {
        // Fallback
      }

      const fallbackList = [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
      ];

      const candidateModels = Array.from(new Set([...fallbackList.filter((m) => discoveredModels.length === 0 || discoveredModels.includes(m)), ...discoveredModels, ...fallbackList]));

      const requestPayload = {
        system_instruction: {
          parts: [{
            text: `Eres el Asistente Privado de Andrés en su panel personal.
REGLAS OBLIGATORIAS:
1. Responde DIRECTAMENTE a Andrés en español con un tono humano, atento, útil y profesional.
2. NUNCA escribas tu proceso de pensamiento, planeación, "thinking", razonamiento ni análisis interno en inglés ni en español.
3. NO incluyas encabezados como "User:", "Context:", "Role:", "Input Data:", "Drafting the response:", etc.
4. Responde con un formato limpio y estructurado usando viñetas o números cuando des listas.
5. Si Andrés te pide crear, agregar o registrar una tarea, gasto, producto de mandado o nota, confirma brevemente los detalles y al FINAL de tu respuesta añade exactamente una línea con:
:::ACTION{"type":"create_task"|"create_expense"|"create_mandado"|"create_note","summary":"Resumen corto legible","payload":{...}}:::
Campos por tipo:
- create_task: { "title": "...", "area": "Personal|Trabajo|Social|...", "priority": "Urgente|Alta|Media|Baja", "tags": ["..."], "due_date": "YYYY-MM-DD" o "" }
- create_expense: { "concept": "...", "amount": 0, "category": "comida|insumos|servicios", "date": "YYYY-MM-DD" }
- create_mandado: { "name": "...", "price": 0, "quantity": "1 pza", "location": "" }
- create_note: { "title": "...", "category": "General", "content": "..." }`
          }]
        },
        contents: [{ parts: [{ text: userPromptBody }] }]
      };

      for (const modelName of candidateModels) {
        for (const apiVer of ['v1beta', 'v1']) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/${apiVer}/models/${modelName}:generateContent`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-goog-api-key': currentKey,
                },
                body: JSON.stringify(requestPayload),
              }
            );
            const data = await res.json();
            const parts = data?.candidates?.[0]?.content?.parts;
            const extractedText = Array.isArray(parts)
              ? parts
                  .filter((p: any) => !p.thought && typeof p.text === 'string')
                  .map((p: any) => p.text)
                  .join('\n')
                  .trim()
              : '';
            if (extractedText) {
              answer = extractedText;
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

      // Parse optional :::ACTION{...}::: block
      let parsedAction: AiActionPayload | undefined;
      const actionMatch = cleanAnswer.match(/:::ACTION(\{[\s\S]*?\}):::/);
      if (actionMatch) {
        try {
          parsedAction = JSON.parse(actionMatch[1]) as AiActionPayload;
          cleanAnswer = cleanAnswer.replace(actionMatch[0], '').trim();
        } catch {
          // Ignore malformed JSON action block
        }
      }

      setAiChat([...newChat, { role: 'assistant', content: cleanAnswer, action: parsedAction }]);
    } catch (err: any) {
      toast.error('Error al consultar IA: ' + err.message);
      setAiChat([...newChat, { role: 'assistant', content: '❌ Ocurrió un error al consultar la API de Gemini: ' + err.message }]);
    } finally {
      setAiThinking(false);
    }
  };

  const handleExecuteAiAction = async (msgIndex: number, action: AiActionPayload) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Sesión no iniciada.');

      const p = action.payload || {};

      if (action.type === 'create_task') {
        const cleanArea = String(p.area || 'Personal').trim() || 'Personal';
        const cleanTags = Array.isArray(p.tags) ? p.tags.map((t: any) => String(t).trim()).filter(Boolean) : [];
        const fullPayload: Record<string, any> = {
          user_id: user.id,
          title: String(p.title || action.summary || 'Nueva tarea').trim(),
          description: null,
          priority: p.priority || 'Media',
          area: cleanArea,
          status: 'pending',
          tags: cleanTags,
          due_date: p.due_date || null,
          completed: false,
        };
        const { error } = await supabase.from('tasks').insert([fullPayload]);
        if (error) {
          const fallback = {
            user_id: user.id,
            title: fullPayload.title,
            description: serializeDescriptionWithMeta('', cleanArea, 'pending', cleanTags),
            priority: fullPayload.priority,
            due_date: fullPayload.due_date,
            completed: false,
          };
          const retry = await supabase.from('tasks').insert([fallback]);
          if (retry.error) throw retry.error;
        }
      } else if (action.type === 'create_expense') {
        const dateVal = /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : new Date().toISOString().split('T')[0];
        const cat = p.category === 'insumos' || p.category === 'servicios' ? p.category : 'comida';
        const conceptVal = cat === 'servicios' ? `[Ocasional] ${p.concept || action.summary}` : (p.concept || action.summary);
        const basePayload = {
          user_id: user.id,
          category: cat,
          concept: String(conceptVal).trim(),
          amount: Number(p.amount) || 0,
          created_at: new Date(`${dateVal}T12:00:00Z`).toISOString(),
        };
        const { error } = await supabase.from('finance_expenses').insert([{ ...basePayload, date: dateVal }]);
        if (error) {
          const retry = await supabase.from('finance_expenses').insert([basePayload]);
          if (retry.error) throw retry.error;
        }
        window.dispatchEvent(new Event('ac_finance_changed'));
      } else if (action.type === 'create_mandado') {
        const qtyStr = p.quantity ? ` | Cant: ${p.quantity}` : '';
        const storeStr = p.location ? ` — ${p.location}` : '';
        const payload: Record<string, any> = {
          user_id: user.id,
          name: String(p.name || action.summary).trim(),
          price: p.price ? Number(p.price) : null,
          quantity: p.quantity || null,
          location: `🍔 Comida | 🥗 Semanal${qtyStr}${storeStr}`,
          type: 'semanal',
          category: 'comida',
          priority: 'Media',
          bought: false,
        };
        const { error } = await supabase.from('shopping_list').insert([payload]);
        if (error) {
          delete payload.quantity;
          delete payload.type;
          delete payload.category;
          const retry = await supabase.from('shopping_list').insert([payload]);
          if (retry.error) throw retry.error;
        }
      } else if (action.type === 'create_note') {
        const { error } = await supabase.from('notes').insert([
          {
            user_id: user.id,
            title: String(p.title || action.summary).trim(),
            category: String(p.category || 'General').trim(),
            content: String(p.content || action.summary).trim(),
          },
        ]);
        if (error) throw error;
      }

      invalidateCache('dashboard');
      invalidateCache('search_global');
      invalidateCache('ai_db_snapshot');

      setAiChat((prev) =>
        prev.map((m, idx) => (idx === msgIndex ? { ...m, actionExecuted: true } : m))
      );
      toast.success(`Acción ejecutada: ${action.summary} ✅`);
    } catch (err: any) {
      toast.error('Error al ejecutar acción: ' + err.message);
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
        <div 
          className="fixed inset-0 z-[200] flex items-start justify-center pt-0 md:pt-20 px-0 md:px-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-lg cursor-pointer"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full md:h-auto md:max-w-2xl bg-white dark:bg-gray-950 rounded-none md:rounded-3xl border-none md:border md:border-gray-200/60 md:dark:border-gray-800/60 shadow-none md:shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden z-10 flex flex-col max-h-screen md:max-h-[85vh]"
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
                        className="flex-1 px-4 min-h-[44px] py-2 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900 rounded-xl outline-none font-mono text-xs text-gray-900 dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={saveApiKey}
                        className="px-4 min-h-[44px] py-2 bg-amber-600 hover:bg-amber-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
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
                        Consulta tareas, finanzas, deudas, notas y recetas con Gemini API (el contenido secreto de tu Bóveda nunca se comparte).
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
                            type="button"
                            onClick={() => { setAiPrompt(q); }}
                            className="px-3 min-h-[40px] py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-inter transition-all cursor-pointer"
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
                            <div className="space-y-3">
                              <MarkdownRenderer content={msg.content} />
                              {msg.action && (
                                <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-950 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <span className="block font-syne text-[9px] font-bold uppercase tracking-widest text-indigo-500">
                                      Acción Sugerida
                                    </span>
                                    <p className="font-inter text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                      {msg.action.summary}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={msg.actionExecuted}
                                    onClick={() => handleExecuteAiAction(i, msg.action!)}
                                    className={`px-4 min-h-[44px] py-2 rounded-xl font-syne text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                                      msg.actionExecuted
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 cursor-default'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95'
                                    }`}
                                  >
                                    {msg.actionExecuted ? '✓ Ejecutado' : 'Confirmar y Ejecutar'}
                                  </button>
                                </div>
                              )}
                            </div>
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
                      className="min-w-[44px] min-h-[44px] p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all shrink-0 flex items-center justify-center cursor-pointer"
                      title="Borrar chat"
                      aria-label="Borrar chat"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || aiThinking}
                    aria-label="Enviar consulta"
                    className="min-w-[44px] min-h-[44px] p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
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
