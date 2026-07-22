import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  HiOutlineCurrencyDollar, 
  HiOutlineClipboardList, 
  HiOutlineLockClosed,
  HiOutlineUserGroup,
  HiOutlineShoppingBag,
  HiOutlineCalendar,
  HiOutlineLink,
  HiOutlineDocumentText,
  HiOutlineArrowSmRight
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    expenses: 0,
    tasks: 0,
    vault: 0,
    debts: 0,
    shopping: 0,
    reminders: 0,
    bookmarks: 0,
    notes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [exp, tsk, vlt, dbt, shp, rem, bkm, nts] = await Promise.all([
      supabase.from('finance_expenses').select('amount'),
      supabase.from('tasks').select('id').eq('completed', false),
      supabase.from('vault_items').select('id'),
      supabase.from('debts').select('amount').eq('settled', false),
      supabase.from('shopping_list').select('id').eq('bought', false),
      supabase.from('reminders').select('id'),
      supabase.from('bookmarks').select('id'),
      supabase.from('notes').select('id')
    ]);

    setStats({
      expenses: exp.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
      tasks: tsk.data?.length || 0,
      vault: vlt.data?.length || 0,
      debts: dbt.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
      shopping: shp.data?.length || 0,
      reminders: rem.data?.length || 0,
      bookmarks: bkm.data?.length || 0,
      notes: nts.data?.length || 0
    });
    setLoading(false);
  };

  const cards = [
    { 
      label: 'Gastos Mensuales', 
      value: `$${stats.expenses.toLocaleString()}`, 
      icon: HiOutlineCurrencyDollar, 
      color: 'bg-blue-500', 
      path: '/admin/panel/finanzas' 
    },
    { 
      label: 'Tareas Pendientes', 
      value: stats.tasks, 
      icon: HiOutlineClipboardList, 
      color: 'bg-orange-500', 
      path: '/admin/panel/pendientes' 
    },
    { 
      label: 'Cuentas por Cobrar', 
      value: `$${stats.debts.toLocaleString()}`, 
      icon: HiOutlineUserGroup, 
      color: 'bg-red-500', 
      path: '/admin/panel/deudas' 
    },
    { 
      label: 'Textos en Bóveda', 
      value: stats.vault, 
      icon: HiOutlineLockClosed, 
      color: 'bg-purple-500', 
      path: '/admin/panel/vault' 
    },
    { 
      label: 'Lista de Compras', 
      value: stats.shopping, 
      icon: HiOutlineShoppingBag, 
      color: 'bg-green-500', 
      path: '/admin/panel/compras' 
    },
    { 
      label: 'Recordatorios', 
      value: stats.reminders, 
      icon: HiOutlineCalendar, 
      color: 'bg-pink-500', 
      path: '/admin/panel/recordatorios' 
    },
    { 
      label: 'Enlaces Guardados', 
      value: stats.bookmarks, 
      icon: HiOutlineLink, 
      color: 'bg-cyan-500', 
      path: '/admin/panel/enlaces' 
    },
    { 
      label: 'Notas Importantes', 
      value: stats.notes, 
      icon: HiOutlineDocumentText, 
      color: 'bg-emerald-500', 
      path: '/admin/panel/notas' 
    },
  ];

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando...</div>;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)]">
          Hola, <span className="text-gradient">Andrés</span>
        </h1>
        <p className="font-inter mt-2 text-[var(--dark-gray)] font-light text-sm">
          Aquí tienes un resumen de tu actividad actual.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link 
              to={card.path}
              className="group block bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${card.color} text-white shadow-lg`}>
                  <card.icon className="text-xl md:text-2xl" />
                </div>
                <HiOutlineArrowSmRight className="text-xl md:text-2xl text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4 md:mt-8">
                <p className="font-syne text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">{card.label}</p>
                <h3 className="font-dm-sans text-xl md:text-3xl font-bold mt-1 text-black">{card.value}</h3>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-black rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-white relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
            <h2 className="font-dm-sans text-2xl md:text-3xl font-bold">Tu Panel Personal</h2>
            <p className="font-inter text-gray-400 font-light leading-relaxed max-w-md text-sm md:text-base">
              Gestiona tus finanzas, tareas y documentos importantes desde un solo lugar seguro y privado.
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <div className="px-4 md:px-6 py-2 md:py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] md:text-xs font-syne font-bold uppercase tracking-widest">
                8 Módulos
              </div>
              <div className="px-4 md:px-6 py-2 md:py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] md:text-xs font-syne font-bold uppercase tracking-widest">
                Bóveda Segura
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 size-80 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        </div>

        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 flex flex-col justify-center items-center text-center space-y-5 md:space-y-6 shadow-sm">
           <div className="size-16 md:size-20 rounded-full bg-gray-50 flex items-center justify-center">
             <HiOutlineClipboardList className="text-3xl md:text-4xl text-black" />
           </div>
           <div className="space-y-2">
             <h3 className="font-dm-sans text-lg md:text-xl font-bold">¿Qué sigue?</h3>
             <p className="font-inter text-sm text-gray-500 font-light">
               Tienes {stats.tasks} tareas pendientes por completar hoy.
             </p>
           </div>
           <Link 
            to="/admin/panel/pendientes"
            className="px-6 md:px-8 py-3 md:py-4 bg-black text-white rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
           >
             Ver Tareas
           </Link>
        </div>
      </section>
    </div>
  );
}
