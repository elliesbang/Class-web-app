import {
  initNotion,
  queryDB,
  createPage,
  jsonResponse,
  errorResponse,
  buildTitle,
  buildRichText,
  cleanProperties,
} from './utils/notion.js';

const TITLE_KEYS = ['Title', 'title', 'Name', 'name'];
const CONTENT_KEYS = ['Content', 'content', '본문'];
const AUTHOR_KEYS = ['Author', 'author', '작성자'];

function findProperty(properties, keys) {
  for (const key of keys) {
    if (key in properties) {
      return properties[key];
    }
  }

  return null;
}

export const onRequest = async ({ request, env }) => {
  if (!env.DB_NOTICE) {
    return errorResponse(500, '공지사항 데이터베이스가 설정되지 않았습니다.');
  }

  try {
    initNotion(env);

    if (request.method === 'GET') {
      const { results } = await queryDB(env.DB_NOTICE, {}, env);
      return jsonResponse({
        success: true,
        total: results.length,
        items: results.map((page) => ({
          id: page.id,
          title: findProperty(page.properties ?? {}, TITLE_KEYS),
          content: findProperty(page.properties ?? {}, CONTENT_KEYS),
          author: findProperty(page.properties ?? {}, AUTHOR_KEYS),
          createdTime: page.createdTime,
          lastEditedTime: page.lastEditedTime,
          properties: page.properties,
        })),
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { role, title, content, author } = body ?? {};

      if (role !== 'admin') {
        return errorResponse(403, '공지 작성 권한이 없습니다.');
      }

      if (!title || !content) {
        return errorResponse(400, '제목과 내용을 모두 입력해주세요.');
      }

      const properties = cleanProperties({
        Title: buildTitle(title),
        Content: buildRichText(content),
        Author: author ? buildRichText(author) : undefined,
        Role: buildRichText(role),
      });

      const page = await createPage(env.DB_NOTICE, properties, env);
      return jsonResponse({ success: true, notice: page });
    }

    return new Response(null, { status: 405 });
  } catch (error) {
    console.error('[notice] failed', error);
    return errorResponse(500, '공지사항 처리 중 오류가 발생했습니다.');
  }
};
