import {
  buildRichText,
  extractPlainText,
  getPropertyValue,
  jsonResponse,
  notionRequest,
} from './_utils.ts';

const errorResponse = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  console.error('[classroom-notice] API error:', error);
  return jsonResponse({ success: false, error: message }, 500);
};

const getNotionDatabaseId = (env) => {
  const dbId = env?.DB_CLASS_NOTICE;
  if (!dbId) {
    throw new Error('Missing Notion database id for classroom notices (env.DB_CLASS_NOTICE).');
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

const mapClassroomNoticePage = (page) => {
  const properties = page?.properties || {};
  const title = extractPlainText(properties.title?.title || []);
  const content = extractPlainText(properties.content?.rich_text || []);
  const courseValue = getPropertyValue(properties.courseId);
  const importantValue = getPropertyValue(properties.isImportant);

  return {
    id: page?.id || '',
    notion_id: page?.id || '',
    courseId: Array.isArray(courseValue)
      ? courseValue[0] || ''
      : toStringValue(courseValue).trim(),
    title,
    content,
    isImportant: Boolean(importantValue),
    createdAt: page?.created_time || '',
    updatedAt: page?.last_edited_time || '',
  };
};

const getPageIdFromRequest = async (request) => {
  const url = new URL(request.url);
  const searchId = url.searchParams.get('id') || url.searchParams.get('page_id');
  if (searchId) {
    return searchId;
  }

  try {
    const body = await request.clone().json();
    return body?.id || body?.pageId || body?.notion_id || null;
  } catch (error) {
    return null;
  }
};

export async function onRequestGet(context) {
  try {
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

    const data = results.map(mapClassroomNoticePage);
    return jsonResponse({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function onRequestPost(context) {
  try {
    const dbId = getNotionDatabaseId(context.env);
    const body = await context.request.json();
    const { courseId = '', title = '', content = '', isImportant = false } = body || {};

    if (!title) {
      return jsonResponse(
        { success: false, error: 'title is required' },
        400
      );
    }

    const properties = {
      title: { title: buildRichText(title) },
      content: { rich_text: buildRichText(content) },
      isImportant: { checkbox: Boolean(isImportant) },
    };

    if (courseId) {
      properties.courseId = { rich_text: buildRichText(courseId) };
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

    const data = mapClassroomNoticePage(page);
    return jsonResponse({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function onRequestDelete(context) {
  try {
    const pageId = await getPageIdFromRequest(context.request);

    if (!pageId) {
      return jsonResponse({ success: false, error: 'id is required' }, 400);
    }

    await notionRequest(
      `pages/${pageId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
      },
      context.env
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
