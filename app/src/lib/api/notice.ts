import { supabase } from '../supabaseClient';

export type GlobalNotice = {
  id: number | string;
  title: string;
  content: string;
  thumbnailUrl?: string | null;
  isVisible: boolean;
  createdAt: string;
};

const normaliseNotice = (record: Record<string, any> | null): GlobalNotice | null => {
  if (!record) return null;
  const id = record.id ?? record.noticeId;
  const title = (record.title ?? record.name ?? '') as string;
  const content = (record.content ?? '') as string;
  if (!id || !title) return null;
  return {
    id,
    title,
    content,
    thumbnailUrl: (record.thumbnail_url as string | undefined) ?? (record.thumbnailUrl as string | undefined) ?? null,
    isVisible: Boolean(record.is_visible ?? record.isVisible ?? true),
    createdAt: (record.created_at as string | undefined) ?? new Date().toISOString(),
  };
};

export const getGlobalNotices = async (): Promise<GlobalNotice[]> => {
  const { data, error } = await supabase
    .from('classroom_content')
    .select('*')
    .eq('type', 'global_notice');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((item) => normaliseNotice(item as Record<string, any>))
    .filter((item): item is GlobalNotice => item != null);
};

export const createGlobalNotice = async (payload: Partial<GlobalNotice>) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .insert({
      type: 'global_notice',
      title: payload.title,
      content: payload.content,
      thumbnail_url: payload.thumbnailUrl,
      is_visible: payload.isVisible,
    })
    .select();

  if (error) throw new Error(error.message);
  return normaliseNotice((data ?? [])[0] as Record<string, any>);
};

export const updateGlobalNotice = async (id: string | number, payload: Partial<GlobalNotice>) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .update({
      title: payload.title,
      content: payload.content,
      thumbnail_url: payload.thumbnailUrl,
      is_visible: payload.isVisible,
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return normaliseNotice((data ?? [])[0] as Record<string, any>);
};

export const deleteGlobalNotice = async (id: string | number) => {
  const { error } = await supabase.from('classroom_content').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
