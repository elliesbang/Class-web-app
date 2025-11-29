import { supabase } from '@/lib/supabaseClient';

export async function getClassStudents() {
  return supabase.from('classes_students').select('*').order('created_at', { ascending: false });
}

export async function getVodPurchases() {
  return supabase.from('vod_purchases').select('*').order('created_at', { ascending: false });
}
