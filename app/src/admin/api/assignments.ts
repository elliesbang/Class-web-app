import { supabase } from '@/lib/supabaseClient';

export async function getAssignments() {
  return supabase
    .from('assignments')
    .select('*, assignments_feedback(*)')
    .order('created_at', { ascending: false });
}
