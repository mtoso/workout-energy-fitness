import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export const AdminHomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: '/admin/users' });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center text-zinc-500">
      Reindirizzamento al backoffice...
    </div>
  );
};
