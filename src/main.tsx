import { StrictMode } from 'react';

import './index.css';
import './i18n';
import Cursor from '@components/common/Cursor';
import Layout from '@components/common/Layout';
import Home from '@pages/Home';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

import { lazy, Suspense } from 'react';
import Login from '@pages/admin/Login';
import DashboardLayout from '@components/admin/DashboardLayout';
import NotFound from '@pages/NotFound';

// Lazy-loaded Admin Pages para optimización de bundle
const DashboardHome = lazy(() => import('@pages/admin/DashboardHome'));
const Finanzas = lazy(() => import('@pages/admin/Finanzas'));
const Pendientes = lazy(() => import('@pages/admin/Pendientes'));
const Deudas = lazy(() => import('@pages/admin/Deudas'));
const Vault = lazy(() => import('@pages/admin/Vault'));
const Compras = lazy(() => import('@pages/admin/Compras'));
const Recordatorios = lazy(() => import('@pages/admin/Recordatorios'));
const Enlaces = lazy(() => import('@pages/admin/Enlaces'));
const Notas = lazy(() => import('@pages/admin/Notas'));
const Proyectos = lazy(() => import('@pages/admin/Proyectos'));
const ChecklistMensual = lazy(() => import('@pages/admin/ChecklistMensual'));
const Recetas = lazy(() => import('@pages/admin/Recetas'));
const Plantas = lazy(() => import('@pages/admin/Plantas'));
const Entrenamiento = lazy(() => import('@pages/admin/Entrenamiento'));

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
    children: [
      {
        path: '/',
        element: <Home />,
      },
    ],
  },
  {
    path: '/admin',
    element: <Login />,
  },
  {
    path: '/admin/panel',
    element: <DashboardLayout />,
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
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Cursor />
    <RouterProvider router={router} />
  </StrictMode>,
);
