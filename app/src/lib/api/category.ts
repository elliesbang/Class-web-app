import { supabase } from '@/lib/supabaseClient';

export type CategoryRecord = { id: number; name: string; parent_id: number | null };

export const getCategories = async (): Promise<CategoryRecord[]> => {
  const { data, error } = await supabase
    .from('class_category')
    .select('*')
    .order('order_num', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRecord[];
};

export async function fetchCategories(): Promise<CategoryRecord[]> {
  const data = await getCategories();

  return (data ?? [])
    .map((item) => item as Partial<CategoryRecord & { order_num?: number }>)
    .filter((item): item is CategoryRecord => item != null && typeof item.id !== 'undefined' && typeof item.name === 'string')
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name),
      parent_id: item.parent_id == null ? null : Number(item.parent_id),
    }));
}
