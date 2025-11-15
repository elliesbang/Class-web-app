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

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ success: false, message: 'id is required' }), {
      status: 400,
    });
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
