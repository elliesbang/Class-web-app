import {
  buildRichText,
  extractPlainText,
  getPropertyValue,
  jsonResponse,
  notionRequest,
} from './_utils.ts';

const errorResponse = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  console.error('[class-video] API error:', error);
  return jsonResponse({ success: false, error: message }, 500);
};

const getNotionDatabaseId = (env) => {
  const dbId = env?.DB_CLASS_VIDEO;
  if (!dbId) {
    throw new Error('Missing Notion database id for class videos (env.DB_CLASS_VIDEO).');
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

const mapClassVideoPage = (page) => {
  const properties = page?.properties || {};
  const title = extractPlainText(properties.title?.title || []);
  const description = extractPlainText(properties.description?.rich_text || []);
  const videoUrlValue = getPropertyValue(properties.videoUrl);
  const courseValue = getPropertyValue(properties.courseId);
  const orderValue = getPropertyValue(properties.displayOrder);

  return {
    id: page?.id || '',
    notion_id: page?.id || '',
    courseId: Array.isArray(courseValue) ? courseValue[0] || '' : toStringValue(courseValue).trim(),
    title,
    description,
    videoUrl:
      typeof videoUrlValue === 'string'
        ? videoUrlValue
        : Array.isArray(videoUrlValue)
        ? videoUrlValue[0] || ''
        : toStringValue(videoUrlValue),
    displayOrder:
      typeof orderValue === 'number'
        ? orderValue
        : Number.parseInt(toStringValue(orderValue), 10) || 0,
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
          property: 'displayOrder',
          direction: 'ascending',
        },
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

    const data = results.map(mapClassVideoPage);
    return jsonResponse({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function onRequestPost(context) {
  try {
    const dbId = getNotionDatabaseId(context.env);
    const body = await context.request.json();
    const {
      courseId = '',
      title = '',
      description = '',
      videoUrl = '',
      displayOrder = 0,
    } = body || {};

    if (!title || !videoUrl) {
      return jsonResponse(
        { success: false, error: 'title and videoUrl are required' },
        400
      );
    }

    const numericOrder = Number.isFinite(displayOrder)
      ? displayOrder
      : Number.parseInt(String(displayOrder), 10) || 0;

    const properties = {
      title: { title: buildRichText(title) },
      description: { rich_text: buildRichText(description) },
      videoUrl: { url: String(videoUrl) },
      displayOrder: { number: numericOrder },
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

    const data = mapClassVideoPage(page);
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
