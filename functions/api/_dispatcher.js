const routeConfig = {
  admin: [
    { pattern: [], loader: () => import('./admin/dashboard.js') },
    { pattern: ['dashboard'], loader: () => import('./admin/dashboard.js') },
  ],
  assignments: [
    { pattern: [], loader: () => import('./assignments/index.js') },
  ],
  submissions: [
    { pattern: [], loader: () => import('./submissions/index.js') },
    { pattern: ['create'], loader: () => import('./submissions/create.js') },
    { pattern: ['update'], loader: () => import('./submissions/update.js') },
  ],
  feedback: [
    { pattern: [], loader: () => import('./feedback/index.js') },
  ],
  vod: [
    // Placeholder for future VOD API routes
  ],
  students: [
    { pattern: [], loader: () => import('./students/index.js') },
    { pattern: ['contents'], loader: () => import('./students/contents.js') },
  ],
  notifications: [
    { pattern: [], loader: () => import('./notifications/index.js') },
    { pattern: ['delete'], loader: () => import('./notifications/delete.js') },
  ],
  courses: [
    { pattern: [], loader: () => import('./courses/index.js') },
  ],
  classes: [
    { pattern: [], loader: () => import('./classes/index.js') },
    { pattern: ['create'], loader: () => import('./classes/create.js') },
    { pattern: ['update'], loader: () => import('./classes/update.js') },
    { pattern: ['remove'], loader: () => import('./classes/remove.js') },
    { pattern: [':id'], loader: () => import('./classes/[id].js') },
  ],
  categories: [
    { pattern: [], loader: () => import('./categories/index.js') },
    { pattern: ['add'], loader: () => import('./categories/add.js') },
    { pattern: ['delete'], loader: () => import('./categories/delete.js') },
    { pattern: ['update'], loader: () => import('./categories/update.js') },
    { pattern: ['add-class'], loader: () => import('./categories/add-class.js') },
    { pattern: ['delete-class'], loader: () => import('./categories/delete-class.js') },
    { pattern: ['update-class'], loader: () => import('./categories/update-class.js') },
  ],
  contents: [
    { pattern: [], loader: () => import('./contents/index.js') },
    { pattern: ['create'], loader: () => import('./contents/create.js') },
    { pattern: ['update'], loader: () => import('./contents/update.js') },
    { pattern: ['remove'], loader: () => import('./contents/remove.js') },
  ],
  index: [
    { pattern: [], loader: () => import('./index/index.js') },
  ],
  'admin-auth': [
    { pattern: [], loader: () => import('./admin-auth/index.js') },
  ],
  'user-preferences': [
    { pattern: [], loader: () => import('./user-preferences/index.js') },
  ],
};

const trimSlashes = (value) => value.replace(/^\/+|\/+$/g, '');

const matchPattern = (patternSegments, targetSegments) => {
  if (patternSegments.length !== targetSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => {
    if (segment.startsWith(':')) {
      return targetSegments[index]?.length > 0;
    }
    return segment === targetSegments[index];
  });
};

const resolveLoader = (base, segments) => {
  const entries = routeConfig[base];
  if (!entries) {
    return null;
  }

  for (const entry of entries) {
    if (matchPattern(entry.pattern, segments)) {
      return entry.loader;
    }
  }

  return null;
};

const invokeModule = async (module, context) => {
  const method = context.request.method.toUpperCase();
  const pascalMethod = method.charAt(0) + method.slice(1).toLowerCase();

  const candidates = [
    `onRequest${pascalMethod}`,
    `on${pascalMethod}`,
    'onRequest',
  ];

  for (const key of candidates) {
    const handler = module?.[key];
    if (typeof handler === 'function') {
      return handler(context);
    }
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

export const handleRequest = async (context, forcedBase) => {
  try {
    const url = new URL(context.request.url);
    const segments = trimSlashes(url.pathname)
      .split('/')
      .filter(Boolean);

    if (segments[0] === 'api') {
      segments.shift();
    }

    let base = forcedBase ?? segments.shift() ?? '';

    if (forcedBase) {
      if (segments[0] === forcedBase) {
        segments.shift();
      }

      if (base !== forcedBase) {
        base = forcedBase;
      }
    }

    const loader = resolveLoader(base, segments);
    if (!loader) {
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const module = await loader();
    return invokeModule(module, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
