import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSparkles,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineKey,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineLightningBolt,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
};

const SUGGESTED_PROMPTS = [
  '📊 ¿Cuál es el resumen de mis finanzas este mes?',
  '✅ ¿Qué tareas o fechas importantes tengo pendientes?',
  '🍽️ ¿Qué puedo cocinar según mis recetas guardadas?',
  '🎨 Resumen del avance de mis proyectos creativos',
];

const LOCAL_KEY_STORAGE = 'ac_gemini_api_key_v1';

export default function Asistente() {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingContext, setFetchingContext] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // 1. Check environment variable first, then localStorage
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    const storedKey = localStorage.getItem(LOCAL_KEY_STORAGE);

    if (envKey) {
      setApiKey(envKey);
    } else if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowKeyInput(true);
    }

    // Load initial welcome message
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: '¡Hola, Andrés! 👋 Soy tu **Asistente de IA**. Tengo acceso directo al estado actual de tus **Finanzas, Tareas, Recordatorios, Recetas, Bóveda, Deudas, Proyectos y Checklists**.\n\n¿En qué te puedo ayudar hoy?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempKey.trim()) {
      toast.error('Ingresa una API Key válida');
      return;
    }
    const cleanKey = tempKey.trim();
    localStorage.setItem(LOCAL_KEY_STORAGE, cleanKey);
    setApiKey(cleanKey);
    setShowKeyInput(false);
    toast.success('¡API Key de Gemini guardada!');
  };

  const handleClearApiKey = () => {
    localStorage.removeItem(LOCAL_KEY_STORAGE);
    setApiKey('');
    setShowKeyInput(true);
    toast.info('API Key removida');
  };

  /**
   * Fetches data snapshot from all Supabase tables to feed as context into Gemini
   */
  const buildDatabaseContext = async () => {
    setFetchingContext(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';

      const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      const [exp, sal, tsk, dbt, vlt, shp, rem, nts, prj, chk, rec] = await Promise.all([
        supabase.from('finance_expenses').select('title, amount, category, date').order('created_at', { ascending: false }).limit(15),
        supabase.from('finance_salary').select('monthly_salary').eq('user_id', user.id).single(),
        supabase.from('tasks').select('title, description, completed, due_date').eq('completed', false).limit(15),
        supabase.from('debts').select('debtor_name, amount, concept, settled').eq('settled', false).limit(10),
        supabase.from('vault_items').select('title, category').limit(10),
        supabase.from('shopping_list').select('name, location, bought').eq('bought', false).limit(15),
        supabase.from('reminders').select('title, category, date, time').limit(15),
        supabase.from('notes').select('title, category, content').order('created_at', { ascending: false }).limit(10),
        supabase.from('creative_projects').select('name, category, status, description, tasks').limit(10),
        supabase.from('monthly_checklist_logs').select('item_id, completed').eq('month_year', currentMonthYear).eq('user_id', user.id),
        supabase.from('recipes').select('name, category, ingredients, description').limit(15),
      ]);

      const monthlySalary = sal.data?.monthly_salary || 0;
      const totalExpenses = exp.data?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;
      const totalPendingDebts = dbt.data?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

      const contextText = `
=== ESTADO ACTUAL DE LA BASE DE DATOS DE ANDRÉS ===
Fecha Actual: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

1. FINANZAS:
- Salario mensual configurado: $${monthlySalary}
- Total gastado este mes: $${totalExpenses}
- Últimos gastos: ${JSON.stringify(exp.data || [])}

2. TAREAS PENDIENTES (${tsk.data?.length || 0}):
${JSON.stringify(tsk.data || [])}

3. CUENTAS POR COBRAR / DEUDAS PENDIENTES (Total: $${totalPendingDebts}):
${JSON.stringify(dbt.data || [])}

4. PRÓXIMAS FECHAS Y RECORDATORIOS:
${JSON.stringify(rem.data || [])}

5. LISTA DE COMPRAS PENDIENTES:
${JSON.stringify(shp.data || [])}

6. NOTAS RECIENTES:
${JSON.stringify(nts.data || [])}

7. PROYECTOS CREATIVOS:
${JSON.stringify(prj.data || [])}

8. RECETAS DE COCINA GUARDADAS:
${JSON.stringify(rec.data || [])}

9. CHECKLIST DEL MES ACTUAL:
${JSON.stringify(chk.data || [])}

10. BÓVEDA SEGURA (Títulos):
${JSON.stringify(vlt.data || [])}
===================================================
`;

      return contextText;
    } catch (err) {
      console.error('Error al armar contexto de BD:', err);
      return '';
    } finally {
      setFetchingContext(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    if (!apiKey) {
      setShowKeyInput(true);
      toast.error('Por favor ingresa tu API Key de Google Gemini');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      // 1. Build DB context
      const dbContext = await buildDatabaseContext();

      // 2. Prepare conversation contents for Gemini REST API
      const systemInstruction = `EresAntigravity AI, el asistente personal inteligente de Andrés Cordero.
Tienes acceso directo al snapshot en tiempo real de su base de datos personal.
Tu trabajo es responder sus preguntas de forma amable, estructurada, precisa y clara, en español.
Utiliza formato Markdown (viñetas, negritas, emojis) para que las respuestas sean muy legibles.
Si te pregunta sobre algo que no está en los datos, indícaselo con amabilidad.`;

      const promptWithContext = `${dbContext}\n\nPregunta del usuario: ${textToSend.trim()}`;

      // Call Gemini 1.5 Flash API endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [
              ...messages
                .filter(m => m.id !== 'welcome')
                .map(m => ({
                  role: m.sender === 'user' ? 'user' : 'model',
                  parts: [{ text: m.text }],
                })),
              {
                role: 'user',
                parts: [{ text: promptWithContext }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Error en Gemini API');
      }

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta en este momento.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      toast.error('Error al conectar con Gemini: ' + err.message);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ **Ocurrió un error:** ${err.message}. Verifica que tu API Key sea correcta o intenta nuevamente.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Chat limpiado. ¿Qué otra consulta deseas hacer sobre tus datos?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    toast.info('Historial de chat limpiado');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white flex items-center gap-3">
            <span className="p-2 bg-gradient-to-tr from-blue-600 to-sky-400 text-white rounded-2xl shadow-lg">
              <HiOutlineSparkles className="text-2xl animate-pulse" />
            </span>
            Asistente <span className="text-gradient">IA</span>
          </h1>
          <p className="font-inter mt-1.5 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Consultas inteligentes sobre tus finanzas, tareas, recetas y datos en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all flex items-center gap-2 border shadow-sm ${
              apiKey
                ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                : 'bg-amber-500 text-white border-amber-500 animate-bounce'
            }`}
          >
            <HiOutlineKey className="text-base" />
            <span>{apiKey ? 'Configurar Key' : 'Ingresar API Key'}</span>
          </button>

          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 rounded-2xl transition-all shadow-sm"
              title="Limpiar chat"
            >
              <HiOutlineTrash className="text-lg" />
            </button>
          )}
        </div>
      </header>

      {/* API Key Modal / Drawer */}
      <AnimatePresence>
        {showKeyInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-300 dark:border-amber-700/60 p-6 rounded-3xl space-y-4 shadow-lg">
              <div className="flex items-start gap-3">
                <HiOutlineLightningBolt className="text-2xl text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-dm-sans font-bold text-base text-gray-900 dark:text-gray-100">
                    Llave API de Google Gemini (100% Gratuita)
                  </h4>
                  <p className="font-inter text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    Para habilitar el asistente con tus datos, necesitas tu clave personal de Gemini. Obtén una gratis en 30 segundos visitando{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold text-amber-600 dark:text-amber-400 hover:opacity-80"
                    >
                      Google AI Studio ↗
                    </a>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveApiKey} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  value={tempKey}
                  onChange={e => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 px-4 py-3 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 rounded-xl outline-none font-mono text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0"
                  >
                    Guardar Key
                  </button>
                  {apiKey && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-red-500 font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-red-50 transition-all shrink-0"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Card */}
      <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden flex flex-col h-[650px]">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="size-10 bg-gradient-to-tr from-blue-600 to-sky-400 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md mt-1">
                  <HiOutlineSparkles className="text-lg" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-5 relative group transition-all shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-black dark:bg-white text-white dark:text-black rounded-tr-none'
                    : 'bg-gray-50/90 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 rounded-tl-none'
                }`}
              >
                <div className="font-inter text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-4 text-[10px] opacity-60">
                  <span className="font-syne font-bold uppercase">{msg.timestamp}</span>

                  <button
                    onClick={() => copyMessage(msg.id, msg.text)}
                    className="hover:opacity-100 transition-opacity p-1"
                    title="Copiar mensaje"
                  >
                    {copiedId === msg.id ? <HiOutlineCheck className="text-emerald-500" /> : <HiOutlineClipboardCopy />}
                  </button>
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="size-10 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  TÚ
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3.5 items-center">
              <div className="size-10 bg-gradient-to-tr from-blue-600 to-sky-400 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                <HiOutlineSparkles className="text-lg animate-spin" />
              </div>
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/80 rounded-3xl rounded-tl-none border border-gray-100 dark:border-gray-700/60 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="size-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-2 bg-blue-500 rounded-full animate-bounce" />
                </div>
                <span className="font-syne text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {fetchingContext ? 'Leyendo base de datos...' : 'Pensando respuesta...'}
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Chips */}
        {messages.length < 3 && (
          <div className="px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-gray-100/50 dark:border-gray-800/50">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-3.5 py-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-inter font-medium whitespace-nowrap transition-all shrink-0 active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800/80 flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            disabled={loading}
            placeholder="Pregunta lo que quieras sobre tus datos..."
            className="flex-1 px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="p-3.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 shrink-0"
          >
            <HiOutlinePaperAirplane className="text-xl rotate-90" />
          </button>
        </form>
      </div>
    </div>
  );
}
