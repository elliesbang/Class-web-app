import { supabase } from '@/lib/supabaseClient';

const getSupabaseBrowserClient = () => supabase;

export async function fetchVodCategories() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('vod_categories')
    .select('id, name')
    .order('order_num', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
