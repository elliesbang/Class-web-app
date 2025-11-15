import {
  buildRichText,
  extractPlainText,
  getPropertyValue,
  jsonResponse,
  notionRequest,
} from './_utils.ts';

const errorResponse = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  console.error('[notice] API error:', error);
  return jsonResponse({ success: false, error: message }, 500);
};

const getNotionDatabaseId = (env) => {
  const dbId = env?.DB_NOTICE;
  if (!dbId) {
    throw new Error('Missing Notion database id for notices (env.DB_NOTICE).');
  }
  return dbId;
};

const mapNoticePage = (page) => {
  const properties = page?.properties || {};
  const title = extractPlainText(properties.title?.title || []);
  const content = extractPlainText(properties.content?.rich_text || []);
  const thumbnailValue = getPropertyValue(properties.thumbnailUrl);
  const isVisibleValue = getPropertyValue(properties.isVisible);

  return {
    id: page?.id || '',
    notion_id: page?.id || '',
    title,
    content,
    thumbnailUrl:
      typeof thumbnailValue === 'string'
        ? thumbnailValue
        : Array.isArray(thumbnailValue)
        ? thumbnailValue[0] || ''
        : thumbnailValue || '',
    isVisible: Boolean(isVisibleValue),
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

    const data = results.map(mapNoticePage);
    return jsonResponse({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function onRequestPost(context) {
  try {
    const dbId = getNotionDatabaseId(context.env);
    const body = await context.request.json();
    const { title = '', content = '', thumbnailUrl = '', isVisible = false } = body || {};

    if (!title) {
      return jsonResponse(
        { success: false, error: 'title is required' },
        400
      );
    }

    const properties = {
      title: { title: buildRichText(title) },
      content: { rich_text: buildRichText(content) },
      isVisible: { checkbox: Boolean(isVisible) },
    };

    if (thumbnailUrl) {
      properties.thumbnailUrl = { url: String(thumbnailUrl) };
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

    const data = mapNoticePage(page);
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
