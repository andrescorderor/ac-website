import { Outlet } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex size-full flex-col items-center overflow-x-hidden">
      <Header />
      <Outlet />
      <Outlet />
      <Outlet />
      <Footer />
    </div>
  );
}
