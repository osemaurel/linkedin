import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Objective } from '@/lib/objectives';
import { useAuth } from './useAuth';

export type ProfileSource = 'pdf' | 'paste' | 'none';

export type OnboardingState = {
  source: ProfileSource | null;
  headline: string | null;
  experiences: number;
  objective: Objective | null;
  offer: string | null;
};

export function useOnboarding() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['onboarding', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<OnboardingState> => {
      const id = userId as string;
      const [strategic, profile, experiences] = await Promise.all([
        supabase
          .from('strategic_profiles')
          .select('headline, offer, source:raw_source->>source')
          .eq('user_id', id)
          .maybeSingle(),
        supabase.from('profiles').select('objective').eq('id', id).single(),
        supabase.from('experiences').select('id', { count: 'exact', head: true }).eq('user_id', id),
      ]);
      if (strategic.error) throw strategic.error;
      if (profile.error) throw profile.error;
      if (experiences.error) throw experiences.error;

      return {
        source: (strategic.data?.source as ProfileSource | undefined) ?? null,
        headline: strategic.data?.headline ?? null,
        experiences: experiences.count ?? 0,
        objective: profile.data.objective,
        offer: strategic.data?.offer ?? null,
      };
    },
  });
}
