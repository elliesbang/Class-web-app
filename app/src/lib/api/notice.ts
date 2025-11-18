import { apiFetch } from './apiClient';

export type GlobalNotice = {
  id: number | string;
  title: string;
  content: string;
  thumbnailUrl?: string | null;
  isVisible: boolean;
  createdAt: string;
};

const normaliseNotice = (input: unknown): GlobalNotice | null => {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const id = record.id ?? record.noticeId;
  const title = (record.title ?? record.name ?? '') as string;
  const content = (record.content ?? '') as string;
  if (!id || !title) return null;
  return {
    id,
    title,
    content,
    thumbnailUrl: (record.thumbnailUrl as string | undefined) ?? null,
    isVisible: Boolean(record.isVisible ?? record.visible ?? true),
    createdAt: (record.createdAt as string | undefined) ?? new Date().toISOString(),
  };
};

const normaliseNoticeList = (payload: unknown): GlobalNotice[] => {
  if (Array.isArray(payload)) {
    return payload.map(normaliseNotice).filter((item): item is GlobalNotice => item != null);
  }
  if (payload && typeof payload === 'object') {
    const source = payload as { results?: unknown[]; data?: unknown[] };
    const list = Array.isArray(source.results) ? source.results : Array.isArray(source.data) ? source.data : [];
    return list.map(normaliseNotice).filter((item): item is GlobalNotice => item != null);
  }
  return [];
};

export const getGlobalNotices = async (): Promise<GlobalNotice[]> => {
  const data = await apiFetch<unknown>('/notice/global');
  return normaliseNoticeList(data);
};

export const createGlobalNotice = async (payload: Partial<GlobalNotice>) => {
  return apiFetch<GlobalNotice>('/notice', { method: 'POST', body: JSON.stringify(payload) });
};

export const updateGlobalNotice = async (id: string | number, payload: Partial<GlobalNotice>) => {
  return apiFetch<GlobalNotice>(`/notice/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
};

export const deleteGlobalNotice = async (id: string | number) => {
  await apiFetch(`/notice/${id}`, { method: 'DELETE', skipJsonParse: true });
};
