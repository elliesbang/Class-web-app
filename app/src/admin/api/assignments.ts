import { supabase } from '../../lib/supabase';

export async function getAssignments() {
  return supabase
    .from('assignments')
    .select('*, assignments_feedback(*)')
    .order('created_at', { ascending: false });
}
