import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { logout } from '../lib/api/auth';
import { disableGoogleAutoSelect } from '../lib/auth/oauth-sdk';
import { queryClient } from '../lib/query-client';

export const useAdminLogout = () => {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: ['workout'] });
      queryClient.removeQueries({ queryKey: ['admin'] });
      await navigate({ to: '/login' });
    },
  });

  const handleLogout = () => {
    disableGoogleAutoSelect();
    mutation.mutate();
  };

  return {
    logoutMutation: mutation,
    handleLogout,
  };
};
