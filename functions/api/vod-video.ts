import {
  buildRichText,
  extractPlainText,
  getPropertyValue,
  jsonResponse,
  notionRequest,
} from './_utils.ts';

const errorResponse = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  console.error('[vod-video] API error:', error);
  return jsonResponse({ success: false, error: message }, 500);
};

const getNotionDatabaseId = (env) => {
  const dbId = env?.DB_VOD_VIDEO;
  if (!dbId) {
    throw new Error('Missing Notion database id for VOD videos (env.DB_VOD_VIDEO).');
  }
  return dbId;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return Boolean(value);
};

const toNumberOrNull = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const stringFromValue = (value) => {
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

const mapVodVideoPage = (page) => {
  const properties = page?.properties || {};
  const title = extractPlainText(properties.title?.title || []);
  const description = extractPlainText(properties.description?.rich_text || []);
  const videoValue = getPropertyValue(properties.videoUrl);
  const thumbnailValue = getPropertyValue(properties.thumbnailUrl);
  const categoryValue = getPropertyValue(properties.categoryId);
  const orderValue = getPropertyValue(properties.displayOrder);
  const recommendValue = getPropertyValue(properties.isRecommended);

  return {
    id: page?.id || '',
    notion_id: page?.id || '',
    title,
    description,
    videoUrl:
      typeof videoValue === 'string'
        ? videoValue
        : Array.isArray(videoValue)
        ? videoValue[0] || ''
        : stringFromValue(videoValue),
    thumbnailUrl:
      typeof thumbnailValue === 'string'
        ? thumbnailValue
        : Array.isArray(thumbnailValue)
        ? thumbnailValue[0] || ''
        : stringFromValue(thumbnailValue),
    categoryId: Array.isArray(categoryValue)
      ? categoryValue[0] || ''
      : stringFromValue(categoryValue).trim(),
    displayOrder:
      typeof orderValue === 'number'
        ? orderValue
        : Number.parseInt(stringFromValue(orderValue), 10) || 0,
    isRecommended: toBoolean(recommendValue),
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

    const data = results.map(mapVodVideoPage);
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
      title = '',
      description = '',
      videoUrl = '',
      thumbnailUrl = '',
      categoryId = '',
      displayOrder = 0,
      isRecommended = false,
    } = body || {};

    if (!title || !videoUrl) {
      return jsonResponse(
        { success: false, error: 'title and videoUrl are required' },
        400
      );
    }

    const properties = {
      title: { title: buildRichText(title) },
      description: { rich_text: buildRichText(description) },
      videoUrl: { url: String(videoUrl) },
      isRecommended: { checkbox: toBoolean(isRecommended) },
    };

    const orderNumber = toNumberOrNull(displayOrder);
    if (orderNumber !== null) {
      properties.displayOrder = { number: orderNumber };
    }

    if (thumbnailUrl) {
      properties.thumbnailUrl = { url: String(thumbnailUrl) };
    }

    if (categoryId) {
      properties.categoryId = { rich_text: buildRichText(categoryId) };
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

    const data = mapVodVideoPage(page);
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
