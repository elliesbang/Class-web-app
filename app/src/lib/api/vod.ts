import { apiFetch } from './apiClient';

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

const normaliseVodCategory = (input: unknown): VodCategory | null => {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const id = record.id ?? record.categoryId ?? record.category_id;
  const name = record.name ?? record.categoryName ?? record.title;
  const order = typeof record.order_num === 'number' ? record.order_num : Number(record.order ?? 0);
  if (id == null || typeof name !== 'string') return null;
  return { id, name, order: Number.isFinite(order) ? order : 0 };
};

const normaliseVodVideo = (input: unknown): VodVideo | null => {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const id = record.id ?? record.videoId;
  const categoryId = record.categoryId ?? record.category_id ?? 'default';
  const title = (record.title ?? record.name ?? '') as string;
  const videoUrl = (record.videoUrl ?? record.url ?? '') as string;
  if (!id || !title || !videoUrl) return null;
  return {
    id,
    categoryId,
    title,
    description: (record.description as string | undefined) ?? null,
    videoUrl,
    thumbnailUrl: (record.thumbnailUrl as string | undefined) ?? null,
    isRecommended: Boolean(record.isRecommended ?? record.recommended ?? false),
    displayOrder: Number(record.displayOrder ?? record.order ?? 0) || 0,
    createdAt: (record.createdAt as string | undefined) ?? new Date().toISOString(),
  };
};

const normaliseVodList = (payload: unknown): VodListResponse => {
  const source = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const videosSource = Array.isArray(source.videos)
    ? source.videos
    : Array.isArray(source.results)
      ? source.results
      : Array.isArray(source.data)
        ? source.data
        : Array.isArray(payload)
          ? (payload as unknown[])
          : [];
  const categoriesSource = Array.isArray(source.categories)
    ? source.categories
    : Array.isArray((source.meta as { categories?: unknown[] } | undefined)?.categories)
      ? ((source.meta as { categories?: unknown[] }).categories ?? [])
      : [];

  return {
    videos: videosSource.map(normaliseVodVideo).filter((item): item is VodVideo => item != null),
    categories: categoriesSource.map(normaliseVodCategory).filter((item): item is VodCategory => item != null),
  };
};

export const getVodList = async (): Promise<VodListResponse> => {
  const data = await apiFetch<unknown>('/vod/list');
  return normaliseVodList(data);
};

export const getVodByCategory = async (categoryId: string | number): Promise<VodVideo[]> => {
  const data = await apiFetch<unknown>(`/vod?categoryId=${encodeURIComponent(String(categoryId))}`);
  return normaliseVodList(data).videos;
};

export const createVod = async (payload: Partial<VodVideo>) => {
  return apiFetch<VodVideo>('/vod', { method: 'POST', body: JSON.stringify(payload) });
};

export const updateVod = async (id: string | number, payload: Partial<VodVideo>) => {
  return apiFetch<VodVideo>(`/vod/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
};

export const deleteVod = async (id: string | number) => {
  await apiFetch(`/vod/${id}`, { method: 'DELETE', skipJsonParse: true });
};
