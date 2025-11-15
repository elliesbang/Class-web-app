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
