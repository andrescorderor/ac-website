import { StrictMode, ComponentType, lazy, Suspense, useEffect } from 'react';

import './index.css';
import './i18n';
import Cursor from '@components/common/Cursor';
import Layout from '@components/common/Layout';
import Home from '@pages/Home';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import {
  createBrowserRouter,
  RouterProvider,
  useRouteError,
  Link,
} from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

const Login = lazyWithRetry(() => import('@pages/admin/Login'));
const DashboardLayout = lazyWithRetry(() => import('@components/admin/DashboardLayout'));
import NotFound from '@pages/NotFound';

const CHUNK_RELOAD_KEY = 'ac_chunk_reload_ts';
const CHUNK_RELOAD_COOLDOWN_MS = 15000;

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Unable to preload CSS')
  );
}

/** Recarga la página tras un nuevo deploy (máx. una vez cada 15s) para cargar los hashes vigentes. */
function reloadForNewBuild(): boolean {
  try {
    const lastTs = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
    const now = Date.now();
    if (now - lastTs > CHUNK_RELOAD_COOLDOWN_MS) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => regs.forEach((r) => r.update().catch(() => {})))
          .catch(() => {});
      }
      window.location.reload();
      return true;
    }
  } catch {
    // Modo incógnito sin sessionStorage: recargar directamente solo si no viene de bucle
  }
  return false;
}

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadForNewBuild();
  });
}

function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err) => {
      if (isChunkLoadError(err) && reloadForNewBuild()) {
        // Mantiene Suspense activo mientras el navegador recarga hacia la nueva versión
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    })
  );
}

function RouteErrorBoundary() {
  const error = useRouteError();
  const isChunkErr = isChunkLoadError(error);

  useEffect(() => {
    if (isChunkErr) {
      reloadForNewBuild();
    }
  }, [isChunkErr]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md surface-card rounded-[2rem] p-6 sm:p-8 text-center space-y-5">
        <div className="mx-auto size-14 rounded-2xl bg-[var(--vibrant-sky-blue)]/10 text-[var(--vibrant-sky-blue)] flex items-center justify-center text-2xl font-bold">
          ↻
        </div>
        <div className="space-y-2">
          <h1 className="font-dm-sans text-xl sm:text-2xl font-bold tracking-tight">
            {isChunkErr ? 'Nueva versión disponible' : 'No se pudo cargar el módulo'}
          </h1>
          <p className="font-inter text-sm text-gray-500 dark:text-gray-400">
            {isChunkErr
              ? 'Se desplegó una actualización del panel mientras tenías la sesión abierta. Recarga para sincronizar los archivos.'
              : 'Ocurrió un fallo inesperado al abrir esta vista.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Recargar Panel
          </button>
          <Link
            to="/admin/panel"
            className="px-6 min-h-[44px] py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

// Lazy-loaded Admin Pages con auto-recuperación tras despliegues
const DashboardHome = lazyWithRetry(() => import('@pages/admin/DashboardHome'));
const Finanzas = lazyWithRetry(() => import('@pages/admin/Finanzas'));
const Pendientes = lazyWithRetry(() => import('@pages/admin/Pendientes'));
const Deudas = lazyWithRetry(() => import('@pages/admin/Deudas'));
const Vault = lazyWithRetry(() => import('@pages/admin/Vault'));
const Compras = lazyWithRetry(() => import('@pages/admin/Compras'));
const Recordatorios = lazyWithRetry(() => import('@pages/admin/Recordatorios'));
const Enlaces = lazyWithRetry(() => import('@pages/admin/Enlaces'));
const Notas = lazyWithRetry(() => import('@pages/admin/Notas'));
const Proyectos = lazyWithRetry(() => import('@pages/admin/Proyectos'));
const ChecklistMensual = lazyWithRetry(() => import('@pages/admin/ChecklistMensual'));
const Recetas = lazyWithRetry(() => import('@pages/admin/Recetas'));
const Plantas = lazyWithRetry(() => import('@pages/admin/Plantas'));
const Entrenamiento = lazyWithRetry(() => import('@pages/admin/Entrenamiento'));
const Respaldo = lazyWithRetry(() => import('@pages/admin/Respaldo'));
const Calendario = lazyWithRetry(() => import('@pages/admin/Calendario'));
const Prompts = lazyWithRetry(() => import('@pages/admin/Prompts'));
const DivisorCuentas = lazyWithRetry(() => import('@pages/admin/DivisorCuentas'));
const PortafolioCMS = lazyWithRetry(() => import('@pages/admin/PortafolioCMS'));
const Papelera = lazyWithRetry(() => import('@pages/admin/Papelera'));

const PageLoader = () => (
  <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
    <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
      ))}
    </div>
    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
  </div>
);

registerSW({ immediate: true });

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/admin/panel',
    element: (
      <Suspense fallback={<PageLoader />}>
        <DashboardLayout />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardHome />
          </Suspense>
        ),
      },
      {
        path: 'finanzas',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Finanzas />
          </Suspense>
        ),
      },
      {
        path: 'pendientes',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Pendientes />
          </Suspense>
        ),
      },
      {
        path: 'deudas',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Deudas />
          </Suspense>
        ),
      },
      {
        path: 'vault',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Vault />
          </Suspense>
        ),
      },
      {
        path: 'compras',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Compras />
          </Suspense>
        ),
      },
      {
        path: 'recordatorios',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Recordatorios />
          </Suspense>
        ),
      },
      {
        path: 'enlaces',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Enlaces />
          </Suspense>
        ),
      },
      {
        path: 'notas',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Notas />
          </Suspense>
        ),
      },
      {
        path: 'proyectos',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Proyectos />
          </Suspense>
        ),
      },
      {
        path: 'checklist',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ChecklistMensual />
          </Suspense>
        ),
      },
      {
        path: 'recetas',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Recetas />
          </Suspense>
        ),
      },
      {
        path: 'plantas',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Plantas />
          </Suspense>
        ),
      },
      {
        path: 'entrenamiento',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Entrenamiento />
          </Suspense>
        ),
      },
      {
        path: 'respaldo',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Respaldo />
          </Suspense>
        ),
      },
      {
        path: 'calendario',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Calendario />
          </Suspense>
        ),
      },
      {
        path: 'prompts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Prompts />
          </Suspense>
        ),
      },
      {
        path: 'divisor',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DivisorCuentas />
          </Suspense>
        ),
      },
      {
        path: 'portafolio',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PortafolioCMS />
          </Suspense>
        ),
      },
      {
        path: 'papelera',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Papelera />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <Cursor />
      <RouterProvider router={router} />
    </MotionConfig>
  </StrictMode>
);
