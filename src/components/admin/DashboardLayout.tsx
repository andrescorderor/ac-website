import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider } from '@/components/common/ToastContext';
import { ThemeProvider, useTheme } from '@/components/common/ThemeContext';
import { 
  HiOutlineViewGrid, 
  HiOutlineCurrencyDollar, 
  HiOutlineClipboardList, 
  HiOutlineUserGroup,
  HiOutlineLockClosed,
  HiOutlineShoppingBag,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineLogout,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineGlobeAlt,
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
  { icon: HiOutlineDocumentText, label: 'Notas', path: '/admin/panel/notas' },
];

export default function DashboardLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DashboardLayoutContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

function DashboardLayoutContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileHeaderVisible, setMobileHeaderVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    checkUser();
  }, []);

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
    <div className="h-screen bg-[#F8F9FA] dark:bg-[#0B0F17] text-gray-900 dark:text-gray-100 flex overflow-hidden transition-colors duration-300">
      {/* ═══ Desktop Sidebar ═══ */}
      <aside 
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-white dark:bg-[#111827] border-r border-gray-100 dark:border-gray-800/80 transition-all duration-500 ease-[0.16,1,0.3,1] ${
          isSidebarOpen ? 'w-72' : 'w-24'
        }`}
      >
        <div className="p-6 flex items-center gap-4 shrink-0">
          <div className="size-10 shrink-0 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center font-bold">
            AC
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-dm-sans font-bold text-xl tracking-tight whitespace-nowrap text-black dark:text-white"
              >
                Panel Privado
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto scrollbar-thin">
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
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-black dark:hover:text-white'
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

        <div className="p-3 border-t border-gray-100 dark:border-gray-800/80 shrink-0 space-y-2">
          <button
            onClick={toggleDarkMode}
            className={`flex items-center transition-all duration-300 text-gray-700 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              isSidebarOpen 
                ? 'w-full gap-4 px-4 py-3.5 rounded-2xl' 
                : 'justify-center w-12 h-12 mx-auto rounded-2xl'
            }`}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? <HiOutlineSun className="text-2xl shrink-0 text-amber-400" /> : <HiOutlineMoon className="text-2xl shrink-0 text-gray-700" />}
            {isSidebarOpen && (
              <span className="font-syne text-xs font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200">
                {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
              </span>
            )}
          </button>

          <Link
            to="/"
            className={`flex items-center transition-all duration-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              isSidebarOpen 
                ? 'w-full gap-4 px-4 py-3.5 rounded-2xl' 
                : 'justify-center w-12 h-12 mx-auto rounded-2xl'
            }`}
            title="Ir a Landing Page Principal"
          >
            <HiOutlineGlobeAlt className="text-2xl shrink-0" />
            {isSidebarOpen && (
              <span className="font-syne text-xs font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200 whitespace-nowrap">
                Ver Landing Page
              </span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className={`flex items-center transition-all duration-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 ${
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
        className={`lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-5 z-50 transition-transform duration-300 ${
          mobileHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="size-9 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">AC</div>
          <span className="font-dm-sans font-bold text-base tracking-tight text-black dark:text-white">Panel Personal</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-700 dark:text-amber-400 transition-colors active:scale-95"
            title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDarkMode ? <HiOutlineSun className="text-xl" /> : <HiOutlineMoon className="text-xl" />}
          </button>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95 text-gray-800 dark:text-gray-200"
          >
            {isSidebarOpen ? <HiX className="text-xl" /> : <HiMenuAlt2 className="text-xl" />}
          </button>
        </div>
      </div>

      {/* ═══ Mobile Sidebar Overlay ═══ */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* ═══ Mobile Sidebar Panel ═══ */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="lg:hidden fixed top-0 left-0 bottom-0 w-[80%] max-w-xs bg-white dark:bg-[#111827] z-50 flex flex-col shadow-2xl border-r border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-4 p-6 pb-4 shrink-0">
          <div className="size-11 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center font-bold text-lg shadow-xl">AC</div>
          <div className="flex flex-col">
            <span className="font-dm-sans font-bold text-lg tracking-tight text-black dark:text-white">Panel Personal</span>
            <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">Panel de Control</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98]'
              }`}
            >
              <item.icon className="text-xl shrink-0" />
              <span className="font-syne text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-700 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
          >
            {isDarkMode ? <HiOutlineSun className="text-xl text-amber-400" /> : <HiOutlineMoon className="text-xl" />}
            <span className="font-syne text-[11px] font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200">
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          </button>

          <Link
            to="/"
            onClick={() => setIsSidebarOpen(false)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
          >
            <HiOutlineGlobeAlt className="text-xl" />
            <span className="font-syne text-[11px] font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200">
              Ver Landing Page
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all active:scale-[0.98]"
          >
            <HiOutlineLogout className="text-xl" />
            <span className="font-syne text-[11px] font-bold uppercase tracking-widest">Cerrar Sesión</span>
          </button>
        </div>
      </motion.aside>

      {/* ═══ Main Content ═══ */}
      <main ref={mainRef} className="flex-1 overflow-y-auto">
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex h-16 items-center justify-between px-12 bg-white/60 dark:bg-[#111827]/60 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/80 sticky top-0 z-30 transition-colors duration-300">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-300"
          >
            <HiMenuAlt2 className="text-xl" />
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all"
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDarkMode ? (
                <>
                  <HiOutlineSun className="text-base text-amber-400" />
                  <span>Claro</span>
                </>
              ) : (
                <>
                  <HiOutlineMoon className="text-base text-gray-700" />
                  <span>Oscuro</span>
                </>
              )}
            </button>

            <div className="size-9 rounded-full bg-gradient-to-tr from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] p-[2px]">
              <div className="size-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center font-bold text-xs text-black dark:text-white">
                AC
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8 lg:p-12 pt-20 lg:pt-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
