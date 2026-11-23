import { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineDuplicate,
  HiOutlineShare,
  HiOutlineRefresh,
  HiOutlineUserGroup,
  HiOutlineCheck,
} from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import { invalidateCache } from '@/lib/cache';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import CustomDatePicker from '@/components/common/CustomDatePicker';

interface Participant {
  id: string;
  name: string;
  size: number; // 1 = persona individual, 2+ = grupo / pareja
}

interface BillExpense {
  id: string;
  concept: string;
  amount: number;
  tipPercent: number;
  paidById: string;
}

interface Transfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

const DRAFT_STORAGE_KEY = 'ac_bill_splitter_draft_v2';
const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatEventDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [y, m, d] = parts;
  return `${d} ${SHORT_MONTHS[(m - 1) % 12] || ''} ${y}`;
}

export default function DivisorCuentas() {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState<string>(() => getTodayIso());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipantId, setMyParticipantId] = useState('');
  const [expenses, setExpenses] = useState<BillExpense[]>([]);

  // New Participant Form
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonSize, setNewPersonSize] = useState('1');

  // New Expense Form
  const [expConcept, setExpConcept] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expTip, setExpTip] = useState('0');
  const [expPaidBy, setExpPaidBy] = useState('');

  const [copied, setCopied] = useState(false);
  const [sendingDebt, setSendingDebt] = useState(false);
  const { toast } = useToast();

  // Cargar borrador local (0 bytes en Supabase)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.title === 'string') setTitle(parsed.title);
        if (typeof parsed.eventDate === 'string' && parsed.eventDate) setEventDate(parsed.eventDate);
        if (Array.isArray(parsed.participants)) {
          setParticipants(parsed.participants);
          if (parsed.participants[0]) setExpPaidBy(parsed.participants[0].id);
        }
        if (typeof parsed.myParticipantId === 'string') setMyParticipantId(parsed.myParticipantId);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ title, eventDate, participants, myParticipantId, expenses })
      );
    } catch {}
  }, [title, eventDate, participants, myParticipantId, expenses]);

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPersonName.trim();
    const size = Math.max(1, parseInt(newPersonSize, 10) || 1);
    if (!clean) {
      toast.error('Escribe el nombre de la persona o grupo.');
      return;
    }
    const created: Participant = {
      id: `p-${Date.now()}`,
      name: clean,
      size,
    };
    setParticipants((prev) => [...prev, created]);
    if (!expPaidBy) setExpPaidBy(created.id);
    setNewPersonName('');
    setNewPersonSize('1');
  };

  const handleRemoveParticipant = (id: string) => {
    const nextParts = participants.filter((p) => p.id !== id);
    setParticipants(nextParts);
    if (expPaidBy === id) setExpPaidBy(nextParts[0]?.id || '');
    if (myParticipantId === id) setMyParticipantId('');
    setExpenses((prev) =>
      prev.map((ex) => ({
        ...ex,
        paidById: ex.paidById === id ? nextParts[0]?.id || '' : ex.paidById,
      }))
    );
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (participants.length === 0) {
      toast.error('Agrega primero al menos una persona o grupo participante.');
      return;
    }
    const baseAmt = parseFloat(expAmount);
    const tipPct = Math.max(0, parseFloat(expTip) || 0);
    if (!expConcept.trim() || isNaN(baseAmt) || baseAmt <= 0) {
      toast.error('Ingresa un concepto y un monto válido.');
      return;
    }

    const totalWithTip = Number((baseAmt * (1 + tipPct / 100)).toFixed(2));
    const newExp: BillExpense = {
      id: `exp-${Date.now()}`,
      concept: expConcept.trim(),
      amount: totalWithTip,
      tipPercent: tipPct,
      paidById: expPaidBy || participants[0].id,
    };

    setExpenses((prev) => [...prev, newExp]);
    setExpConcept('');
    setExpAmount('');
    toast.success(`Concepto agregado ($${totalWithTip.toLocaleString()})`);
  };

  // Cálculo integral de consumos, pagos y transferencias mínimas proporcional a integrantes
  const calculation = useMemo(() => {
    const paidMap: Record<string, number> = {};
    const owedMap: Record<string, number> = {};
    participants.forEach((p) => {
      paidMap[p.id] = 0;
      owedMap[p.id] = 0;
    });

    let grandTotal = 0;
    const totalSize = participants.reduce((acc, p) => acc + p.size, 0);

    expenses.forEach((exp) => {
      grandTotal += exp.amount;
      if (paidMap[exp.paidById] !== undefined) {
        paidMap[exp.paidById] += exp.amount;
      }

      if (totalSize > 0) {
        participants.forEach((p) => {
          owedMap[p.id] += (exp.amount * p.size) / totalSize;
        });
      }
    });

    const balances = participants.map((p) => {
      const paid = Number((paidMap[p.id] || 0).toFixed(2));
      const owed = Number((owedMap[p.id] || 0).toFixed(2));
      const net = Number((paid - owed).toFixed(2));
      return { ...p, paid, owed, net };
    });

    // Algoritmo greedy de liquidación con mínimas transferencias
    const debtors = balances
      .filter((b) => b.net < -0.01)
      .map((b) => ({ id: b.id, name: b.name, amount: Math.abs(b.net) }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = balances
      .filter((b) => b.net > 0.01)
      .map((b) => ({ id: b.id, name: b.name, amount: b.net }))
      .sort((a, b) => b.amount - a.amount);

    const transfers: Transfer[] = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i];
      const c = creditors[j];
      const amt = Number(Math.min(d.amount, c.amount).toFixed(2));
      if (amt > 0.01) {
        transfers.push({
          fromId: d.id,
          fromName: d.name,
          toId: c.id,
          toName: c.name,
          amount: amt,
        });
      }
      d.amount = Number((d.amount - amt).toFixed(2));
      c.amount = Number((c.amount - amt).toFixed(2));
      if (d.amount <= 0.01) i++;
      if (c.amount <= 0.01) j++;
    }

    const perPersonAvg = totalSize > 0 ? Number((grandTotal / totalSize).toFixed(2)) : 0;

    return {
      grandTotal: Number(grandTotal.toFixed(2)),
      totalPeople: totalSize,
      perPersonAvg,
      balances,
      transfers,
    };
  }, [participants, expenses]);

  const myTransfers = useMemo(() => {
    if (!myParticipantId) return [];
    return calculation.transfers.filter(
      (t) => t.fromId === myParticipantId || t.toId === myParticipantId
    );
  }, [calculation.transfers, myParticipantId]);

  const formatMoney = (val: number) =>
    val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const whatsappSummary = useMemo(() => {
    const cleanTitle = title.trim() || 'Cuenta Compartida';
    const niceDate = formatEventDate(eventDate);
    const lines: string[] = [];

    lines.push('*DESGLOSE DE CUENTA*');
    lines.push(`*Evento:* ${cleanTitle}`);
    if (niceDate) lines.push(`*Fecha:* ${niceDate}`);
    lines.push(`*Integrantes:* ${calculation.totalPeople} ${calculation.totalPeople === 1 ? 'persona' : 'personas'}`);
    lines.push('────────────────────');
    lines.push(`*TOTAL GENERAL:* *$${formatMoney(calculation.grandTotal)}*`);
    if (calculation.totalPeople > 0) {
      lines.push(`_Promedio por persona: $${formatMoney(calculation.perPersonAvg)}_`);
    }
    lines.push('');

    if (expenses.length > 0) {
      lines.push('*DETALLE DE GASTOS*');
      expenses.forEach((ex) => {
        const payer = participants.find((p) => p.id === ex.paidById)?.name || 'Sin asignar';
        const tipText = ex.tipPercent > 0 ? ` · incl. ${ex.tipPercent}% propina` : '';
        lines.push(`• *${ex.concept}:* $${formatMoney(ex.amount)} _(pagó ${payer}${tipText})_`);
      });
      lines.push('');
    }

    if (calculation.balances.length > 0) {
      lines.push('*CONSUMO POR PERSONA / GRUPO*');
      calculation.balances.forEach((b) => {
        const groupTag = b.size > 1 ? ` (${b.size} pers.)` : '';
        const statusStr =
          b.net > 0.01
            ? `a favor +$${formatMoney(b.net)}`
            : b.net < -0.01
            ? `debe -$${formatMoney(Math.abs(b.net))}`
            : 'al corriente';
        lines.push(
          `• *${b.name}${groupTag}:* le toca *$${formatMoney(b.owed)}* | pagó $${formatMoney(b.paid)} _(${statusStr})_`
        );
      });
      lines.push('');
    }

    lines.push('*LIQUIDACIÓN (TRANSFERENCIAS)*');
    if (calculation.transfers.length === 0) {
      lines.push('✓ Todos los saldos están cubiertos.');
    } else {
      calculation.transfers.forEach((t, idx) => {
        lines.push(`${idx + 1}. *${t.fromName}* → *${t.toName}*: *$${formatMoney(t.amount)}*`);
      });
    }

    return lines.join('\n');
  }, [title, eventDate, calculation, expenses, participants]);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(whatsappSummary);
      setCopied(true);
      toast.success('Desglose copiado listo para pegar ✨');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('No se pudo copiar.');
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappSummary)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendToDebts = async () => {
    if (!myParticipantId) {
      toast.info('Selecciona primero cuál persona o grupo te pertenece ("Soy yo") para no contarte a ti mismo.');
      return;
    }
    if (myTransfers.length === 0) {
      toast.info('No tienes saldos pendientes por cobrar ni por pagar en esta cuenta.');
      return;
    }
    setSendingDebt(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Inicia sesión para guardar en Deudas.');

      const cleanTitle = title.trim() || 'Cuenta Compartida';
      const niceDate = formatEventDate(eventDate);
      const dateSegment = niceDate ? ` (${niceDate})` : '';

      const rows = myTransfers.map((t) => {
        const isReceivable = t.toId === myParticipantId;
        const counterparty = isReceivable ? t.fromName : t.toName;
        const prefix = isReceivable ? '[Me Deben]' : '[Yo Debo]';
        return {
          user_id: user.id,
          debtor_name: counterparty,
          amount: t.amount,
          concept: `${prefix} ${cleanTitle}${dateSegment} · División de cuenta`,
          settled: false,
        };
      });

      const { error } = await supabase.from('debts').insert(rows);
      if (error) throw error;
      invalidateCache('dashboard');
      invalidateCache('search_global');
      toast.success(`${rows.length} saldo(s) propio(s) enviados a Deudas ✨`);
    } catch (err: any) {
      toast.error('Error al enviar a Deudas: ' + err.message);
    } finally {
      setSendingDebt(false);
    }
  };

  const handleResetAll = () => {
    setTitle('');
    setEventDate(getTodayIso());
    setParticipants([]);
    setMyParticipantId('');
    setExpenses([]);
    setExpPaidBy('');
    toast.info('Divisor reiniciado');
  };

  return (
    <div className="space-y-5 sm:space-y-8 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex-1 max-w-xl">
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Divisor de <span className="text-gradient">Cuentas</span>
          </h1>
          <p className="hidden sm:block font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-xs">
            Segmenta por personas o grupos, marca tu participación y comparte el desglose directo por WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetAll}
          className="px-4 min-h-[44px] py-2 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <HiOutlineRefresh className="text-base" />
          <span>Nueva Cuenta</span>
        </button>
      </header>

      {/* Event Title & Date */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/[0.09] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
        <div className="sm:col-span-2">
          <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Nombre de la Salida / Evento / Viaje
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Cena del viernes, Taquitos, Viaje a Mazamitla..."
            className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-dm-sans font-bold text-sm sm:text-base text-gray-900 dark:text-white placeholder:font-inter placeholder:font-normal placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Fecha del Evento
          </label>
          <CustomDatePicker
            value={eventDate}
            onChange={setEventDate}
            placeholder="Selecciona fecha..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* Left 2 Columns: Participants & Expenses */}
        <div className="xl:col-span-2 space-y-5 sm:space-y-6">
          {/* 1. Participantes / Grupos */}
          <section className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-6 border border-gray-200/80 dark:border-white/[0.09] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <HiOutlineUserGroup className="text-lg" />
                </div>
                <div>
                  <h2 className="font-dm-sans font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                    1. Personas y Grupos ({calculation.totalPeople} {calculation.totalPeople === 1 ? 'integrante' : 'integrantes'})
                  </h2>
                </div>
              </div>
              {participants.length > 0 && (
                <span className="font-inter text-[11px] text-gray-500 dark:text-gray-400">
                  Marca <strong className="text-[var(--vibrant-sky-blue)]">Soy yo</strong> en tu registro para enviar solo tus saldos a Deudas.
                </span>
              )}
            </div>

            <form onSubmit={handleAddParticipant} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Nombre de persona o grupo (ej. Silvia y Gabriel)..."
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                className="flex-1 px-4 min-h-[44px] py-2.5 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white"
              />
              <div className="w-full sm:w-44">
                <CustomSelect
                  value={newPersonSize}
                  onChange={setNewPersonSize}
                  options={[
                    { value: '1', label: '1 persona' },
                    { value: '2', label: 'Grupo de 2' },
                    { value: '3', label: 'Grupo de 3' },
                    { value: '4', label: 'Grupo de 4' },
                    { value: '5', label: 'Grupo de 5' },
                    { value: '6', label: 'Grupo de 6' },
                  ]}
                />
              </div>
              <button
                type="submit"
                className="px-5 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-syne text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
              >
                <HiOutlinePlus />
                <span>Agregar</span>
              </button>
            </form>

            {participants.length === 0 ? (
              <div className="p-5 rounded-2xl border border-dashed border-gray-300 dark:border-white/15 text-center">
                <p className="font-inter text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Aún no hay participantes. Agrega a cada persona o grupo que participó en la cuenta.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => {
                  const isMe = myParticipantId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-sm font-inter transition-all ${
                        isMe
                          ? 'bg-sky-500/10 border-[var(--vibrant-sky-blue)]/50 text-gray-900 dark:text-white'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200/80 dark:border-white/10 text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <span className="font-semibold">{p.name}</span>
                      {p.size > 1 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-300 font-syne text-[10px] font-bold">
                          ×{p.size}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setMyParticipantId(isMe ? '' : p.id)}
                        className={`px-2 py-1 rounded-xl font-syne text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isMe
                            ? 'bg-[var(--vibrant-sky-blue)] text-white shadow-xs'
                            : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200/70 dark:border-white/10 hover:text-[var(--vibrant-sky-blue)]'
                        }`}
                        title={isMe ? 'Quitar marca de mi usuario' : 'Marcar que esta persona o grupo me pertenece'}
                      >
                        {isMe ? 'Tú ✓' : 'Soy yo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(p.id)}
                        className="min-w-[28px] min-h-[28px] flex items-center justify-center text-gray-400 hover:text-rose-500 cursor-pointer p-1 rounded-lg hover:bg-rose-500/10"
                        title="Quitar participante"
                      >
                        <HiOutlineTrash className="text-sm" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 2. Gastos (División proporcional automática por integrantes) */}
          <section className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-6 border border-gray-200/80 dark:border-white/[0.09] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-dm-sans font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                2. Gastos Realizados
              </h2>
              <span className="font-inter text-xs text-gray-500 dark:text-gray-400">
                Se divide automáticamente entre las {calculation.totalPeople || 0} personas
              </span>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 surface-panel p-4 rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Concepto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cena, Airbnb, Botella, Uber..."
                    value={expConcept}
                    onChange={(e) => setExpConcept(e.target.value)}
                    className="w-full px-4 min-h-[44px] py-2.5 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-4 min-h-[44px] py-2.5 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-dm-sans font-bold text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Propina (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={expTip}
                    onChange={(e) => setExpTip(e.target.value)}
                    className="w-full px-4 min-h-[44px] py-2.5 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-dm-sans font-bold text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="flex-1 sm:max-w-xs">
                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    ¿Quién pagó?
                  </label>
                  <CustomSelect
                    value={expPaidBy}
                    onChange={setExpPaidBy}
                    placeholder="Agrega participantes arriba..."
                    options={participants.map((p) => ({
                      value: p.id,
                      label: p.size > 1 ? `${p.name} (×${p.size})` : p.name,
                    }))}
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-syne text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                  <HiOutlinePlus />
                  <span>Agregar Gasto</span>
                </button>
              </div>
            </form>

            {/* Expenses List */}
            {expenses.length > 0 && (
              <div className="space-y-2.5">
                {expenses.map((ex) => {
                  const payer = participants.find((p) => p.id === ex.paidById)?.name || 'Sin asignar';
                  return (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50/90 dark:bg-gray-800/60 border border-gray-200/70 dark:border-white/10"
                    >
                      <div className="min-w-0">
                        <h4 className="font-dm-sans font-bold text-sm text-gray-900 dark:text-white truncate">
                          {ex.concept}
                        </h4>
                        <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                          Pagó <strong className="text-gray-800 dark:text-gray-200">{payer}</strong>
                          {ex.tipPercent > 0 ? ` · Incluye ${ex.tipPercent}% propina` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-dm-sans font-bold text-base text-gray-900 dark:text-white">
                          ${formatMoney(ex.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpenses((prev) => prev.filter((item) => item.id !== ex.id))}
                          className="min-w-[38px] min-h-[38px] p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl cursor-pointer flex items-center justify-center"
                          title="Eliminar gasto"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Totals, Transfers & WhatsApp Share */}
        <aside className="bg-white dark:bg-[#111827] rounded-3xl p-5 sm:p-6 border border-gray-200/80 dark:border-white/[0.09] shadow-xs space-y-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Total de la Cuenta
              </span>
              {eventDate && (
                <span className="font-syne text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {formatEventDate(eventDate)}
                </span>
              )}
            </div>
            <p className="font-dm-sans text-3xl font-bold text-gray-900 dark:text-white mt-0.5">
              ${formatMoney(calculation.grandTotal)}
            </p>
            {calculation.totalPeople > 0 && (
              <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Promedio por persona: <strong className="text-gray-800 dark:text-gray-200">${formatMoney(calculation.perPersonAvg)}</strong>
              </p>
            )}
          </div>

          <div className="space-y-2 border-t border-gray-200/70 dark:border-white/[0.08] pt-4">
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block">
              Consumo por Persona / Grupo
            </span>
            {calculation.balances.length === 0 ? (
              <p className="text-xs font-inter text-gray-400">
                Agrega personas o grupos para calcular lo que corresponde a cada uno.
              </p>
            ) : (
              calculation.balances.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-xs font-inter py-1 gap-2">
                  <span className="text-gray-800 dark:text-gray-200 font-medium truncate flex items-center gap-1.5">
                    <span className="truncate">{b.name} {b.size > 1 ? `(×${b.size})` : ''}</span>
                    {myParticipantId === b.id && (
                      <span className="px-1.5 py-0.5 rounded bg-[var(--vibrant-sky-blue)]/15 text-[var(--vibrant-sky-blue)] font-syne text-[9px] font-bold uppercase shrink-0">
                        Tú
                      </span>
                    )}
                  </span>
                  <div className="text-right shrink-0">
                    <span className="font-dm-sans font-bold text-gray-900 dark:text-white">
                      ${formatMoney(b.owed)}
                    </span>
                    <span
                      className={`ml-2 font-syne text-[10px] font-bold ${
                        b.net > 0.01
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : b.net < -0.01
                          ? 'text-rose-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {b.net > 0.01 ? `+$${formatMoney(b.net)}` : b.net < -0.01 ? `-$${formatMoney(Math.abs(b.net))}` : 'OK'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 border-t border-gray-200/70 dark:border-white/[0.08] pt-4">
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block">
              Liquidación Sugerida
            </span>
            {calculation.transfers.length === 0 ? (
              <p className="text-xs font-inter text-gray-400">
                Agrega gastos para ver las transferencias exactas.
              </p>
            ) : (
              <div className="space-y-2">
                {calculation.transfers.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-inter text-gray-800 dark:text-gray-100">
                      <strong>{t.fromName}</strong> → <strong>{t.toName}</strong>
                    </span>
                    <span className="font-dm-sans font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                      ${formatMoney(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full min-h-[44px] py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <HiOutlineShare className="text-base" />
              <span>Compartir por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full min-h-[44px] py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copied ? <HiOutlineCheck className="text-base" /> : <HiOutlineDuplicate className="text-base" />}
              <span>{copied ? 'Copiado' : 'Copiar Desglose'}</span>
            </button>

            {calculation.transfers.length > 0 && (
              <button
                type="button"
                disabled={sendingDebt}
                onClick={handleSendToDebts}
                className="w-full min-h-[44px] py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-syne text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 border border-gray-200/70 dark:border-white/10"
              >
                {sendingDebt
                  ? 'Enviando...'
                  : myParticipantId
                  ? `Enviar Mis Saldos a Deudas (${myTransfers.length})`
                  : 'Marca "Soy yo" para Enviar a Deudas'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
