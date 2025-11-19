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

const normaliseVodVideo = (record: Record<string, any> | null): VodVideo | null => {
  if (!record) return null;
  const id = record.id ?? record.videoId;
  const categoryId = record.vod_category ?? record.category_id ?? record.categoryId ?? 'default';
  const title = (record.title ?? record.name ?? '') as string;
  const videoUrl = (record.video_url as string | undefined) ?? (record.videoUrl as string | undefined) ?? '';
  if (!id || !title || !videoUrl) return null;
  return {
    id,
    categoryId,
    title,
    description: (record.description as string | undefined) ?? null,
    videoUrl,
    thumbnailUrl: (record.thumbnail_url as string | undefined) ?? (record.thumbnailUrl as string | undefined) ?? null,
    isRecommended: Boolean(record.is_recommended ?? record.isRecommended ?? false),
    displayOrder: Number(record.display_order ?? record.order ?? 0) || 0,
    createdAt: (record.created_at as string | undefined) ?? new Date().toISOString(),
  };
};

const buildCategories = (videos: VodVideo[]): VodCategory[] => {
  const seen = new Map<string | number, VodCategory>();
  videos.forEach((video, index) => {
    if (seen.has(video.categoryId)) return;
    seen.set(video.categoryId, {
      id: video.categoryId,
      name: String(video.categoryId),
      order: index,
    });
  });
  return Array.from(seen.values());
};

export const getVodList = async (): Promise<VodListResponse> => {
  const { data, error } = await supabase
    .from('classroom_content')
    .select('*')
    .eq('type', 'vod');

  if (error) {
    throw new Error(error.message);
  }

  const videos = (data ?? [])
    .map((item) => normaliseVodVideo(item as Record<string, any>))
    .filter((item): item is VodVideo => item != null);

  return { videos, categories: buildCategories(videos) };
};

export const getVodByCategory = async (categoryId: string | number): Promise<VodVideo[]> => {
  const { data, error } = await supabase
    .from('classroom_content')
    .select('*')
    .eq('type', 'vod')
    .eq('vod_category', categoryId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((item) => normaliseVodVideo(item as Record<string, any>))
    .filter((item): item is VodVideo => item != null);
};

export const createVod = async (payload: Partial<VodVideo>) => {
  const { data, error } = await supabase
    .from('classroom_content')
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

  if (error) throw new Error(error.message);
  return normaliseVodVideo((data ?? [])[0] as Record<string, any>);
};

export const updateVod = async (id: string | number, payload: Partial<VodVideo>) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .update({
      title: payload.title,
      description: payload.description,
      video_url: payload.videoUrl,
      thumbnail_url: payload.thumbnailUrl,
      is_recommended: payload.isRecommended,
      display_order: payload.displayOrder,
      vod_category: payload.categoryId,
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return normaliseVodVideo((data ?? [])[0] as Record<string, any>);
};

export const deleteVod = async (id: string | number) => {
  const { error } = await supabase.from('classroom_content').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
