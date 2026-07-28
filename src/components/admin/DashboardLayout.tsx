import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider, useToast } from '@/components/common/ToastContext';
import { ThemeProvider, useTheme } from '@/components/common/ThemeContext';
import { 
  requestNotificationPermission, 
  getNotificationPermissionState, 
  sendBrowserNotification, 
  scanAndNotifyUpcomingEvents 
} from '@/lib/notifications';
import CommandPalette from '@/components/admin/CommandPalette';
import { syncPinnedItemsWithSupabase } from '@/lib/pinned';
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
  HiOutlineBell,
  HiBell,
  HiOutlineSearch,
  HiMenuAlt2,
  HiX,
  HiOutlineColorSwatch,
  HiOutlineCheckCircle,
  HiOutlineBookOpen,
  HiOutlineDotsHorizontal
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
  { icon: HiOutlineColorSwatch, label: 'Proyectos', path: '/admin/panel/proyectos' },
  { icon: HiOutlineCheckCircle, label: 'Checklist', path: '/admin/panel/checklist' },
  { icon: HiOutlineBookOpen, label: 'Recetas', path: '/admin/panel/recetas' },
];

// Bottom nav shows only the most-used 5 modules for thumb-friendly mobile nav
const bottomNavItems = [
  { icon: HiOutlineViewGrid, label: 'Inicio', path: '/admin/panel' },
  { icon: HiOutlineCurrencyDollar, label: 'Finanzas', path: '/admin/panel/finanzas' },
  { icon: HiOutlineClipboardList, label: 'Tareas', path: '/admin/panel/pendientes' },
  { icon: HiOutlineBookOpen, label: 'Recetas', path: '/admin/panel/recetas' },
  { icon: HiOutlineDotsHorizontal, label: 'Más', path: null },
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
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermissionState());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    syncPinnedItemsWithSupabase();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    } else {
      setLoading(false);
      scanAndNotifyUpcomingEvents();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones flotantes PWA.');
      return;
    }

    if (Notification.permission === 'denied') {
      toast.info('Las notificaciones están bloqueadas en tu navegador. Habilítalas en la configuración de la página.');
      return;
    }

    const granted = await requestNotificationPermission();
    setNotifPermission(getNotificationPermissionState());

    if (granted) {
      toast.success('¡Notificaciones PWA activadas!');
      sendBrowserNotification('🔔 Notificaciones Activadas', {
        body: 'Te notificaremos automáticamente sobre tus próximas fechas importantes y tareas pendientes.',
      });
      scanAndNotifyUpcomingEvents();
    }
  };

  if (loading) return null;

  return (
    <div className="h-screen bg-soft-light-gray dark:bg-black text-black dark:text-white flex overflow-hidden transition-colors duration-300">
      {/* Universal Command Palette Search Modal */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ═══ Desktop Sidebar ═══ */}
      <aside 
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 ease-[0.16,1,0.3,1] ${
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

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto scrollbar-none">
        {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={item.path} className="group relative">
                <Link
                  to={item.path}
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`flex items-center transition-all duration-300 interactive-hover ${
                    isSidebarOpen 
                      ? 'gap-4 px-4 py-3.5 rounded-2xl w-full' 
                      : 'justify-center w-12 h-12 mx-auto rounded-2xl'
                  } ${
                    isActive
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/10' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <item.icon className="text-2xl shrink-0" />
                  {isSidebarOpen && (
                    <span className="font-syne text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </Link>
                {/* Tooltip only when sidebar is collapsed — outside the Link to avoid overflow clip */}
                {!isSidebarOpen && (
                  <span className="pointer-events-none absolute left-[56px] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-syne font-bold uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xl z-[999]">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800/80 shrink-0 space-y-2">
          <button
            onClick={handleToggleNotifications}
            className={`flex items-center transition-all duration-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              isSidebarOpen 
                ? 'w-full gap-4 px-4 py-3.5 rounded-2xl' 
                : 'justify-center w-12 h-12 mx-auto rounded-2xl'
            }`}
            title="Activar o probar notificaciones PWA"
          >
            {notifPermission === 'granted' ? (
              <HiBell className="text-2xl shrink-0 text-emerald-500" />
            ) : (
              <HiOutlineBell className="text-2xl shrink-0 text-amber-500 animate-bounce" />
            )}
            {isSidebarOpen && (
              <span className="font-syne text-xs font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200 whitespace-nowrap">
                {notifPermission === 'granted' ? 'Notificaciones' : 'Activar Alertas'}
              </span>
            )}
          </button>

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

      {/* ═══ Mobile Header ═══ */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between px-4 z-50 transition-all duration-300 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="size-9 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">AC</div>
          <span className="font-dm-sans font-bold text-sm sm:text-base tracking-tight text-black dark:text-white truncate">Panel Personal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl text-gray-700 dark:text-gray-300 transition-colors active:scale-95 interactive-hover"
            title="Buscar en todo el panel"
          >
            <HiOutlineSearch className="text-lg" />
          </button>

          <button 
            onClick={handleToggleNotifications}
            className="p-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl text-gray-700 dark:text-gray-300 transition-colors active:scale-95 interactive-hover"
            title="Notificaciones PWA"
          >
            {notifPermission === 'granted' ? (
              <HiBell className="text-lg text-emerald-500" />
            ) : (
              <HiOutlineBell className="text-lg text-amber-500" />
            )}
          </button>

          <button 
            onClick={toggleDarkMode}
            className="p-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl text-gray-700 dark:text-amber-400 transition-colors active:scale-95 interactive-hover"
            title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDarkMode ? <HiOutlineSun className="text-lg" /> : <HiOutlineMoon className="text-lg" />}
          </button>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95 text-gray-800 dark:text-gray-200 interactive-hover"
          >
            {isSidebarOpen ? <HiX className="text-lg" /> : <HiMenuAlt2 className="text-lg" />}
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
            onClick={handleToggleNotifications}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
          >
            {notifPermission === 'granted' ? (
              <HiBell className="text-xl text-emerald-500" />
            ) : (
              <HiOutlineBell className="text-xl text-amber-500" />
            )}
            <span className="font-syne text-[11px] font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200">
              {notifPermission === 'granted' ? 'Notificaciones Activas' : 'Activar Notificaciones'}
            </span>
          </button>

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
        <header className="hidden lg:flex h-16 items-center justify-between px-12 glass dark:dark-glass sticky top-0 z-30 transition-colors duration-300 gap-6 border-b-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl transition-colors text-gray-700 dark:text-gray-300 interactive-hover"
            >
              <HiMenuAlt2 className="text-xl" />
            </button>

            {/* Desktop Command Palette Search Bar */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 px-4 py-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 border border-gray-200/60 dark:border-gray-700/60 rounded-xl text-sm font-inter text-gray-400 dark:text-gray-400 max-w-sm w-full transition-all group"
            >
              <HiOutlineSearch className="text-base text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
              <span className="truncate">Buscar en todo el panel...</span>
              <kbd className="ml-auto px-2 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] font-syne font-bold">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={handleToggleNotifications}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 transition-all"
              title="Notificaciones PWA"
            >
              {notifPermission === 'granted' ? (
                <>
                  <HiBell className="text-base text-emerald-500" />
                  <span>Alertas OK</span>
                </>
              ) : (
                <>
                  <HiOutlineBell className="text-base text-amber-500 animate-bounce" />
                  <span>Activar Alertas</span>
                </>
              )}
            </button>

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

        <div className="p-5 md:p-8 lg:p-12 pt-20 pb-bottom-nav lg:pt-8 lg:pb-8 max-w-7xl mx-auto min-h-screen">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* ═══ Mobile Bottom Navigation Bar ═══ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 dark:bg-gray-950/90 backdrop-blur-2xl border-t border-gray-200/50 dark:border-gray-800/50 shadow-[0_-4px_32px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = item.path && location.pathname === item.path;
            if (!item.path) {
              // "Más" button opens mobile sidebar
              return (
                <button
                  key="mas"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all active:scale-90 text-gray-400 dark:text-gray-500"
                >
                  <item.icon className="text-xl" />
                  <span className="font-syne text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all active:scale-90 ${
                  isActive
                    ? 'text-black dark:text-white'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 w-8 h-0.5 bg-black dark:bg-white rounded-full"
                  />
                )}
                <item.icon className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className={`font-syne text-[9px] font-bold uppercase tracking-widest transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
