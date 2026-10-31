import { useQuery } from '@tanstack/react-query';
import type { Objective } from '@/lib/objectives';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type ProfileExperience = {
  id: string;
  title: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  position: number;
};

export type ProfileProof = {
  id: string;
  label: string;
  value: string | null;
  context: string | null;
  source: string | null;
};

export type FullProfile = {
  fullName: string;
  country: string;
  objective: Objective | null;
  headline: string;
  about: string;
  offer: string;
  targetAudience: string;
  skills: string[];
  completeness: number;
  experiences: ProfileExperience[];
  proofs: ProfileProof[];
};

export function useFullProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['full-profile', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<FullProfile> => {
      const id = userId as string;
      const [profile, strategic, experiences, proofs] = await Promise.all([
        supabase.from('profiles').select('full_name, country, objective').eq('id', id).single(),
        supabase
          .from('strategic_profiles')
          .select('headline, about, offer, target_audience, skills, completeness')
          .eq('user_id', id)
          .maybeSingle(),
        supabase
          .from('experiences')
          .select('id, title, company, start_date, end_date, description, position')
          .eq('user_id', id)
          .order('position'),
        supabase
          .from('proofs')
          .select('id, label, value, context, source')
          .eq('user_id', id)
          .order('created_at'),
      ]);
      if (profile.error) throw profile.error;
      if (strategic.error) throw strategic.error;
      if (experiences.error) throw experiences.error;
      if (proofs.error) throw proofs.error;

      return {
        fullName: profile.data.full_name ?? '',
        country: profile.data.country ?? '',
        objective: profile.data.objective,
        headline: strategic.data?.headline ?? '',
        about: strategic.data?.about ?? '',
        offer: strategic.data?.offer ?? '',
        targetAudience: strategic.data?.target_audience ?? '',
        skills: strategic.data?.skills ?? [],
        completeness: strategic.data?.completeness ?? 0,
        experiences: experiences.data,
        proofs: proofs.data,
      };
    },
  });
}
