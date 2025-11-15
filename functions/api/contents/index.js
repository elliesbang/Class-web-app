function extractPlainText(items = []) {
  return items.map((item) => item?.plain_text || '').join('');
}

function mapPageToContent(page) {
  const properties = page.properties || {};

  const getText = (prop) => {
    if (!prop) return '';
    if (Array.isArray(prop.rich_text)) {
      return extractPlainText(prop.rich_text);
    }
    if (Array.isArray(prop.title)) {
      return extractPlainText(prop.title);
    }
    if (typeof prop.number === 'number') {
      return String(prop.number);
    }
    if (prop?.select?.name) {
      return prop.select.name;
    }
    if (prop?.url) {
      return prop.url;
    }
    return '';
  };

  const getTitle = (prop) => {
    if (!prop) return '';
    return extractPlainText(prop.title || []);
  };

  return {
    id: page.id,
    class_id: getText(properties.class_id),
    type: getText(properties.type),
    title: getTitle(properties.title),
    description: getText(properties.description),
    file_url: properties.file_url?.url || getText(properties.file_url),
    created_at: page.created_time,
    updated_at: page.last_edited_time,
  };
}

async function notionRequest(path, options = {}, env) {
  const headers = {
    Authorization: `Bearer ${env.NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`https://api.notion.com/v1/${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const classId = url.searchParams.get('class_id');

  const query = {
    sorts: [
      {
        timestamp: 'created_time',
        direction: 'descending',
      },
    ],
  };

  if (classId) {
    query.filter = {
      property: 'class_id',
      rich_text: {
        equals: classId,
      },
    };
  }

  try {
    const { results } = await notionRequest(
      `databases/${context.env.DB_CONTENTS}/query`,
      {
        method: 'POST',
        body: JSON.stringify(query),
      },
      context.env
    );
    const data = results.map(mapPageToContent);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      status: 200,
    });
  } catch (err) {
    console.error('콘텐츠 목록 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
