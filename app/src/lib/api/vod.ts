import { supabase } from '../supabaseClient';

export type VodCategory = {
  id: number | string;
  name: string;
  order: number;
};

export type VodVideo = {
  id: number | string;
  categoryId: number | string;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  isRecommended: boolean;
  displayOrder: number;
  createdAt: string;
};

export type VodListResponse = {
  videos: VodVideo[];
  categories: VodCategory[];
};

/* -------------------------
 * Normalizer
 * ------------------------- */
const normaliseVodVideo = (record: Record<string, any> | null): VodVideo | null => {
  if (!record) return null;

  return {
    id: record.id,
    categoryId: record.vod_category ?? 'none',
    title: record.title ?? '',
    description: record.description ?? null,
    videoUrl: record.video_url ?? '',
    thumbnailUrl: record.thumbnail_url ?? null,
    isRecommended: Boolean(record.is_recommended),
    displayOrder: Number(record.display_order ?? 0),
    createdAt: record.created_at ?? new Date().toISOString(),
  };
};

/* -------------------------
 * Get VOD Categories
 * ------------------------- */
export const getVodCategories = async (): Promise<VodCategory[]> => {
  const { data, error } = await supabase
    .from('vod_category')
    .select('*')
    .order('order_', { ascending: true });

  if (error) throw new Error('Failed to load VOD categories : ' + error.message);

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    order: item.order_,
  }));
};

/* -------------------------
 * Get All VOD + Categories
 * ------------------------- */
export const getVodList = async (): Promise<VodListResponse> => {
  const { data, error } = await supabase
    .from('class_contents')
    .select('*')
    .eq('type', 'vod');

  if (error) throw new Error('Failed to load VOD list : ' + error.message);

  const videos = (data ?? [])
    .map((item) => normaliseVodVideo(item))
    .filter((item): item is VodVideo => item != null);

  const categories = await getVodCategories();

  return { videos, categories };
};

/* -------------------------
 * Get VOD by Category
 * ------------------------- */
export const getVodByCategory = async (
  categoryId: string | number
): Promise<VodVideo[]> => {
  const { data, error } = await supabase
    .from('class_contents')
    .select('*')
    .eq('type', 'vod')
    .eq('vod_category', categoryId);

  if (error) throw new Error('Failed to load category videos : ' + error.message);

  return (data ?? [])
    .map((item) => normaliseVodVideo(item))
    .filter((item): item is VodVideo => item != null);
};

/* -------------------------
 * CREATE
 * ------------------------- */
export const createVod = async (payload: Partial<VodVideo>) => {
  const { data, error } = await supabase
    .from('class_contents')
    .insert({
      type: 'vod',
      vod_category: payload.categoryId,
      title: payload.title,
      description: payload.description,
      video_url: payload.videoUrl,
      thumbnail_url: payload.thumbnailUrl,
      is_recommended: payload.isRecommended,
      display_order: payload.displayOrder,
    })
    .select();

  if (error) throw new Error('Failed to create VOD : ' + error.message);

  return normaliseVodVideo((data ?? [])[0]);
};

/* -------------------------
 * UPDATE
 * ------------------------- */
export const updateVod = async (
  id: string | number,
  payload: Partial<VodVideo>
) => {
  const { data, error } = await supabase
    .from('class_contents')
    .update({
      vod_category: payload.categoryId,
      title: payload.title,
      description: payload.description,
      video_url: payload.videoUrl,
      thumbnail_url: payload.thumbnailUrl,
      is_recommended: payload.isRecommended,
      display_order: payload.displayOrder,
    })
    .eq('id', id)
    .select();

  if (error) throw new Error('Failed to update VOD : ' + error.message);

  return normaliseVodVideo((data ?? [])[0]);
};

/* -------------------------
 * DELETE
 * ------------------------- */
export const deleteVod = async (id: string | number) => {
  const { error } = await supabase
    .from('class_contents')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Failed to delete VOD : ' + error.message);
};
