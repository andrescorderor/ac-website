import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import PortfolioHome from '@components/home/PortfolioHome';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/admin/panel', { replace: true });
      }
    });
  }, [navigate]);

  return <PortfolioHome />;
}
