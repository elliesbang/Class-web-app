const DEFAULT_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

export function extractPlainText(items = []) {
  if (!Array.isArray(items)) return '';
  return items
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      if (typeof item.plain_text === 'string') return item.plain_text;
      if (typeof item.text?.content === 'string') return item.text.content;
      return '';
    })
    .join('');
}

function getFilesUrl(files = []) {
  if (!Array.isArray(files) || files.length === 0) {
    return '';
  }

  const file = files[0];
  if (!file) return '';

  if (file.type === 'external') {
    return file.external?.url || '';
  }

  if (file.type === 'file') {
    return file.file?.url || '';
  }

  return '';
}

export function buildRichText(content) {
  if (!content) return [];
  return [
    {
      type: 'text',
      text: { content: String(content) },
    },
  ];
}

export function mapPageToContent(page) {
  const properties = page?.properties || {};

  const getValue = (key) => getPropertyValue(properties[key]);

  return {
    id: page?.id || '',
    notion_id: page?.id || '',
    title: getValue('title') || '',
    description: getValue('description') || '',
    file_url: getValue('file_url') || '',
    created_at: page?.created_time || '',
    updated_at: page?.last_edited_time || '',
    class_id: getValue('class_id') || '',
    type: getValue('type') || '',
  };
}

export function getPropertyValue(property) {
  if (!property || typeof property !== 'object') {
    return '';
  }

  const { type } = property;

  switch (type) {
    case 'title':
      return extractPlainText(property.title || []);
    case 'rich_text':
      return extractPlainText(property.rich_text || []);
    case 'number':
      return property.number ?? null;
    case 'url':
      return property.url || '';
    case 'checkbox':
      return Boolean(property.checkbox);
    case 'select':
      return property.select?.name || '';
    case 'multi_select':
      return Array.isArray(property.multi_select)
        ? property.multi_select.map((item) => item?.name || '').filter(Boolean)
        : [];
    case 'files':
      return getFilesUrl(property.files || []);
    case 'date':
      return property.date?.start || '';
    case 'relation':
      return Array.isArray(property.relation)
        ? property.relation.map((item) => item?.id || '').filter(Boolean)
        : [];
    case 'status':
      return property.status?.name || '';
    case 'people':
      return Array.isArray(property.people)
        ? property.people.map((person) => person?.id || '').filter(Boolean)
        : [];
    default:
      if (type && property[type] !== undefined) {
        return property[type];
      }
      return '';
  }
}

export async function notionRequest(path, options = {}, env) {
  const headers = {
    Authorization: `Bearer ${env.NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    ...DEFAULT_HEADERS,
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

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: DEFAULT_HEADERS,
  });
}
