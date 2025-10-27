import type { PagesFunction } from '@cloudflare/workers-types';

import type { Env } from './_utils';
import { ensureBaseSchema, jsonError, jsonResponse } from './_utils';

type CategoryRow = { id: number | string | null; name: string | null };

type CategoryResult = { name: string | null };

const normaliseCategoryName = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const fetchCategoriesFromTable = async (db: D1Database) => {
  try {
    const { results } = await db
      .prepare("SELECT id, name FROM categories WHERE TRIM(name) <> '' ORDER BY name COLLATE NOCASE")
      .all<CategoryRow>();

    if (!results) {
      return null as const;
    }

    const seen = new Map<string, { id: string; name: string }>();
    for (const row of results) {
      const name = normaliseCategoryName(row.name);
      if (!name) {
        continue;
      }

      const key = name.toLocaleLowerCase('ko');
      if (!seen.has(key)) {
        const rawId = row.id != null ? String(row.id).trim() : '';
        const id = rawId || name;
        seen.set(key, { id, name });
      }
    }

    return Array.from(seen.values());
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/no such table/i.test(message)) {
      return null as const;
    }
    throw error;
  }
};

const fetchCategoriesFromClasses = async (db: D1Database) => {
  const { results } = await db
    .prepare(
      "SELECT DISTINCT TRIM(category) as name FROM classes WHERE category IS NOT NULL AND TRIM(category) <> '' ORDER BY name COLLATE NOCASE",
    )
    .all<CategoryResult>();

  if (!results) {
    return [] as const;
  }

  const seen = new Map<string, { id: string; name: string }>();
  for (const row of results) {
    const name = normaliseCategoryName(row.name);
    if (!name) {
      continue;
    }

    const key = name.toLocaleLowerCase('ko');
    if (!seen.has(key)) {
      seen.set(key, { id: name, name });
    }
  }

  return Array.from(seen.values());
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const db = env.DB;
    if (!db) {
      throw new Error('데이터베이스 연결을 찾을 수 없습니다.');
    }

    await ensureBaseSchema(db);

    const categoriesFromTable = await fetchCategoriesFromTable(db);
    const categories = categoriesFromTable ?? (await fetchCategoriesFromClasses(db));

    return jsonResponse(true, categories);
  } catch (error) {
    return jsonError(error, '카테고리 정보를 불러오는 중 오류가 발생했습니다.');
  }
};

export const onRequest = onRequestGet;
