import { StrictMode } from 'react';

import './index.css';
import './i18n';
import Cursor from '@components/common/Cursor';
import Layout from '@components/common/Layout';
import Home from '@pages/Home';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

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
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Cursor />
    <RouterProvider router={router} />
  </StrictMode>,
);
