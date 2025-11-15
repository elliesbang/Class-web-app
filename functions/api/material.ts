import {
  buildRichText,
  extractPlainText,
  getPropertyValue,
  jsonResponse,
  notionRequest,
} from './_utils.ts';
import { initDB } from '../_utils/index.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const errorResponse = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  console.error('[material] API error:', error);
  return jsonResponse({ success: false, error: message }, 500);
};

const getDb = async (env) => initDB(env);

const listStoredMaterialPageIds = async (db) => {
  const { results } = await db
    .prepare('SELECT notion_page_id FROM material_pages ORDER BY created_at DESC')
    .all();

  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .map((row) => (typeof row?.notion_page_id === 'string' ? row.notion_page_id : ''))
    .filter((value) => value.length > 0);
};

const insertMaterialPage = async (db, pageId, courseId) => {
  const createdAt = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO material_pages (notion_page_id, course_id, created_at)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(notion_page_id) DO UPDATE SET
         course_id = excluded.course_id,
         created_at = excluded.created_at`
    )
    .bind(pageId, courseId || null, createdAt)
    .run();
};

const findMaterialPage = async (db, pageId) =>
  db.prepare('SELECT id, notion_page_id FROM material_pages WHERE notion_page_id = ?1')
    .bind(pageId)
    .first();

const deleteMaterialPage = async (db, internalId) => {
  await db.prepare('DELETE FROM material_pages WHERE id = ?1').bind(internalId).run();
};

const getNotionDatabaseId = (env) => {
  const dbId = env?.DB_MATERIAL;
  if (!dbId) {
    throw new Error('Missing Notion database id for materials (env.DB_MATERIAL).');
  }
  return dbId;
};

const toStringValue = (value) => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
};

const mapMaterialPage = (page) => {
  const properties = page?.properties || {};
  const title = extractPlainText(properties.title?.title || []);
  const description = extractPlainText(properties.description?.rich_text || []);
  const courseValue = getPropertyValue(properties.courseId);
  const fileTypeValue = getPropertyValue(properties.fileType);
  const fileUrlValue = getPropertyValue(properties.fileUrl);
  const linkValue = getPropertyValue(properties.link);

  const fileUrl =
    typeof fileUrlValue === 'string'
      ? fileUrlValue
      : Array.isArray(fileUrlValue)
      ? fileUrlValue[0] || ''
      : toStringValue(fileUrlValue);

  const link =
    typeof linkValue === 'string'
      ? linkValue
      : Array.isArray(linkValue)
      ? linkValue[0] || ''
      : toStringValue(linkValue);

  return {
    id: page?.id || '',
    notion_id: page?.id || '',
    title,
    description,
    fileUrl,
    link,
    fileType: Array.isArray(fileTypeValue)
      ? fileTypeValue[0] || ''
      : toStringValue(fileTypeValue).trim(),
    courseId: Array.isArray(courseValue)
      ? courseValue[0] || ''
      : toStringValue(courseValue).trim(),
    createdAt: page?.created_time || '',
    updatedAt: page?.last_edited_time || '',
  };
};

const getPageIdFromRequest = async (request) => {
  const url = new URL(request.url);
  const searchId = url.searchParams.get('id') || url.searchParams.get('page_id');
  if (searchId) {
    return searchId.trim();
  }

  try {
    const body = await request.clone().json();
    const value = body?.id || body?.pageId || body?.notion_id || null;
    return typeof value === 'string' ? value.trim() : null;
  } catch (error) {
    return null;
  }
};

export async function onRequestGet(context) {
  try {
    const db = await getDb(context.env);
    const storedPageIds = await listStoredMaterialPageIds(db);
    if (storedPageIds.length === 0) {
      return jsonResponse({ success: true, data: [] });
    }
    const idFilter = new Set(storedPageIds);

    const dbId = getNotionDatabaseId(context.env);
    const query = {
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending',
        },
      ],
    };

    const { results = [] } =
      (await notionRequest(
        `databases/${dbId}/query`,
        {
          method: 'POST',
          body: JSON.stringify(query),
        },
        context.env
      )) || {};

    const data = results
      .map(mapMaterialPage)
      .filter((item) => idFilter.size === 0 || idFilter.has(item.notion_id));

    return jsonResponse({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function onRequestPost(context) {
  try {
    const dbId = getNotionDatabaseId(context.env);
    const db = await getDb(context.env);
    const body = await context.request.json();
    const {
      title = '',
      description = '',
      fileUrl = '',
      link = '',
      fileType = '',
      courseId = '',
    } = body || {};

    if (!title) {
      return jsonResponse(
        { success: false, error: 'title is required' },
        400
      );
    }

    if (!fileUrl && !link) {
      return jsonResponse(
        { success: false, error: 'fileUrl or link is required' },
        400
      );
    }

    const properties = {
      title: { title: buildRichText(title) },
      description: { rich_text: buildRichText(description) },
    };

    if (courseId) {
      properties.courseId = { rich_text: buildRichText(courseId) };
    }

    if (fileUrl) {
      properties.fileUrl = { url: String(fileUrl) };
    }

    if (link) {
      properties.link = { url: String(link) };
    }

    if (fileType) {
      properties.fileType = { select: { name: String(fileType) } };
    }

    const page = await notionRequest(
      'pages',
      {
        method: 'POST',
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties,
        }),
      },
      context.env
    );

    const data = mapMaterialPage(page);
    if (UUID_REGEX.test(data.notion_id)) {
      await insertMaterialPage(db, data.notion_id, data.courseId);
    }
    return jsonResponse({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function onRequestDelete(context) {
  try {
    const rawPageId = await getPageIdFromRequest(context.request);

    if (!rawPageId) {
      return jsonResponse({ success: false, message: 'id is required' }, 400);
    }

    const pageId = String(rawPageId).trim();
    if (!UUID_REGEX.test(pageId)) {
      return jsonResponse({ success: false, message: 'Invalid page_id' }, 400);
    }

    const db = await getDb(context.env);
    const storedRow = await findMaterialPage(db, pageId);

    if (!storedRow) {
      return jsonResponse({ success: false, message: 'Material not found' }, 404);
    }

    await notionRequest(
      `pages/${storedRow.notion_page_id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
      },
      context.env
    );

    await deleteMaterialPage(db, storedRow.id);

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
