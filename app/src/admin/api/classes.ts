import { supabase } from '../../lib/supabase';
import type { AssignmentRule } from '../components/RuleSelector';

export interface ClassPayload extends AssignmentRule {
  name: string;
  description: string;
  category: string;
  code: string;
}

export async function getClasses() {
  return supabase.from('classes').select('*').order('created_at', { ascending: false });
}

export async function createClass(payload: ClassPayload) {
  return supabase.from('classes').insert(payload).select();
}

export async function getClass(id: string | number) {
  return supabase.from('classes').select('*').eq('id', id).single();
}
