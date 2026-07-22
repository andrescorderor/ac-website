import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider } from '@/components/common/ToastContext';
import { 
  HiOutlineViewGrid, 
  HiOutlineCurrencyDollar, 
  HiOutlineClipboardList, 
  HiOutlineUserGroup,
  HiOutlineLockClosed,
  HiOutlineShoppingBag,
  HiOutlineCalendar,
  HiOutlineLink,
  HiOutlineDocumentText,
  HiOutlineLogout,
  HiMenuAlt2,
  HiX
} from 'react-icons/hi';

const menuItems = [
  { icon: HiOutlineViewGrid, label: 'Inicio', path: '/admin/panel' },
  { icon: HiOutlineCurrencyDollar, label: 'Finanzas', path: '/admin/panel/finanzas' },
  { icon: HiOutlineClipboardList, label: 'Pendientes', path: '/admin/panel/pendientes' },
  { icon: HiOutlineUserGroup, label: 'Deudas', path: '/admin/panel/deudas' },
  { icon: HiOutlineLockClosed, label: 'Bóveda', path: '/admin/panel/vault' },
  { icon: HiOutlineShoppingBag, label: 'Compras', path: '/admin/panel/compras' },
  { icon: HiOutlineCalendar, label: 'Fechas', path: '/admin/panel/recordatorios' },
  { icon: HiOutlineLink, label: 'Enlaces', path: '/admin/panel/enlaces' },
  { icon: HiOutlineDocumentText, label: 'Notas', path: '/admin/panel/notas' },
];

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileHeaderVisible, setMobileHeaderVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  // Auto-hide mobile header on scroll down, show on scroll up
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const handleScroll = () => {
      const currentY = el.scrollTop;
      if (currentY > lastScrollY.current && currentY > 60) {
        setMobileHeaderVisible(false);
      } else {
        setMobileHeaderVisible(true);
      }
      lastScrollY.current = currentY;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) return null;

  return (
    <ToastProvider>
      <div className="h-screen bg-[#F8F9FA] flex overflow-hidden">
        {/* ═══ Desktop Sidebar ═══ */}
        <aside 
          className={`hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-gray-100 transition-all duration-500 ease-[0.16,1,0.3,1] ${
            isSidebarOpen ? 'w-72' : 'w-24'
          }`}
        >
          <div className="p-6 flex items-center gap-4 shrink-0">
            <div className="size-10 shrink-0 bg-black rounded-xl flex items-center justify-center text-white font-bold">AC</div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-dm-sans font-bold text-xl tracking-tight whitespace-nowrap"
                >
                  Panel Privado
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center transition-all duration-300 ${
                  isSidebarOpen 
                    ? 'gap-4 px-4 py-3.5 rounded-2xl' 
                    : 'justify-center w-12 h-12 mx-auto rounded-2xl'
                } ${
                  location.pathname === item.path 
                    ? 'bg-[var(--black)] text-white shadow-lg' 
                    : 'text-[var(--dark-gray)] hover:bg-[var(--soft-light-gray)]'
                }`}
              >
                <item.icon className="text-2xl shrink-0" />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-syne text-xs font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-50 shrink-0">
            <button
              onClick={handleLogout}
              className={`flex items-center transition-all duration-300 text-red-500 hover:bg-red-50 ${
                isSidebarOpen 
                  ? 'w-full gap-4 px-4 py-3.5 rounded-2xl' 
                  : 'justify-center w-12 h-12 mx-auto rounded-2xl'
              }`}
            >
              <HiOutlineLogout className="text-2xl shrink-0" />
              {isSidebarOpen && <span className="font-syne text-xs font-bold uppercase tracking-widest">Salir</span>}
            </button>
          </div>
        </aside>

        {/* ═══ Mobile Header (auto-hide on scroll) ═══ */}
        <div 
          className={`lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-5 z-50 transition-transform duration-300 ${
            mobileHeaderVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="size-9 bg-black rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">AC</div>
            <span className="font-dm-sans font-bold text-base tracking-tight">Panel Personal</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors active:scale-95"
          >
            {isSidebarOpen ? <HiX className="text-xl" /> : <HiMenuAlt2 className="text-xl" />}
          </button>
        </div>

        {/* ═══ Mobile Sidebar Overlay ═══ */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        {/* ═══ Mobile Sidebar Panel ═══ */}
        <motion.aside
          initial={{ x: '-100%' }}
          animate={{ x: isSidebarOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="lg:hidden fixed top-0 left-0 bottom-0 w-[80%] max-w-xs bg-white z-50 flex flex-col shadow-2xl"
        >
          <div className="flex items-center gap-4 p-6 pb-4 shrink-0">
            <div className="size-11 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xl">AC</div>
            <div className="flex flex-col">
              <span className="font-dm-sans font-bold text-lg tracking-tight">Panel Personal</span>
              <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">Panel de Control</span>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === item.path 
                    ? 'bg-[var(--black)] text-white shadow-lg' 
                    : 'text-[var(--dark-gray)] hover:bg-[var(--soft-light-gray)] active:scale-[0.98]'
                }`}
              >
                <item.icon className="text-xl shrink-0" />
                <span className="font-syne text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all active:scale-[0.98]"
            >
              <HiOutlineLogout className="text-xl" />
              <span className="font-syne text-[11px] font-bold uppercase tracking-widest">Cerrar Sesión</span>
            </button>
          </div>
        </motion.aside>

        {/* ═══ Main Content ═══ */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          {/* Desktop Top Bar */}
          <header className="hidden lg:flex h-16 items-center justify-between px-12 bg-white/60 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <HiMenuAlt2 className="text-xl" />
            </button>
            <div className="flex items-center gap-4">
               <div className="size-9 rounded-full bg-gradient-to-tr from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] p-[2px]">
                  <div className="size-full rounded-full bg-white flex items-center justify-center font-bold text-xs text-black">AC</div>
               </div>
            </div>
          </header>

          <div className="p-5 md:p-8 lg:p-12 pt-20 lg:pt-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
