import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCamera, HiOutlineUpload, HiX, HiOutlineCheckCircle } from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import CustomDatePicker from '@/components/common/CustomDatePicker';

interface TicketScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface ScannedResult {
  store: string;
  concept: string;
  amount: string;
  category: 'comida' | 'insumos' | 'servicios';
  date: string;
  items: { name: string; price: number }[];
}

/**
 * Compresses an image file purely in the browser (max 1024px, JPEG 0.72)
 * without uploading anything to Supabase Storage (0 bytes stored).
 */
async function compressImageToBase64(file: File): Promise<{ base64: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen en el navegador.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ base64, previewUrl: dataUrl });
      };
      img.onerror = () => reject(new Error('Archivo de imagen inválido.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo.'));
    reader.readAsDataURL(file);
  });
}

function getGeminiApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (envKey) return envKey;
  try {
    return localStorage.getItem('ac_gemini_api_key') || '';
  } catch {
    return '';
  }
}

export default function TicketScannerModal({ isOpen, onClose, onSaved }: TicketScannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanned, setScanned] = useState<ScannedResult | null>(null);
  const { toast } = useToast();

  const resetAndClose = () => {
    setPreviewUrl(null);
    setScanned(null);
    setAnalyzing(false);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      toast.error('Configura tu VITE_GEMINI_API_KEY o clave en Buscar/IA para usar el escáner.');
      return;
    }

    setAnalyzing(true);
    setScanned(null);

    try {
      const { base64, previewUrl: compressedPreview } = await compressImageToBase64(file);
      setPreviewUrl(compressedPreview);

      const prompt = `Analiza este ticket o recibo de compra y devuelve ÚNICAMENTE un JSON válido (sin markdown, sin comillas invertidas ni texto adicional) con esta estructura exacta:
{
  "store": "Nombre de la tienda o comercio",
  "concept": "Resumen corto de la compra",
  "amount": 0.00,
  "category": "comida" | "insumos" | "servicios",
  "date": "YYYY-MM-DD",
  "items": [{"name": "Producto", "price": 0.00}]
}
Reglas:
- Si no ves la fecha clara, usa "${new Date().toISOString().split('T')[0]}".
- "amount" debe ser el total final numérico pagado.
- Clasifica en "comida" (despensa, alimentos, restaurantes), "insumos" (limpieza, hogar, farmacia, compras varias) o "servicios" (luz, internet, suscripciones).`;

      const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
      let parsedJson: any = null;
      let lastErr = '';

      for (const model of models) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      {
                        inline_data: {
                          mime_type: 'image/jpeg',
                          data: base64,
                        },
                      },
                    ],
                  },
                ],
              }),
            }
          );

          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleaned = rawText
              .replace(/```json\s*/gi, '')
              .replace(/```\s*/g, '')
              .trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedJson = JSON.parse(jsonMatch[0]);
              break;
            }
          }
          if (data?.error?.message) lastErr = data.error.message;
        } catch (err: any) {
          lastErr = err.message;
        }
      }

      if (!parsedJson) {
        throw new Error(lastErr || 'No se pudieron extraer los datos del ticket.');
      }

      const validCategory: 'comida' | 'insumos' | 'servicios' =
        parsedJson.category === 'insumos' || parsedJson.category === 'servicios'
          ? parsedJson.category
          : 'comida';

      const storeStr = String(parsedJson.store || '').trim();
      const conceptStr = String(parsedJson.concept || storeStr || 'Compra escaneada').trim();

      setScanned({
        store: storeStr,
        concept: storeStr && !conceptStr.toLowerCase().includes(storeStr.toLowerCase())
          ? `${storeStr} — ${conceptStr}`
          : conceptStr,
        amount: parsedJson.amount ? String(Number(parsedJson.amount) || 0) : '',
        category: validCategory,
        date: /^\d{4}-\d{2}-\d{2}$/.test(parsedJson.date || '')
          ? parsedJson.date
          : new Date().toISOString().split('T')[0],
        items: Array.isArray(parsedJson.items) ? parsedJson.items.slice(0, 15) : [],
      });

      toast.success('Ticket leído correctamente. Revisa y guarda ✨');
    } catch (err: any) {
      toast.error('Error al analizar ticket: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanned) return;

    const amountNum = parseFloat(scanned.amount);
    if (!scanned.concept.trim() || isNaN(amountNum) || amountNum <= 0) {
      toast.error('Verifica el concepto y un monto mayor a 0.');
      return;
    }

    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Sesión no iniciada.');

      const basePayload: Record<string, any> = {
        user_id: user.id,
        category: scanned.category,
        concept:
          scanned.category === 'servicios'
            ? `[Ocasional] ${scanned.concept.trim()}`
            : scanned.concept.trim(),
        amount: amountNum,
        created_at: new Date(`${scanned.date}T12:00:00Z`).toISOString(),
      };

      const { error } = await supabase
        .from('finance_expenses')
        .insert([{ ...basePayload, date: scanned.date }]);

      if (error) {
        const retry = await supabase.from('finance_expenses').insert([basePayload]);
        if (retry.error) throw retry.error;
      }

      window.dispatchEvent(new Event('ac_finance_changed'));
      toast.success(`Gasto de $${amountNum.toLocaleString()} registrado en Finanzas`);
      onSaved?.();
      resetAndClose();
    } catch (err: any) {
      toast.error('Error al guardar gasto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetAndClose();
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 18 }}
            className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-xl w-full border-none shadow-2xl cursor-default overflow-hidden"
          >
            {/* 1. Sticky Header */}
            <div className="flex items-center justify-between p-6 sm:p-7 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h2 className="font-dm-sans text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Escáner de Tickets
                </h2>
                <p className="font-inter text-xs text-gray-400">
                  Extrae monto, fecha y categoría directo en memoria (0 bytes en la nube).
                </p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* 2. Scrollable Body */}
            <form onSubmit={handleSaveExpense} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 sm:p-7 overflow-y-auto flex-1 min-h-0 space-y-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Capture Trigger */}
                <button
                  type="button"
                  disabled={analyzing}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[48px] py-4 px-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[var(--vibrant-sky-blue)] bg-gray-50/70 dark:bg-gray-800/60 transition-all flex items-center justify-center gap-3 text-gray-700 dark:text-gray-200 font-syne text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <div className="size-4 border-2 border-[var(--vibrant-sky-blue)]/30 border-t-[var(--vibrant-sky-blue)] rounded-full animate-spin" />
                      <span>Leyendo ticket con IA...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineCamera className="text-xl text-[var(--vibrant-sky-blue)]" />
                      <span>Usar cámara de tu dispositivo o subir foto</span>
                      <HiOutlineUpload className="text-base opacity-60" />
                    </>
                  )}
                </button>

                {previewUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-48 bg-black/5 flex items-center justify-center">
                    <img src={previewUrl} alt="Vista previa del ticket" className="max-h-48 object-contain" />
                  </div>
                )}

                {scanned && (
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        Concepto / Comercio *
                      </label>
                      <input
                        type="text"
                        required
                        value={scanned.concept}
                        onChange={(e) => setScanned({ ...scanned, concept: e.target.value })}
                        className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                          Total ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={scanned.amount}
                          onChange={(e) => setScanned({ ...scanned, amount: e.target.value })}
                          className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-dm-sans font-bold text-sm text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                          Categoría
                        </label>
                        <CustomSelect
                          value={scanned.category}
                          onChange={(val) => setScanned({ ...scanned, category: val as any })}
                          options={[
                            { value: 'comida', label: '🍔 Comida' },
                            { value: 'insumos', label: '🛒 Insumos' },
                            { value: 'servicios', label: '⚡ Servicios' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                          Fecha
                        </label>
                        <CustomDatePicker
                          value={scanned.date}
                          onChange={(val) => setScanned({ ...scanned, date: val })}
                        />
                      </div>
                    </div>

                    {scanned.items.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/70 space-y-2">
                        <span className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          Conceptos detectados ({scanned.items.length})
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto text-xs font-inter text-gray-600 dark:text-gray-300">
                          {scanned.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between gap-2">
                              <span className="truncate">{it.name}</span>
                              <span className="font-dm-sans font-semibold shrink-0">
                                ${Number(it.price || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Sticky Footer */}
              <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-5 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                {scanned && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <HiOutlineCheckCircle className="text-base" />
                    <span>{saving ? 'Guardando...' : 'Guardar Gasto'}</span>
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
