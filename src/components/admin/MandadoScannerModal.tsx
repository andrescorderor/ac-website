import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCamera,
  HiOutlineUpload,
  HiX,
  HiOutlineCheckCircle,
  HiOutlineKey,
  HiOutlineExclamationCircle,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineCheck,
} from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import { invalidateCache } from '@/lib/cache';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import { useAccessibleModal } from '@/components/common/modals/Modal';

interface MandadoScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

interface CatalogMandadoItem {
  id: string;
  name: string;
  location: string | null;
  price: number | null;
  type?: 'semanal' | 'quincenal' | 'ocasional';
  category?: string | null;
  bought: boolean;
  quantity?: string | null;
  purchase_history?: string[] | null;
}

type DraftAction = 'complete' | 'add';

interface DraftMandadoItem {
  uid: string;
  enabled: boolean;
  action: DraftAction;
  matchedId: string;
  name: string;
  price: string;
  quantity: string;
  category: 'comida' | 'insumos';
  frequency: 'semanal' | 'ocasional';
  initialStatus: 'pending' | 'bought';
}

const EXCLUDED_MODEL_KEYWORDS = [
  'embedding',
  'imagen',
  'veo',
  'tts',
  'audio',
  'aqa',
  'lyria',
  'robotics',
  'computer-use',
];
const PREFERRED_VISION_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

const normalize = (s: string | null | undefined) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function isMandadoItem(item: CatalogMandadoItem): boolean {
  if (item.type === 'semanal' || item.type === 'quincenal' || item.type === 'ocasional') return true;
  if (
    item.category === 'semanal' ||
    item.category === 'quincenal' ||
    item.category === 'ocasional' ||
    item.category === 'comida' ||
    item.category === 'insumos'
  ) {
    return true;
  }
  if (
    item.location?.includes('Semanal') ||
    item.location?.includes('Quincenal') ||
    item.location?.includes('Agotar') ||
    item.location?.includes('Agotamiento') ||
    item.location?.includes('Mandado') ||
    item.location?.includes('Comida') ||
    item.location?.includes('Insumos') ||
    item.location?.includes('🍔') ||
    item.location?.includes('🛒') ||
    item.location?.includes('🥗') ||
    item.location?.includes('📦')
  ) {
    return true;
  }
  return false;
}

function getItemType(item: CatalogMandadoItem): 'semanal' | 'ocasional' {
  if (item.type === 'semanal' || item.type === 'quincenal') return 'semanal';
  if (item.type === 'ocasional') return 'ocasional';
  if (item.category === 'semanal' || item.category === 'quincenal') return 'semanal';
  if (item.category === 'ocasional') return 'ocasional';
  if (
    item.location?.includes('Semanal') ||
    item.location?.includes('Quincenal') ||
    item.name.includes('[Semanal]') ||
    item.name.includes('[Quincenal]')
  ) {
    return 'semanal';
  }
  return 'ocasional';
}

function getItemCategory(item: CatalogMandadoItem): 'comida' | 'insumos' {
  if (item.category === 'comida' || item.category === 'insumos') return item.category;
  if (item.location?.includes('Insumos') || item.location?.includes('Casa') || item.location?.includes('🛒')) {
    return 'insumos';
  }
  return 'comida';
}

function getItemQuantity(item: CatalogMandadoItem): string {
  if (item.quantity && String(item.quantity).trim() !== '') return String(item.quantity).trim();
  if (item.location) {
    const match = item.location.match(/Cant:\s*([^—|]+)/i);
    if (match) return match[1].trim();
  }
  return '';
}

function getCleanStoreLocation(location: string | null): string {
  if (!location) return '';
  if (location.includes('—')) {
    const parts = location.split('—');
    return parts[parts.length - 1].trim();
  }
  if (
    location.startsWith('🍔') ||
    location.startsWith('🛒') ||
    location.includes('Semanal') ||
    location.includes('Quincenal') ||
    location.includes('Agotar') ||
    location.includes('Agotamiento')
  ) {
    return '';
  }
  return location.trim();
}

function buildMandadoLocation(
  category: 'comida' | 'insumos',
  frequency: 'semanal' | 'ocasional',
  quantity: string,
  store: string
): string {
  const catText = category === 'comida' ? '🍔 Comida' : '🛒 Insumos';
  const freqText = frequency === 'semanal' ? '🥗 Semanal' : '📦 Hasta Agotar';
  const cantText = quantity.trim() ? ` | Cant: ${quantity.trim()}` : '';
  const cleanStore = store.trim();
  return cleanStore ? `${catText} | ${freqText}${cantText} — ${cleanStore}` : `${catText} | ${freqText}${cantText}`;
}

/**
 * Compresses an image file purely in the browser (max 1200px, JPEG 0.78)
 * without uploading anything to Supabase Storage (0 bytes stored).
 */
async function compressImageToBase64(file: File): Promise<{ base64: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ base64, previewUrl: dataUrl });
      };
      img.onerror = () =>
        reject(new Error('Formato de imagen no compatible en este navegador. Intenta con JPG, PNG o WebP.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo.'));
    reader.readAsDataURL(file);
  });
}

async function resolveVisionModels(apiKey: string): Promise<string[]> {
  let discovered: string[] = [];
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': apiKey },
    });
    if (res.ok) {
      const listData = await res.json();
      if (Array.isArray(listData?.models)) {
        discovered = listData.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => String(m.name || '').replace(/^models\//, ''))
          .filter(
            (name: string) =>
              name.startsWith('gemini-') &&
              !EXCLUDED_MODEL_KEYWORDS.some((kw) => name.toLowerCase().includes(kw))
          );
      }
    }
  } catch {
    // Fall back to static list on network/discovery failure
  }

  const prioritized = PREFERRED_VISION_MODELS.filter(
    (m) => discovered.length === 0 || discovered.includes(m)
  );
  return Array.from(new Set([...prioritized, ...discovered, ...PREFERRED_VISION_MODELS]));
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

function saveStoredGeminiApiKey(key: string): void {
  try {
    localStorage.setItem('ac_gemini_api_key', key);
  } catch {
    // Ignore storage errors in private browsing mode
  }
}

function makeUid(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function MandadoScannerModal({ isOpen, onClose, onApplied }: MandadoScannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [catalog, setCatalog] = useState<CatalogMandadoItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftMandadoItem[]>([]);
  const [detectedStore, setDetectedStore] = useState('');
  const [recordInFinances, setRecordInFinances] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const { toast } = useToast();

  const resetAndClose = () => {
    setPreviewUrl(null);
    setDraftItems([]);
    setDetectedStore('');
    setRecordInFinances(false);
    setScanError(null);
    setShowKeyInput(false);
    setAnalyzing(false);
    onClose();
  };

  useAccessibleModal(isOpen, resetAndClose, panelRef);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoadingCatalog(true);
    supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        const raw = (data || []) as CatalogMandadoItem[];
        const onlyMandado = raw.filter(isMandadoItem);
        const deduped = onlyMandado.filter(
          (item, index, self) =>
            index === self.findIndex((t) => normalize(t.name) === normalize(item.name))
        );
        setCatalog(deduped);
        setLoadingCatalog(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const catalogSelectOptions = useMemo(() => {
    const pendingFirst = [...catalog].sort((a, b) => Number(a.bought) - Number(b.bought));
    return pendingFirst.map((c) => ({
      value: c.id,
      label: `${c.name} ${c.bought ? '(Ya comprado)' : '(Pendiente)'}`,
    }));
  }, [catalog]);

  const summaryCounts = useMemo(() => {
    let toComplete = 0;
    let toAdd = 0;
    for (const d of draftItems) {
      if (!d.enabled) continue;
      if (d.action === 'complete' && d.matchedId) toComplete++;
      else if (d.action === 'add' && d.name.trim()) toAdd++;
    }
    return { toComplete, toAdd, total: toComplete + toAdd };
  }, [draftItems]);

  const handleSaveApiKey = () => {
    const trimmed = keyDraft.trim();
    if (!trimmed) return;
    saveStoredGeminiApiKey(trimmed);
    setKeyDraft('');
    setShowKeyInput(false);
    setScanError(null);
    toast.success('Clave de Gemini guardada. Selecciona tu imagen.');
  };

  const findCatalogMatchByName = (name: string): CatalogMandadoItem | undefined => {
    const n = normalize(name);
    if (!n) return undefined;
    const exact = catalog.find((c) => normalize(c.name) === n);
    if (exact) return exact;
    return catalog.find((c) => {
      const cn = normalize(c.name);
      return cn.length >= 4 && (cn.includes(n) || n.includes(cn));
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setScanError(null);

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      const msg = 'Falta configurar tu clave gratuita de Gemini API para analizar la imagen.';
      setScanError(msg);
      setShowKeyInput(true);
      toast.error(msg);
      return;
    }

    setAnalyzing(true);
    setDraftItems([]);

    try {
      const { base64, previewUrl: compressedPreview } = await compressImageToBase64(file);
      setPreviewUrl(compressedPreview);

      const catalogSummary = catalog
        .slice(0, 120)
        .map((c) => `- id:"${c.id}" | "${c.name}" | ${c.bought ? 'comprado' : 'pendiente'} | ${getItemCategory(c)}`)
        .join('\n');

      const prompt = `Analiza esta imagen (puede ser un ticket de compra, productos físicos sobre la mesa/alacena, o una lista de mandado escrita/captura) y compárala contra el CATÁLOGO ACTUAL DE MANDADO del usuario.

CATÁLOGO ACTUAL DE MANDADO:
${catalogSummary || '(Catálogo vacío)'}

Devuelve ÚNICAMENTE un JSON válido (sin markdown ni texto adicional) con esta estructura exacta:
{
  "sourceType": "ticket" | "productos" | "lista",
  "store": "Nombre de tienda si aparece en un ticket o cadena vacía",
  "items": [
    {
      "detectedName": "Nombre limpio y legible del producto",
      "action": "complete" | "add",
      "matchedId": "id exacto del catálogo si corresponde al producto, o null",
      "price": 0,
      "quantity": "Cantidad/peso si es visible o cadena vacía",
      "category": "comida" | "insumos",
      "frequency": "semanal" | "ocasional"
    }
  ]
}

Reglas:
- Si la imagen es un TICKET o PRODUCTOS ya comprados y un producto coincide claramente con uno del catálogo, usa action="complete" y coloca su matchedId exacto. Si NO existe en el catálogo, sugiere action="add" y matchedId=null.
- Si la imagen es una LISTA escrita de cosas por comprar, sugiere action="add" para productos nuevos (o si ya está en catálogo y sigue pendiente, matchedId=id).
- Convierte abreviaturas de tickets (ej. "PECHUGA PLLO 1KG" -> "Pechuga de pollo").
- Ignora totales, IVA, cambio, folio, fechas, direcciones y líneas que no sean productos.
- Clasifica category en "comida" (alimentos/bebidas) o "insumos" (limpieza/hogar/higiene).`;

      const models = await resolveVisionModels(apiKey);
      let parsedJson: any = null;
      let lastErr = '';

      for (const model of models) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
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
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.1,
                },
              }),
            }
          );

          const data = await res.json();
          if (!res.ok) {
            lastErr = data?.error?.message || `HTTP ${res.status}`;
            continue;
          }

          const parts = data?.candidates?.[0]?.content?.parts;
          const rawText = Array.isArray(parts)
            ? parts
                .filter((p: any) => !p.thought && typeof p.text === 'string')
                .map((p: any) => p.text)
                .join('\n')
                .trim()
            : '';

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
          lastErr = err?.message || 'Error de red';
        }
      }

      if (!parsedJson || !Array.isArray(parsedJson.items)) {
        throw new Error(lastErr || 'No se pudieron detectar productos en la imagen.');
      }

      const storeStr = String(parsedJson.store || '').trim();
      const sourceType = parsedJson.sourceType === 'lista' ? 'lista' : parsedJson.sourceType === 'productos' ? 'productos' : 'ticket';
      setDetectedStore(storeStr);

      let hasAnyPrice = false;
      const mapped: DraftMandadoItem[] = parsedJson.items
        .filter((it: any) => it && String(it.detectedName || '').trim() !== '')
        .map((it: any) => {
          const cleanName = String(it.detectedName).trim();
          const byId = it.matchedId ? catalog.find((c) => c.id === String(it.matchedId)) : undefined;
          const matched = byId || findCatalogMatchByName(cleanName);
          const suggestedComplete =
            Boolean(matched) && (it.action === 'complete' || sourceType !== 'lista');

          const priceNum = Number(it.price);
          if (!Number.isNaN(priceNum) && priceNum > 0) hasAnyPrice = true;

          const matchedPrice = matched?.price !== null && matched?.price !== undefined ? String(matched.price) : '';
          const priceStr = !Number.isNaN(priceNum) && priceNum > 0 ? String(priceNum) : matchedPrice;

          return {
            uid: makeUid(),
            enabled: true,
            action: suggestedComplete ? 'complete' : 'add',
            matchedId: matched ? matched.id : catalog[0]?.id || '',
            name: cleanName,
            price: priceStr,
            quantity: String(it.quantity || '').trim() || (matched ? getItemQuantity(matched) : ''),
            category: it.category === 'insumos' ? 'insumos' : 'comida',
            frequency: it.frequency === 'semanal' ? 'semanal' : 'ocasional',
            initialStatus: sourceType === 'lista' ? 'pending' : 'pending',
          };
        });

      setRecordInFinances(sourceType === 'ticket' && hasAnyPrice);
      setDraftItems(mapped);

      if (mapped.length === 0) {
        toast.info('No se detectaron artículos; puedes agregarlos manualmente.');
      } else {
        toast.success(`Lista preliminar lista (${mapped.length} artículos). Revisa y ajusta ✨`);
      }
    } catch (err: any) {
      const msg = err?.message || 'No se pudo procesar la imagen.';
      setScanError(msg);
      if (/api key|permission|unauthorized|401|403/i.test(msg)) {
        setShowKeyInput(true);
      }
      toast.error('Error al analizar imagen: ' + msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateDraft = (uid: string, patch: Partial<DraftMandadoItem>) => {
    setDraftItems((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item;
        const updated = { ...item, ...patch };
        if (patch.action === 'complete' && !updated.matchedId && catalog[0]?.id) {
          updated.matchedId = catalog[0].id;
        }
        if (patch.matchedId) {
          const catItem = catalog.find((c) => c.id === patch.matchedId);
          if (catItem) {
            if (!updated.quantity) updated.quantity = getItemQuantity(catItem);
            if (!updated.price && catItem.price !== null) updated.price = String(catItem.price);
          }
        }
        return updated;
      })
    );
  };

  const removeDraft = (uid: string) => {
    setDraftItems((prev) => prev.filter((item) => item.uid !== uid));
  };

  const addManualDraft = () => {
    setDraftItems((prev) => [
      ...prev,
      {
        uid: makeUid(),
        enabled: true,
        action: 'add',
        matchedId: catalog[0]?.id || '',
        name: '',
        price: '',
        quantity: '',
        category: 'comida',
        frequency: 'semanal',
        initialStatus: 'pending',
      },
    ]);
  };

  const handleApplyChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeRows = draftItems.filter(
      (d) =>
        d.enabled &&
        ((d.action === 'complete' && d.matchedId) || (d.action === 'add' && d.name.trim().length > 0))
    );

    if (activeRows.length === 0) {
      toast.error('Selecciona al menos un artículo válido para aplicar cambios.');
      return;
    }

    setApplying(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Sesión no iniciada.');

      const nowIso = new Date().toISOString();
      const todayDate = nowIso.split('T')[0];
      let completedCount = 0;
      let addedCount = 0;
      let recordedExpenses = 0;

      for (const row of activeRows) {
        const parsedPrice = row.price ? parseFloat(row.price) : null;
        const validPrice = parsedPrice !== null && !Number.isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null;

        if (row.action === 'complete' && row.matchedId) {
          const existing = catalog.find((c) => c.id === row.matchedId);
          if (!existing) continue;

          const cat = getItemCategory(existing);
          const freq = getItemType(existing);
          const qty = row.quantity.trim() || getItemQuantity(existing);
          const storeToUse = detectedStore.trim() || getCleanStoreLocation(existing.location);
          const finalPrice = validPrice ?? existing.price ?? 0;

          const updatedLocation = buildMandadoLocation(cat, freq, qty, storeToUse);
          const prevHistory = Array.isArray(existing.purchase_history) ? existing.purchase_history : [];
          const updatedHistory = [nowIso, ...prevHistory.filter((ts) => ts !== nowIso)];

          const updatePayload: Record<string, any> = {
            bought: true,
            price: finalPrice,
            quantity: qty || null,
            location: updatedLocation,
            updated_at: nowIso,
            purchase_history: updatedHistory,
          };

          let { error } = await supabase.from('shopping_list').update(updatePayload).eq('id', existing.id);
          if (
            error &&
            (error.message?.includes('quantity') ||
              error.message?.includes('purchase_history') ||
              error.message?.includes('updated_at'))
          ) {
            delete updatePayload.quantity;
            delete updatePayload.purchase_history;
            delete updatePayload.updated_at;
            const retry = await supabase.from('shopping_list').update(updatePayload).eq('id', existing.id);
            error = retry.error;
          }
          if (error) throw error;
          completedCount++;

          if (recordInFinances && finalPrice > 0) {
            const qtySuffix = qty ? ` (${qty})` : '';
            const expPayload: Record<string, any> = {
              user_id: user.id,
              concept: `Mandado — ${existing.name}${qtySuffix}`,
              amount: finalPrice,
              category: cat,
              created_at: new Date(`${todayDate}T12:00:00Z`).toISOString(),
            };
            const { error: expErr } = await supabase
              .from('finance_expenses')
              .insert([{ ...expPayload, date: todayDate }]);
            if (expErr) {
              await supabase.from('finance_expenses').insert([expPayload]);
            }
            recordedExpenses++;
          }
        } else if (row.action === 'add' && row.name.trim()) {
          const cleanName = row.name.trim();
          const storeToUse = detectedStore.trim();
          const qty = row.quantity.trim();
          const boughtNow = row.initialStatus === 'bought';
          const finalPrice = validPrice;

          const insertPayload: Record<string, any> = {
            user_id: user.id,
            name: cleanName,
            location: buildMandadoLocation(row.category, row.frequency, qty, storeToUse),
            price: finalPrice,
            quantity: qty || null,
            priority: 'Media',
            type: row.frequency,
            category: row.category,
            bought: boughtNow,
            updated_at: nowIso,
            ...(boughtNow ? { purchase_history: [nowIso] } : {}),
          };

          let { error } = await supabase.from('shopping_list').insert([insertPayload]);
          if (
            error &&
            (error.message?.includes('quantity') ||
              error.message?.includes('type') ||
              error.message?.includes('category') ||
              error.message?.includes('updated_at') ||
              error.message?.includes('purchase_history'))
          ) {
            delete insertPayload.quantity;
            delete insertPayload.type;
            delete insertPayload.category;
            delete insertPayload.updated_at;
            delete insertPayload.purchase_history;
            const retry = await supabase.from('shopping_list').insert([insertPayload]);
            error = retry.error;
          }
          if (error) throw error;
          addedCount++;

          if (boughtNow && recordInFinances && finalPrice && finalPrice > 0) {
            const qtySuffix = qty ? ` (${qty})` : '';
            const expPayload: Record<string, any> = {
              user_id: user.id,
              concept: `Mandado — ${cleanName}${qtySuffix}`,
              amount: finalPrice,
              category: row.category,
              created_at: new Date(`${todayDate}T12:00:00Z`).toISOString(),
            };
            const { error: expErr } = await supabase
              .from('finance_expenses')
              .insert([{ ...expPayload, date: todayDate }]);
            if (expErr) {
              await supabase.from('finance_expenses').insert([expPayload]);
            }
            recordedExpenses++;
          }
        }
      }

      invalidateCache('dashboard');
      invalidateCache('search_global');
      invalidateCache('calendario_360');
      if (recordedExpenses > 0) {
        window.dispatchEvent(new Event('ac_finance_changed'));
      }

      const parts: string[] = [];
      if (completedCount > 0) parts.push(`${completedCount} completado${completedCount !== 1 ? 's' : ''}`);
      if (addedCount > 0) parts.push(`${addedCount} nuevo${addedCount !== 1 ? 's' : ''}`);
      if (recordedExpenses > 0) parts.push(`${recordedExpenses} gasto${recordedExpenses !== 1 ? 's' : ''} en Finanzas`);
      toast.success(`Mandado actualizado: ${parts.join(' · ')} ✨`);

      onApplied?.();
      resetAndClose();
    } catch (err: any) {
      toast.error('Error al aplicar cambios: ' + (err?.message || 'Intenta nuevamente'));
    } finally {
      setApplying(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget && !applying) resetAndClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mandado-scanner-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 18 }}
            className="bg-white dark:bg-gray-900 rounded-[2rem] sm:rounded-[2.5rem] max-h-[92vh] flex flex-col max-w-3xl w-full border border-gray-100 dark:border-gray-800 shadow-2xl cursor-default overflow-hidden outline-none"
          >
            {/* 1. Sticky Header */}
            <div className="flex items-center justify-between gap-3 p-5 sm:p-7 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="min-w-0">
                <h2
                  id="mandado-scanner-title"
                  className="font-dm-sans text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate"
                >
                  Escáner de Mandado
                </h2>
                <p className="font-inter text-xs text-gray-400 truncate">
                  Detecta productos desde una foto para ajustar manualmente antes de guardar.
                </p>
              </div>
              <button
                type="button"
                disabled={applying}
                onClick={resetAndClose}
                aria-label="Cerrar escáner de mandado"
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* 2. Scrollable Body */}
            <form onSubmit={handleApplyChanges} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-7 overflow-y-auto flex-1 min-h-0 space-y-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Capture Trigger */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    disabled={analyzing || loadingCatalog}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[48px] py-3.5 px-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-emerald-500 bg-gray-50/70 dark:bg-gray-800/60 transition-all flex items-center justify-center gap-2.5 text-gray-700 dark:text-gray-200 font-syne text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <div className="size-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        <span>Analizando imagen contra tu mandado...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineCamera className="text-xl text-emerald-500 shrink-0" />
                        <span>Usar cámara de tu dispositivo o subir foto</span>
                        <HiOutlineUpload className="text-base opacity-60 shrink-0" />
                      </>
                    )}
                  </button>

                  {draftItems.length === 0 && !analyzing && (
                    <button
                      type="button"
                      onClick={addManualDraft}
                      className="min-h-[48px] px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all"
                    >
                      <HiOutlinePlus className="text-base" />
                      <span>Manual</span>
                    </button>
                  )}
                </div>

                {scanError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs font-inter text-rose-700 dark:text-rose-300"
                  >
                    <HiOutlineExclamationCircle className="text-lg shrink-0 mt-0.5 text-rose-500" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="leading-snug break-words">{scanError}</p>
                      {!showKeyInput && (
                        <button
                          type="button"
                          onClick={() => setShowKeyInput(true)}
                          className="inline-flex items-center gap-1.5 font-syne text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-200 underline cursor-pointer"
                        >
                          <HiOutlineKey className="text-xs" />
                          <span>Configurar o cambiar clave Gemini</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {showKeyInput && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-syne text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        <HiOutlineKey className="text-sm" />
                        <span>Clave Gemini API (Gratis)</span>
                      </span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="font-syne text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-200 underline"
                      >
                        Obtener clave
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={keyDraft}
                        onChange={(e) => setKeyDraft(e.target.value)}
                        placeholder="AIzaSy..."
                        className="flex-1 px-3.5 min-h-[44px] py-2 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 rounded-xl outline-none font-mono text-xs text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSaveApiKey}
                        className="px-4 min-h-[44px] py-2 bg-amber-600 hover:bg-amber-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all shrink-0"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}

                {previewUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-40 bg-black/5 flex items-center justify-center">
                    <img src={previewUrl} alt="Vista previa analizada" className="max-h-40 object-contain" />
                  </div>
                )}

                {/* Editable Preliminary List */}
                {draftItems.length > 0 && (
                  <div className="space-y-4">
                    {/* Preliminary Toolbar */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50/90 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/70 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                          Lista Preliminar ({draftItems.length} detectados)
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-syne text-[10px] font-bold uppercase tracking-wider">
                            ✓ {summaryCounts.toComplete} completar
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300 font-syne text-[10px] font-bold uppercase tracking-wider">
                            + {summaryCounts.toAdd} nuevos
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label
                            htmlFor="scanner-store-input"
                            className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1"
                          >
                            Tienda / Lugar (Opcional)
                          </label>
                          <input
                            id="scanner-store-input"
                            type="text"
                            value={detectedStore}
                            onChange={(e) => setDetectedStore(e.target.value)}
                            placeholder="Ej. Walmart, Costco, Mercado..."
                            className="w-full px-3.5 min-h-[44px] py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 font-inter text-xs text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1 sm:pt-4">
                          <span
                            className="font-inter text-xs font-medium text-gray-700 dark:text-gray-300"
                            title="Si está activo, los productos marcados como completados con precio mayor a 0 también se registrarán en Finanzas."
                          >
                            Registrar precios en Finanzas
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={recordInFinances}
                            aria-label="Registrar precios en Finanzas"
                            onClick={() => setRecordInFinances((prev) => !prev)}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                              recordInFinances ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                                recordInFinances ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Draft Rows */}
                    <div className="space-y-3">
                      {draftItems.map((row) => (
                        <div
                          key={row.uid}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                            row.enabled
                              ? row.action === 'complete'
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xs'
                              : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800/60 opacity-55'
                          }`}
                        >
                          {/* Row Header: Enable Checkbox + Mode Switcher + Delete */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={row.enabled}
                                aria-label={`Incluir ${row.name || 'artículo'}`}
                                onClick={() => updateDraft(row.uid, { enabled: !row.enabled })}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl cursor-pointer shrink-0"
                              >
                                <span
                                  className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    row.enabled
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                  }`}
                                >
                                  {row.enabled && <HiOutlineCheck className="text-sm" />}
                                </span>
                              </button>

                              {/* Action Pills */}
                              <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-1 max-w-xs">
                                <button
                                  type="button"
                                  disabled={catalog.length === 0}
                                  onClick={() => updateDraft(row.uid, { action: 'complete' })}
                                  className={`min-h-[36px] px-2.5 py-1 rounded-lg font-syne text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                    row.action === 'complete'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                                  }`}
                                >
                                  ✓ Completar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateDraft(row.uid, { action: 'add' })}
                                  className={`min-h-[36px] px-2.5 py-1 rounded-lg font-syne text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    row.action === 'add'
                                      ? 'bg-sky-600 text-white shadow-xs'
                                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                                  }`}
                                >
                                  + Nuevo
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeDraft(row.uid)}
                              aria-label="Quitar de la lista preliminar"
                              title="Descartar fila"
                              className="min-w-[44px] min-h-[44px] p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                            >
                              <HiOutlineTrash className="text-base" />
                            </button>
                          </div>

                          {/* Row Body */}
                          {row.action === 'complete' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                              <div className="sm:col-span-6">
                                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                  Producto en tu Mandado
                                </label>
                                <CustomSelect
                                  value={row.matchedId}
                                  onChange={(val) => updateDraft(row.uid, { matchedId: val })}
                                  options={catalogSelectOptions}
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                  Cantidad
                                </label>
                                <input
                                  type="text"
                                  value={row.quantity}
                                  onChange={(e) => updateDraft(row.uid, { quantity: e.target.value })}
                                  placeholder="Ej. 1 kg"
                                  className="w-full px-3.5 min-h-[48px] py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 font-inter text-sm text-gray-900 dark:text-white"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                  Precio ($)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.price}
                                  onChange={(e) => updateDraft(row.uid, { price: e.target.value })}
                                  placeholder="0.00"
                                  className="w-full px-3.5 min-h-[48px] py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 font-dm-sans font-bold text-sm text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                <div className="sm:col-span-6">
                                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    Nuevo Producto *
                                  </label>
                                  <input
                                    type="text"
                                    value={row.name}
                                    onChange={(e) => updateDraft(row.uid, { name: e.target.value })}
                                    placeholder="Nombre del producto..."
                                    className="w-full px-3.5 min-h-[48px] py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-sky-500 font-inter text-sm text-gray-900 dark:text-white"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    Cantidad
                                  </label>
                                  <input
                                    type="text"
                                    value={row.quantity}
                                    onChange={(e) => updateDraft(row.uid, { quantity: e.target.value })}
                                    placeholder="Ej. 2 pzas"
                                    className="w-full px-3.5 min-h-[48px] py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-sky-500 font-inter text-sm text-gray-900 dark:text-white"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    Precio ($)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={row.price}
                                    onChange={(e) => updateDraft(row.uid, { price: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-3.5 min-h-[48px] py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-sky-500 font-dm-sans font-bold text-sm text-gray-900 dark:text-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    Categoría
                                  </label>
                                  <CustomSelect
                                    value={row.category}
                                    onChange={(val) => updateDraft(row.uid, { category: val as 'comida' | 'insumos' })}
                                    options={[
                                      { value: 'comida', label: '🍔 Comida' },
                                      { value: 'insumos', label: '🛒 Insumos' },
                                    ]}
                                  />
                                </div>

                                <div>
                                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    Frecuencia
                                  </label>
                                  <CustomSelect
                                    value={row.frequency}
                                    onChange={(val) => updateDraft(row.uid, { frequency: val as 'semanal' | 'ocasional' })}
                                    options={[
                                      { value: 'semanal', label: '🥗 Semanal' },
                                      { value: 'ocasional', label: '📦 Hasta Agotar' },
                                    ]}
                                  />
                                </div>

                                <div>
                                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    Estado al Guardar
                                  </label>
                                  <CustomSelect
                                    value={row.initialStatus}
                                    onChange={(val) => updateDraft(row.uid, { initialStatus: val as 'pending' | 'bought' })}
                                    options={[
                                      { value: 'pending', label: '⏳ Por comprar' },
                                      { value: 'bought', label: '✓ Ya comprado' },
                                    ]}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addManualDraft}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-sky-500 text-gray-600 dark:text-gray-300 font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <HiOutlinePlus className="text-base" />
                      <span>Agregar otra fila manual</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Sticky Footer */}
              <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                <button
                  type="button"
                  disabled={applying}
                  onClick={resetAndClose}
                  className="px-5 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                {draftItems.length > 0 && (
                  <button
                    type="submit"
                    disabled={applying || summaryCounts.total === 0}
                    className="px-6 min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <HiOutlineCheckCircle className="text-base" />
                    <span>
                      {applying
                        ? 'Aplicando...'
                        : `Aplicar ${summaryCounts.total} cambio${summaryCounts.total !== 1 ? 's' : ''}`}
                    </span>
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
