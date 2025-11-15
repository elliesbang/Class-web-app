type FetchStudentsOptions = {
  signal?: AbortSignal;
};

export type StudentAccountRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  courseName: string;
  registeredAt: string;
};

export type VodAccountRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  vodAccess: string;
  subscriptionEndsAt: string;
};

type NotionPropertyValue = {
  type?: string;
  id?: string;
  plain_text?: string;
  name?: string;
  email?: string;
  date?: { start?: string | null } | null;
  number?: number | null;
  title?: Array<{ plain_text?: string } | null> | null;
  rich_text?: Array<{ plain_text?: string } | null> | null;
  select?: { name?: string | null } | null;
  status?: { name?: string | null } | null;
  multi_select?: Array<{ name?: string | null } | null> | null;
};

type NotionPage = {
  id?: string;
  properties?: Record<string, NotionPropertyValue | undefined>;
};

type NotionListResponse = {
  results?: NotionPage[];
  data?: NotionPage[];
};

const NOTION_ENDPOINTS = {
  students: '/api/notion/students',
  vodStudents: '/api/notion/vod-students',
} as const;

const extractPlainText = (items?: Array<{ plain_text?: string } | null> | null): string => {
  if (!Array.isArray(items)) {
    return '';
  }

  return items
    .map((item) => {
      if (!item) {
        return '';
      }
      const value = item.plain_text;
      return typeof value === 'string' ? value : '';
    })
    .filter((value) => value.trim().length > 0)
    .join(' ')
    .trim();
};

const extractPropertyValue = (property?: NotionPropertyValue | null): string => {
  if (!property) {
    return '';
  }

  const { type } = property;

  switch (type) {
    case 'title':
      return extractPlainText(property.title);
    case 'rich_text':
      return extractPlainText(property.rich_text);
    case 'email':
      return typeof property.email === 'string' ? property.email : '';
    case 'status':
      return typeof property.status?.name === 'string' ? property.status.name : '';
    case 'select':
      return typeof property.select?.name === 'string' ? property.select.name : '';
    case 'multi_select':
      return Array.isArray(property.multi_select)
        ? property.multi_select
            .map((item) => (typeof item?.name === 'string' ? item.name : ''))
            .filter((value) => value.trim().length > 0)
            .join(', ')
            .trim()
        : '';
    case 'date':
      return typeof property.date?.start === 'string' ? property.date.start : '';
    case 'number':
      return typeof property.number === 'number' && Number.isFinite(property.number)
        ? String(property.number)
        : '';
    default:
      if (typeof property.plain_text === 'string') {
        return property.plain_text;
      }
      if (typeof property.name === 'string') {
        return property.name;
      }
      return '';
  }
};

const selectProperty = (properties: NotionPage['properties'], keys: string[]): string => {
  if (!properties) {
    return '';
  }

  for (const key of keys) {
    const value = extractPropertyValue(properties[key]);
    if (value) {
      return value;
    }
  }

  return '';
};

const normaliseDate = (value: string) => {
  if (!value) {
    return '';
  }

  if (value.length >= 10) {
    return value.slice(0, 10);
  }

  return value;
};

const fetchNotionDataset = async (endpoint: string, { signal }: FetchStudentsOptions = {}): Promise<NotionPage[]> => {
  const response = await fetch(endpoint, { method: 'GET', signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${endpoint}: ${response.status}`);
  }

  const payload = (await response.json()) as NotionListResponse | NotionPage[];

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const adaptStudentRows = (pages: NotionPage[]): StudentAccountRow[] =>
  pages
    .map((page) => {
      const properties = page.properties ?? {};

      const name = selectProperty(properties, ['이름', 'Name', 'name']);
      const email = selectProperty(properties, ['이메일', 'Email', 'email']);
      const status = selectProperty(properties, ['상태', 'Status', 'status']);
      const courseName = selectProperty(properties, ['수강중강의', '수강중 강의', 'Course', 'course']);
      const registeredAt = normaliseDate(
        selectProperty(properties, ['등록일', '가입일', 'Joined At', '등록일자', 'created_at']),
      );

      return {
        id: page.id ?? `${name}-${email}`,
        name,
        email,
        status,
        courseName,
        registeredAt,
      };
    })
    .map((row) => ({
      ...row,
      name: row.name || '이름 미확인',
      email: row.email || '이메일 미확인',
      status: row.status || '상태 미정',
      courseName: row.courseName || '미지정',
      registeredAt: row.registeredAt || '-',
    }));

const adaptVodRows = (pages: NotionPage[]): VodAccountRow[] =>
  pages
    .map((page) => {
      const properties = page.properties ?? {};

      const name = selectProperty(properties, ['이름', 'Name', 'name']);
      const email = selectProperty(properties, ['이메일', 'Email', 'email']);
      const status = selectProperty(properties, ['상태', 'Status', 'status']);
      const vodAccess = selectProperty(properties, ['VOD권한', 'VOD 권한', '권한', 'Access']);
      const subscriptionEndsAt = normaliseDate(
        selectProperty(properties, ['구독정보', '구독 만료일', '구독일', 'Subscription', 'subscription', '만료일']),
      );

      return {
        id: page.id ?? `${name}-${email}`,
        name,
        email,
        status,
        vodAccess,
        subscriptionEndsAt,
      };
    })
    .map((row) => ({
      ...row,
      name: row.name || '이름 미확인',
      email: row.email || '이메일 미확인',
      status: row.status || '상태 미정',
      vodAccess: row.vodAccess || '권한 미부여',
      subscriptionEndsAt: row.subscriptionEndsAt || '-',
    }));

export const getStudents = async (options: FetchStudentsOptions = {}): Promise<StudentAccountRow[]> => {
  const pages = await fetchNotionDataset(NOTION_ENDPOINTS.students, options);
  return adaptStudentRows(pages);
};

export const getVODStudents = async (options: FetchStudentsOptions = {}): Promise<VodAccountRow[]> => {
  const pages = await fetchNotionDataset(NOTION_ENDPOINTS.vodStudents, options);
  return adaptVodRows(pages);
};

