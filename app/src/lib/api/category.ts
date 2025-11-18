import { apiFetch, type ApiFetchOptions } from './apiClient';

export type CategoryRecord = { id: number; name: string; parent_id: number | null };

export async function fetchCategories(options: ApiFetchOptions = {}): Promise<CategoryRecord[]> {
  const payload = await apiFetch<unknown>('/class-category', options);
  const raw = Array.isArray(payload) ? payload : Array.isArray((payload as { data?: unknown[] })?.data) ? (payload as { data: unknown[] }).data : [];

  return raw
    .map((item) => item as Partial<CategoryRecord>)
    .filter((item): item is CategoryRecord => item != null && typeof item.id !== 'undefined' && typeof item.name === 'string')
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name),
      parent_id: item.parent_id == null ? null : Number(item.parent_id),
    }));
}
