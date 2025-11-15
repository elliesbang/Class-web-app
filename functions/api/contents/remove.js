import { Client } from '@notionhq/client';

export async function onRequestDelete(context) {
  const notion = new Client({ auth: context.env.NOTION_TOKEN });
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ success: false, message: 'id is required' }), {
      status: 400,
    });
  }

  try {
    await notion.pages.update({
      page_id: id,
      archived: true,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('콘텐츠 삭제 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
