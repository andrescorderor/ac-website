import { StrictMode } from 'react';

import './index.css';
import './i18n';
import Cursor from '@components/common/Cursor';
import Layout from '@components/common/Layout';
import Home from '@pages/Home';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

import Login from '@pages/admin/Login';
import DashboardLayout from '@components/admin/DashboardLayout';
import DashboardHome from '@pages/admin/DashboardHome';
import Finanzas from '@pages/admin/Finanzas';
import Pendientes from '@pages/admin/Pendientes';
import Deudas from '@pages/admin/Deudas';

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
        element: <DashboardHome />,
      },
      {
        path: 'finanzas',
        element: <Finanzas />,
      },
      {
        path: 'pendientes',
        element: <Pendientes />,
      },
      {
        path: 'deudas',
        element: <Deudas />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Cursor />
    <RouterProvider router={router} />
  </StrictMode>,
);
