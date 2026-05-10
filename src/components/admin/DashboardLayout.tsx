import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineViewGrid, 
  HiOutlineCurrencyDollar, 
  HiOutlineClipboardList, 
  HiOutlineUserGroup,
  HiOutlineLogout,
  HiMenuAlt2,
  HiX
} from 'react-icons/hi';

const menuItems = [
  { icon: HiOutlineViewGrid, label: 'Inicio', path: '/admin/panel' },
  { icon: HiOutlineCurrencyDollar, label: 'Finanzas', path: '/admin/panel/finanzas' },
  { icon: HiOutlineClipboardList, label: 'Pendientes', path: '/admin/panel/pendientes' },
  { icon: HiOutlineUserGroup, label: 'Deudas', path: '/admin/panel/deudas' },
];

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkUser();
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
    <div className="min-h-screen bg-[#F8F9FA] flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-500 ease-[0.16,1,0.3,1] ${
          isSidebarOpen ? 'w-72' : 'w-24'
        }`}
      >
        <div className="p-8 flex items-center gap-4">
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

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
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
                    className="font-syne text-xs font-bold uppercase tracking-widest overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-300"
          >
            <HiOutlineLogout className="text-2xl shrink-0" />
            {isSidebarOpen && <span className="font-syne text-xs font-bold uppercase tracking-widest">Salir</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-black rounded-xl flex items-center justify-center text-white font-bold shadow-lg">AC</div>
          <span className="font-dm-sans font-bold text-lg tracking-tight">Panel</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
        >
          {isSidebarOpen ? <HiX className="text-2xl" /> : <HiMenuAlt2 className="text-2xl" />}
        </button>
      </div>

      {/* Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-md z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="lg:hidden fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 p-8 flex flex-col shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="size-12 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl">AC</div>
          <div className="flex flex-col">
            <span className="font-dm-sans font-bold text-xl tracking-tight">Navaja Suiza</span>
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Panel de Control</span>
          </div>
        </div>
        <nav className="flex-1 space-y-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl ${
                location.pathname === item.path 
                  ? 'bg-[var(--black)] text-white shadow-lg' 
                  : 'text-[var(--dark-gray)] hover:bg-[var(--soft-light-gray)]'
              }`}
            >
              <item.icon className="text-2xl" />
              <span className="font-syne text-xs font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50"
        >
          <HiOutlineLogout className="text-2xl" />
          <span className="font-syne text-xs font-bold uppercase tracking-widest">Salir</span>
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto pt-20 lg:pt-0">
        <header className="hidden lg:flex h-20 items-center justify-between px-12 bg-white/50 backdrop-blur-md sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HiMenuAlt2 className="text-2xl" />
          </button>
          <div className="flex items-center gap-4">
             <div className="size-10 rounded-full bg-gradient-to-tr from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] p-[2px]">
                <div className="size-full rounded-full bg-white flex items-center justify-center font-bold text-xs text-black">AC</div>
             </div>
          </div>
        </header>

        <div className="p-6 lg:p-12 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
