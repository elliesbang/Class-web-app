import { supabase } from '@/lib/supabaseClient';

export async function fetchVodCategories() {
  const { data, error } = await supabase
    .from('vod_category')
    .select('*')
    .order('order_num', { ascending: true });

  if (error) {
    console.error('[vod-content] failed to load categories', error);
    throw error;
  }

  return data ?? [];
}
