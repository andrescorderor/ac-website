import { StrictMode } from 'react';

import './index.css';
import Cursor from '@components/common/Cursor';
import Layout from '@components/common/Layout';
import About from '@pages/About';
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
      {
        path: '/about',
        element: <About />,
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
