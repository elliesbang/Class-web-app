import { supabase } from '@/lib/supabaseClient';

export type VodCategory = {
  id: number;
  name: string;
  order_index: number;
};

export async function fetchVodCategories(): Promise<VodCategory[]> {
  const { data, error } = await supabase
    .from('vod_category')
    .select('id, name, order_index')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
