import type { TablesUpdate } from './database.types';
import { supabase } from './supabase';

async function check(request: PromiseLike<{ error: unknown }>) {
  const { error } = await request;
  if (error) throw error;
}

export const saveProfile = (userId: string, patch: TablesUpdate<'profiles'>) =>
  check(supabase.from('profiles').update(patch).eq('id', userId));

export const saveStrategic = (userId: string, patch: TablesUpdate<'strategic_profiles'>) =>
  check(supabase.from('strategic_profiles').update(patch).eq('user_id', userId));

export const saveExperience = (id: string, patch: TablesUpdate<'experiences'>) =>
  check(supabase.from('experiences').update(patch).eq('id', id));

export const saveProof = (id: string, patch: TablesUpdate<'proofs'>) =>
  check(supabase.from('proofs').update(patch).eq('id', id));
