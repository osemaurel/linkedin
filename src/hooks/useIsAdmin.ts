import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * « Suis-je administrateur ? », pour l'affichage seulement : chaque donnée
 * d'administration est de toute façon refusée côté serveur sans ce droit.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      return data === true;
    },
    staleTime: 5 * 60 * 1000,
  });
}
