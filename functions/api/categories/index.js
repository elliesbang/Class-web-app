const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const errorResponse = (error) =>
  new Response(
    JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    },
  );

const normaliseCategoryName = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const fetchRawCategories = async (db) => {
  const result = await db.prepare('SELECT * FROM categories').all();
  return result?.results ?? [];
};

const fetchCategoriesFromTable = async (db) => {
  try {
    const result = await db
      .prepare("SELECT id, name FROM categories WHERE TRIM(name) <> '' ORDER BY name COLLATE NOCASE")
      .all();
    const rows = result?.results ?? [];

    const seen = new Map();
    for (const row of rows) {
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
      return [];
    }
    throw error;
  }
};

const fetchCategoriesFromClasses = async (db) => {
  const result = await db
    .prepare(
      [
        'SELECT DISTINCT TRIM(category) as name',
        'FROM classes',
        "WHERE category IS NOT NULL AND TRIM(category) <> ''",
        'ORDER BY name COLLATE NOCASE',
      ].join(' '),
    )
    .all();
  const rows = result?.results ?? [];

  const seen = new Map();
  for (const row of rows) {
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

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const source = (url.searchParams.get('source') ?? '').toLocaleLowerCase('en');

    if (source === 'raw') {
      const rows = await fetchRawCategories(DB);
      return jsonResponse({ success: true, count: rows.length, data: rows });
    }

    if (source === 'table') {
      const rows = await fetchCategoriesFromTable(DB);
      return jsonResponse({ success: true, count: rows.length, data: rows });
    }

    if (source === 'classes') {
      const rows = await fetchCategoriesFromClasses(DB);
      return jsonResponse({ success: true, count: rows.length, data: rows });
    }

    const [tableCategories, classCategories] = await Promise.all([
      fetchCategoriesFromTable(DB),
      fetchCategoriesFromClasses(DB),
    ]);

    const merged = new Map();

    for (const category of [...tableCategories, ...classCategories]) {
      if (!merged.has(category.id)) {
        merged.set(category.id, category);
      }
    }

    const rows = Array.from(merged.values());

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[categories] Failed to fetch categories', error)
    return errorResponse(error);
  }
};
