import { supabase } from '@/lib/supabaseClient';

export async function createFeedback(payload: { assignment_id: number; content: string }) {
  return supabase.from('assignments_feedback').insert(payload).select();
}
