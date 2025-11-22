import { supabase } from '../../lib/supabase';

export async function createFeedback(payload: { assignment_id: number; content: string }) {
  return supabase.from('assignments_feedback').insert(payload).select();
}
