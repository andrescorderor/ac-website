import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider, useToast } from '@/components/common/ToastContext';
import { ThemeProvider, useTheme } from '@/components/common/ThemeContext';
import { 
  requestNotificationPermission, 
  registerPushSubscription,
  getNotificationPermissionState, 
  sendBrowserNotification, 
  scanAndNotifyUpcomingEvents 
} from '@/lib/notifications';
import CommandPalette from '@/components/admin/CommandPalette';
import QuickCaptureModal from '@/components/admin/QuickCaptureModal';
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
  HiOutlineBell,
  HiBell,
  HiOutlineSearch,
  HiMenuAlt2,
  HiX,
  HiOutlineColorSwatch,
  HiOutlineCheckCircle,
  HiOutlineBookOpen,
  HiOutlineSparkles,
  HiOutlineDatabase,
  HiOutlineDotsHorizontal,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineCalculator,
  HiOutlineTemplate,
  HiOutlineGlobe
} from 'react-icons/hi';
import { FaDumbbell } from 'react-icons/fa';

const menuGroups = [
  {
    title: 'Ejecución',
    items: [
      { icon: HiOutlineViewGrid, label: 'Inicio', path: '/admin/panel' },
      { icon: HiOutlineCalendar, label: 'Calendario 360°', path: '/admin/panel/calendario' },
      { icon: HiOutlineClipboardList, label: 'Pendientes', path: '/admin/panel/pendientes' },
      { icon: HiOutlineColorSwatch, label: 'Proyectos', path: '/admin/panel/proyectos' },
      { icon: HiOutlineCheckCircle, label: 'Checklist', path: '/admin/panel/checklist' },
    ],
  },
  {
    title: 'Finanzas & Hogar',
    items: [
      { icon: HiOutlineCurrencyDollar, label: 'Finanzas', path: '/admin/panel/finanzas' },
      { icon: HiOutlineShoppingBag, label: 'Compras', path: '/admin/panel/compras' },
      { icon: HiOutlineUserGroup, label: 'Deudas', path: '/admin/panel/deudas' },
      { icon: HiOutlineCalculator, label: 'Divisor Cuentas', path: '/admin/panel/divisor' },
      { icon: HiOutlineBookOpen, label: 'Recetas', path: '/admin/panel/recetas' },
      { icon: HiOutlineSparkles, label: 'Plantas', path: '/admin/panel/plantas' },
    ],
  },
  {
    title: 'Conocimiento & Marca',
    items: [
      { icon: HiOutlineDocumentText, label: 'Notas', path: '/admin/panel/notas' },
      { icon: HiOutlineExternalLink, label: 'Enlaces', path: '/admin/panel/enlaces' },
      { icon: HiOutlineTemplate, label: 'Prompts', path: '/admin/panel/prompts' },
      { icon: HiOutlineLockClosed, label: 'Bóveda', path: '/admin/panel/vault' },
      { icon: HiOutlineCalendar, label: 'Fechas', path: '/admin/panel/recordatorios' },
      { icon: FaDumbbell, label: 'Gym & Rutinas', path: '/admin/panel/entrenamiento' },
      { icon: HiOutlineGlobe, label: 'Portafolio CMS', path: '/admin/panel/portafolio' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { icon: HiOutlineTrash, label: 'Papelera', path: '/admin/panel/papelera' },
      { icon: HiOutlineDatabase, label: 'Respaldo', path: '/admin/panel/respaldo' },
    ],
  },
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
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    checkUser();
    syncPinnedItemsWithSupabase({ silent: true });
  }, []);

  const routeTitles: Record<string, string> = {
    '/admin/panel': 'Inicio • Panel Privado',
    '/admin/panel/finanzas': 'Finanzas • Panel Privado',
    '/admin/panel/pendientes': 'Pendientes & Tareas • Panel Privado',
    '/admin/panel/deudas': 'Deudas & Cobros • Panel Privado',
    '/admin/panel/vault': 'Bóveda de Textos • Panel Privado',
    '/admin/panel/compras': 'Lista de Compras & Mandado • Panel Privado',
    '/admin/panel/recordatorios': 'Fechas & Recordatorios • Panel Privado',
    '/admin/panel/enlaces': 'Enlaces Rápidos • Panel Privado',
    '/admin/panel/notas': 'Notas Importantes • Panel Privado',
    '/admin/panel/entrenamiento': 'Gym & Rutinas • Panel Privado',
    '/admin/panel/proyectos': 'Proyectos Creativos • Panel Privado',
    '/admin/panel/checklist': 'Checklist Mensual • Panel Privado',
    '/admin/panel/recetas': 'Recetario Fitness • Panel Privado',
    '/admin/panel/plantas': 'Mis Plantas • Panel Privado',
    '/admin/panel/respaldo': 'Respaldo & Recuperación • Panel Privado',
    '/admin/panel/calendario': 'Calendario 360° • Panel Privado',
    '/admin/panel/prompts': 'Prompts & Variables • Panel Privado',
    '/admin/panel/divisor': 'Divisor de Cuentas • Panel Privado',
    '/admin/panel/portafolio': 'Mini-CMS Portafolio • Panel Privado',
    '/admin/panel/papelera': 'Papelera de Reciclaje • Panel Privado',
  };

  const activeRouteLabel = (routeTitles[location.pathname] || 'Panel Privado').split(' • ')[0];

  useEffect(() => {
    const title = routeTitles[location.pathname] || 'Panel Privado';
    document.title = `${title} | Andrés Cordero`;
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
        return;
      }
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
      if ('Notification' in window && Notification.permission === 'granted') {
        registerPushSubscription();
      }
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
      scanAndNotifyUpcomingEvents({ forceSystemNotification: true });
    }
  };

  if (loading) return null;

  return (
    <div className="h-[100dvh] bg-soft-light-gray dark:bg-[#09090b] text-black dark:text-white flex overflow-hidden transition-colors duration-300">
      {/* Universal Command Palette Search Modal */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Universal Quick Capture Modal */}
      <QuickCaptureModal isOpen={isQuickCaptureOpen} onClose={() => setIsQuickCaptureOpen(false)} />

      {/* ═══ Desktop Sidebar ═══ */}
      <aside 
        className="hidden lg:flex flex-col h-[100dvh] sticky top-0 w-72 shrink-0 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl border-r border-gray-200/80 dark:border-white/[0.08] transition-all duration-300"
      >
        <div className="p-6 flex items-center gap-3.5 shrink-0">
          <Link to="/admin/panel" className="size-11 shrink-0 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-[var(--vibrant-sky-blue)] via-indigo-500 to-[var(--magenta-pink)] shadow-md hover:scale-105 active:scale-95 transition-all">
            <div className="size-full rounded-[14px] bg-white dark:bg-gray-900 flex items-center justify-center p-2 overflow-hidden">
              <img src="/assets/ac-website-icon.svg" alt="AC Logo" className="size-full object-contain" />
            </div>
          </Link>
          <div className="flex flex-col min-w-0">
            <span className="font-dm-sans font-bold text-lg tracking-tight whitespace-nowrap text-black dark:text-white">
              Panel Privado
            </span>
            <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">
              Andrés Cordero
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-4 overflow-y-auto scrollbar-none pb-4">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <span className="px-4 font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 block">
                {group.title}
              </span>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all duration-300 interactive-hover ${
                      isActive
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/10'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="text-xl shrink-0" />
                    <span className="font-syne text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800/80 shrink-0 space-y-2">
          <button
            onClick={handleToggleNotifications}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Activar o probar notificaciones PWA"
          >
            {notifPermission === 'granted' ? (
              <HiBell className="text-2xl shrink-0 text-emerald-500" />
            ) : (
              <HiOutlineBell className="text-2xl shrink-0 text-amber-500 animate-bounce" />
            )}
            <span className="font-syne text-xs font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200 whitespace-nowrap">
              {notifPermission === 'granted' ? 'Notificaciones' : 'Activar Alertas'}
            </span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 text-gray-700 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? <HiOutlineSun className="text-2xl shrink-0 text-amber-400" /> : <HiOutlineMoon className="text-2xl shrink-0 text-gray-700" />}
            <span className="font-syne text-xs font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200">
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <HiOutlineLogout className="text-2xl shrink-0" />
            <span className="font-syne text-xs font-bold uppercase tracking-widest">Salir</span>
          </button>

          <div className="text-center select-none pt-1">
            <span className="font-syne text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 block">
              VERSIÓN v7.4.1
            </span>
          </div>
        </div>
      </aside>

      {/* ═══ Mobile Header ═══ */}
      <header 
        className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 px-3.5 sm:px-4 z-40 transition-all duration-300 shadow-xs"
      >
        <Link to="/admin/panel" className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="size-10 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-[var(--vibrant-sky-blue)] via-indigo-500 to-[var(--magenta-pink)] shadow-md shrink-0">
            <div className="size-full rounded-[10px] bg-white dark:bg-gray-900 flex items-center justify-center p-1.5 overflow-hidden">
              <img src="/assets/ac-website-icon.svg" alt="AC Logo" className="size-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-dm-sans font-bold text-sm sm:text-base tracking-tight text-black dark:text-white truncate">
              {activeRouteLabel}
            </span>
            <span className="font-syne text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">
              Panel Personal
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsQuickCaptureOpen(true)}
            className="min-w-[44px] min-h-[44px] px-3 bg-black dark:bg-white text-white dark:text-black rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            title="Captura Rápida"
            aria-label="Captura Rápida"
          >
            <HiOutlinePlus className="text-lg" />
          </button>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="min-w-[44px] min-h-[44px] p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200/70 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
            title="Buscar en todo el panel"
            aria-label="Buscar en todo el panel"
          >
            <HiOutlineSearch className="text-lg" />
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="min-w-[44px] min-h-[44px] p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200/70 dark:border-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95 text-gray-800 dark:text-gray-200 flex items-center justify-center cursor-pointer"
            title="Abrir menú completo"
            aria-label="Abrir menú completo"
          >
            {isSidebarOpen ? <HiX className="text-lg" /> : <HiMenuAlt2 className="text-lg" />}
          </button>
        </div>
      </header>

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
        <div className="flex items-center gap-3 p-6 pb-4 shrink-0">
          <div className="size-11 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-[var(--vibrant-sky-blue)] via-indigo-500 to-[var(--magenta-pink)] shadow-xl shrink-0">
            <div className="size-full rounded-[14px] bg-white dark:bg-gray-900 flex items-center justify-center p-2 overflow-hidden">
              <img src="/assets/ac-website-icon.svg" alt="AC Logo" className="size-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-dm-sans font-bold text-lg tracking-tight text-black dark:text-white truncate">Panel Personal</span>
            <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 truncate">Andrés Cordero</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-4 overflow-y-auto py-2">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <span className="px-4 font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 block">
                {group.title}
              </span>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all ${
                    location.pathname === item.path 
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98]'
                  }`}
                >
                  <item.icon className="text-xl shrink-0" />
                  <span className="font-syne text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                </Link>
              ))}
            </div>
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

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all active:scale-[0.98]"
          >
            <HiOutlineLogout className="text-xl" />
            <span className="font-syne text-[11px] font-bold uppercase tracking-widest">Cerrar Sesión</span>
          </button>

          <div className="text-center select-none pt-2">
            <span className="font-syne text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 block">
              VERSIÓN v7.4.1
            </span>
          </div>
        </div>
      </motion.aside>

      {/* ═══ Main Content ═══ */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 xl:px-10 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/[0.08] sticky top-0 z-30 transition-all duration-300 gap-6 shadow-xs">
          <div className="flex items-center gap-4 flex-1">

            {/* Desktop Command Palette Search Bar */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 px-4 min-h-[44px] py-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 border border-gray-200/60 dark:border-gray-700/60 rounded-xl text-sm font-inter text-gray-400 dark:text-gray-400 max-w-sm w-full transition-all group cursor-pointer"
            >
              <HiOutlineSearch className="text-base text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
              <span className="truncate">Buscar en todo el panel...</span>
              <kbd className="ml-auto px-2 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] font-syne font-bold">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsQuickCaptureOpen(true)}
              className="flex items-center gap-2 px-4 min-h-[44px] py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-syne font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Captura rápida (Ctrl + Shift + N)"
            >
              <HiOutlinePlus className="text-base" />
              <span>Captura</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-4 min-h-[44px] py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
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

            <div className="size-10 rounded-full bg-gradient-to-tr from-[var(--vibrant-sky-blue)] via-indigo-500 to-[var(--magenta-pink)] p-[2px] shadow-sm shrink-0">
              <img
                src="/assets/Profile.png"
                alt="Andrés Cordero"
                className="size-full rounded-full object-cover bg-white dark:bg-gray-900"
              />
            </div>
          </div>
        </header>

        <div className="px-3.5 sm:px-6 md:p-8 lg:p-10 pt-[76px] pb-bottom-nav lg:pt-8 lg:pb-8 max-w-[1600px] mx-auto min-h-full">
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border-t border-gray-200/80 dark:border-white/[0.08] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around px-1.5 py-1.5">
          {bottomNavItems.map((item) => {
            const isActive = item.path && location.pathname === item.path;
            if (!item.path) {
              // "Más" button opens mobile sidebar
              return (
                <button
                  key="mas"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 px-3 min-h-[44px] py-1.5 rounded-2xl transition-all active:scale-90 text-gray-500 dark:text-gray-400 cursor-pointer"
                >
                  <item.icon className="text-xl" />
                  <span className="font-syne text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 min-h-[44px] py-1.5 rounded-2xl transition-all active:scale-90 ${
                  isActive
                    ? 'text-black dark:text-white bg-gray-100/90 dark:bg-white/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-1 w-8 h-0.5 bg-black dark:bg-white rounded-full"
                  />
                )}
                <item.icon className={`text-xl transition-transform ${isActive ? 'scale-105' : ''}`} />
                <span className={`font-syne text-[10px] font-bold uppercase tracking-wider transition-all ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
