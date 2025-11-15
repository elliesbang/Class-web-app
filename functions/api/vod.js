import {
  initNotion,
  queryDB,
  jsonResponse,
  errorResponse,
} from './utils/notion.js';

const TITLE_KEYS = ['Title', 'title', 'Name', 'name'];
const CATEGORY_KEYS = ['Category', 'category', '분류'];
const URL_KEYS = ['URL', 'url', 'Link', 'link'];
const DESCRIPTION_KEYS = ['Description', 'description', '설명'];

function findProperty(properties, keys) {
  for (const key of keys) {
    if (key in properties) {
      return properties[key];
    }
  }

  return null;
}

export const onRequest = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return new Response(null, { status: 405 });
  }

  if (!env.DB_VOD_VIDEO) {
    return errorResponse(500, 'VOD 데이터베이스가 설정되지 않았습니다.');
  }

  try {
    initNotion(env);
    const url = new URL(request.url);
    const categoryFilter = url.searchParams.get('category');
    const searchKeyword = url.searchParams.get('q');

    const { results } = await queryDB(env.DB_VOD_VIDEO, {}, env);

    const filtered = results.filter((page) => {
      const properties = page.properties ?? {};
      let matches = true;

      if (categoryFilter) {
        const category = findProperty(properties, CATEGORY_KEYS) || '';
        matches = category.toString().toLowerCase() === categoryFilter.toLowerCase();
      }

      if (matches && searchKeyword) {
        const title = findProperty(properties, TITLE_KEYS) || '';
        const description = findProperty(properties, DESCRIPTION_KEYS) || '';
        const keyword = searchKeyword.toLowerCase();
        matches =
          title.toString().toLowerCase().includes(keyword) ||
          description.toString().toLowerCase().includes(keyword);
      }

      return matches;
    });

    return jsonResponse({
      success: true,
      total: filtered.length,
      items: filtered.map((page) => ({
        id: page.id,
        title: findProperty(page.properties ?? {}, TITLE_KEYS),
        category: findProperty(page.properties ?? {}, CATEGORY_KEYS),
        url: findProperty(page.properties ?? {}, URL_KEYS),
        description: findProperty(page.properties ?? {}, DESCRIPTION_KEYS),
        createdTime: page.createdTime,
        lastEditedTime: page.lastEditedTime,
        properties: page.properties,
      })),
    });
  } catch (error) {
    console.error('[vod] failed', error);
    return errorResponse(500, 'VOD 정보를 불러오는 중 오류가 발생했습니다.');
  }
};
