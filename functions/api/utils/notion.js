const NOTION_VERSION = '2022-06-28';

let notionClient = null;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

function buildHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function notionRequest(path, { method = 'POST', body, token }) {
  if (!token) {
    throw new Error('Notion client has not been initialised');
  }

  const response = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
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

const propertyParsers = {
  title: (property) =>
    property.title?.map((item) => item.plain_text).join('').trim() || null,
  rich_text: (property) =>
    property.rich_text?.map((item) => item.plain_text).join('').trim() || null,
  email: (property) => property.email ?? null,
  number: (property) => property.number ?? null,
  checkbox: (property) => property.checkbox ?? false,
  date: (property) =>
    property.date
      ? {
          start: property.date.start ?? null,
          end: property.date.end ?? null,
          timeZone: property.date.time_zone ?? null,
        }
      : null,
  select: (property) => property.select?.name ?? null,
  multi_select: (property) => property.multi_select?.map((item) => item.name) ?? [],
  status: (property) => property.status?.name ?? null,
  relation: (property) => property.relation?.map((item) => item.id) ?? [],
  people: (property) =>
    property.people?.map((person) => ({
      id: person.id,
      name: person.name,
      avatarUrl: person.avatar_url,
      email: person.person?.email ?? null,
    })) ?? [],
  files: (property) =>
    property.files?.map((file) => ({
      name: file.name,
      url: file.type === 'external' ? file.external?.url : file.file?.url,
      expiryTime: file.file?.expiry_time ?? null,
    })) ?? [],
  formula: (property) => {
    if (!property.formula) {
      return null;
    }

    const { formula } = property;
    return formula[formula.type] ?? null;
  },
  rollup: (property) => {
    if (!property.rollup) {
      return null;
    }

    const { rollup } = property;
    if (rollup.type === 'array') {
      return rollup.array?.map((item) => item[rollup.array.property_type]) ?? [];
    }

    return rollup[rollup.type] ?? null;
  },
  url: (property) => property.url ?? null,
  phone_number: (property) => property.phone_number ?? null,
};

function parseProperty(property) {
  if (!property || !property.type) {
    return null;
  }

  const parser = propertyParsers[property.type];
  if (parser) {
    return parser(property);
  }

  return property[property.type] ?? null;
}

function normalisePage(page) {
  const parsedProperties = {};
  const rawProperties = page.properties ?? {};

  for (const [key, value] of Object.entries(rawProperties)) {
    parsedProperties[key] = parseProperty(value);
  }

  return {
    id: page.id,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    archived: page.archived ?? false,
    url: page.url ?? null,
    icon: page.icon ?? null,
    cover: page.cover ?? null,
    properties: parsedProperties,
    rawProperties,
  };
}

export function initNotion(env) {
  if (!env || !env.NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN is not configured');
  }

  if (notionClient && notionClient.token === env.NOTION_TOKEN) {
    return notionClient;
  }

  notionClient = {
    token: env.NOTION_TOKEN,
    async request(path, { method = 'POST', body } = {}) {
      return notionRequest(path, { method, body, token: env.NOTION_TOKEN });
    },
  };

  return notionClient;
}

function ensureClient(env) {
  if (!notionClient) {
    initNotion(env);
  }

  return notionClient;
}

export async function queryDB(databaseId, body = {}, env) {
  const client = ensureClient(env);
  const response = await client.request(`databases/${databaseId}/query`, {
    method: 'POST',
    body,
  });

  return {
    results: response.results?.map((page) => normalisePage(page)) ?? [],
    nextCursor: response.next_cursor ?? null,
    hasMore: response.has_more ?? false,
    raw: response,
  };
}

export async function createPage(databaseId, properties, env) {
  const client = ensureClient(env);
  const body = {
    parent: { database_id: databaseId },
    properties,
  };

  const response = await client.request('pages', {
    method: 'POST',
    body,
  });

  return normalisePage(response);
}

export async function updatePage(pageId, properties, env) {
  const client = ensureClient(env);
  const response = await client.request(`pages/${pageId}`, {
    method: 'PATCH',
    body: { properties },
  });

  return normalisePage(response);
}

export async function querySingle(databaseId, filter, env) {
  const { results } = await queryDB(databaseId, filter ? { filter } : {}, env);
  return results[0] ?? null;
}

export function jsonResponse(payload, status = 200, init = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

export function errorResponse(status = 500, message = 'Internal Server Error') {
  return jsonResponse({ success: false, error: message }, status);
}

export function ensureNotion(env) {
  return ensureClient(env);
}

export function extractPlainText(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object') {
          if ('plain_text' in item) {
            return item.plain_text;
          }

          if ('name' in item) {
            return item.name;
          }

          if ('text' in item && item.text?.content) {
            return item.text.content;
          }
        }

        return typeof item === 'string' ? item : '';
      })
      .join('')
      .trim();
  }

  if (value && typeof value === 'object') {
    if ('plain_text' in value) {
      return value.plain_text;
    }

    if ('name' in value) {
      return value.name;
    }

    if ('text' in value && value.text?.content) {
      return value.text.content;
    }
  }

  return typeof value === 'string' ? value : '';
}

export function buildRichText(value) {
  if (!value) {
    return undefined;
  }

  return {
    rich_text: [
      {
        type: 'text',
        text: { content: String(value).slice(0, 2000) },
      },
    ],
  };
}

export function buildTitle(value) {
  if (!value) {
    return undefined;
  }

  return {
    title: [
      {
        type: 'text',
        text: { content: String(value).slice(0, 2000) },
      },
    ],
  };
}

export function buildSelect(value) {
  if (!value) {
    return undefined;
  }

  return {
    select: {
      name: String(value),
    },
  };
}

export function buildRelation(ids) {
  if (!ids || (Array.isArray(ids) && ids.length === 0)) {
    return undefined;
  }

  const values = Array.isArray(ids) ? ids : [ids];
  return {
    relation: values.filter(Boolean).map((id) => ({ id })),
  };
}

export function cleanProperties(properties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null),
  );
}
