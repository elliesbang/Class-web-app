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
