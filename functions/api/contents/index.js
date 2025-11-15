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

function buildRichText(content) {
  if (!content) return [];
  return [
    {
      type: 'text',
      text: { content },
    },
  ];
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

export async function onRequestPost(context) {
  const body = await context.request.json();
  const { class_id, type, title, description, file_url } = body;

  const properties = {
    title: {
      title: buildRichText(title || ''),
    },
    description: {
      rich_text: buildRichText(description || ''),
    },
    class_id: {
      rich_text: buildRichText(class_id || ''),
    },
  };

  if (type) {
    properties.type = { select: { name: type } };
  }

  if (file_url) {
    properties.file_url = { url: file_url };
  }

  try {
    const page = await notionRequest(
      'pages',
      {
        method: 'POST',
        body: JSON.stringify({
          parent: { database_id: context.env.DB_CONTENTS },
          properties,
        }),
      },
      context.env
    );

    const data = {
      id: page.id,
      class_id: class_id || '',
      type: type || '',
      title: title || '',
      description: description || '',
      file_url: file_url || '',
      created_at: page.created_time,
      updated_at: page.last_edited_time,
    };

    return new Response(JSON.stringify({ success: true, data: [data] }), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (err) {
    console.error('콘텐츠 저장 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}

export async function onRequestPut(context) {
  const body = await context.request.json();
  const { id, class_id, type, title, description, file_url } = body;

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: 'id is required' }),
      { status: 400 }
    );
  }

  const properties = {
    title: {
      title: buildRichText(title || ''),
    },
    description: {
      rich_text: buildRichText(description || ''),
    },
    class_id: {
      rich_text: buildRichText(class_id || ''),
    },
  };

  if (type) {
    properties.type = { select: { name: type } };
  } else {
    properties.type = { select: null };
  }

  if (file_url) {
    properties.file_url = { url: file_url };
  } else {
    properties.file_url = { url: null };
  }

  try {
    await notionRequest(
      `pages/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
      },
      context.env
    );

    const page = await notionRequest(`pages/${id}`, { method: 'GET' }, context.env);

    const data = {
      id: page.id,
      class_id: class_id || '',
      type: type || '',
      title: title || '',
      description: description || '',
      file_url: file_url || '',
      created_at: page.created_time,
      updated_at: page.last_edited_time,
    };

    return new Response(JSON.stringify({ success: true, data: [data] }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('콘텐츠 수정 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: 'id is required' }),
      {
        status: 400,
      }
    );
  }

  try {
    await notionRequest(
      `pages/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
      },
      context.env
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('콘텐츠 삭제 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
