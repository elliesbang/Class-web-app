#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const webAppRoot = path.join(projectRoot, 'class-web-app');
const coursePagesDir = path.join(webAppRoot, 'src', 'pages', 'course');

const TEMPLATE = ({ componentName, courseId, courseName }) => {
  const safeId = JSON.stringify(courseId);
  const safeName = JSON.stringify(courseName);

  return `import ClassroomTabs from '@/components/classroom/ClassroomTabs';

export default function ${componentName}Page() {
  const courseId = ${safeId};
  const courseDisplayName = ${safeName};

  return (
    <div className=\"mx-auto flex max-w-4xl flex-col gap-5 pb-12\">
      <header className=\"rounded-3xl bg-white px-6 py-5 shadow-soft\">
        <h1 className=\"text-xl font-bold text-ellieGray\">{courseDisplayName}</h1>
        <p className=\"mt-2 text-sm leading-relaxed text-ellieGray/70\">
          영상, 자료, 과제, 피드백, 공지를 한 곳에서 확인하세요.
        </p>
      </header>

      <ClassroomTabs courseId={courseId} courseName={courseDisplayName} />
    </div>
  );
}
`;
};

const trimSlashes = (value) => value.replace(/^\/+|\/+$/g, '');

const toPascalCase = (raw) => {
  if (!raw) return 'Course';
  const value = String(raw)
    .replace(/[^\w\d]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

  if (value.length === 0) {
    return 'Course';
  }

  return value.join('');
};

const normaliseCourseId = (record) => {
  const id = record?.id;
  if (typeof id === 'string' && id.trim().length > 0) {
    return trimSlashes(id.trim());
  }

  if (typeof id === 'number' && Number.isFinite(id)) {
    return String(id);
  }

  const code = record?.code;
  if (typeof code === 'string' && code.trim().length > 0) {
    return trimSlashes(code.trim());
  }

  const name = record?.name;
  if (typeof name === 'string' && name.trim().length > 0) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^\w\d]+/g, '-');
  }

  return null;
};

const parseWranglerOutput = (stdout) => {
  if (!stdout) return [];
  try {
    const parsed = JSON.parse(stdout);
    if (Array.isArray(parsed)) {
      const last = parsed.at(-1);
      if (last && typeof last === 'object' && Array.isArray(last.results)) {
        return last.results;
      }
      return parsed;
    }

    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.results)) {
        return parsed.results;
      }
      if (Array.isArray(parsed[0]?.results)) {
        return parsed[0].results;
      }
    }
  } catch (error) {
    console.warn('[generate-course-pages] Failed to parse wrangler output:', error.message);
  }
  return [];
};

const fetchClassesFromD1 = () => {
  const databaseName = process.env.DB_NAME || process.env.DATABASE_NAME || process.env.D1_DATABASE_ID || process.env.D1_DATABASE_NAME;
  if (!databaseName) {
    return [];
  }

  const args = ['wrangler', 'd1', 'execute', databaseName, '--command', 'SELECT id, name, code FROM classes ORDER BY id ASC;', '--json'];
  const result = spawnSync('npx', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    console.warn('[generate-course-pages] Failed to execute wrangler:', result.error.message);
    return [];
  }

  if (result.status !== 0) {
    console.warn('[generate-course-pages] Wrangler command failed:', result.stderr.trim());
    return [];
  }

  return parseWranglerOutput(result.stdout);
};

const parseCoursePageFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const idMatch =
      content.match(/courseId="([^"]+)"/) || content.match(/const\s+courseId\s*=\s*["'`]([^"'`]+)["'`]/);
    const nameMatch =
      content.match(/courseName="([^"]+)"/) || content.match(/const\s+courseDisplayName\s*=\s*["'`]([^"'`]+)["'`]/);

    if (idMatch && nameMatch) {
      return { id: idMatch[1], name: nameMatch[1] };
    }
  } catch (error) {
    console.warn(`[generate-course-pages] Failed to parse ${filePath}:`, error.message);
  }
  return null;
};

const collectFromDirectory = async (baseDir) => {
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const results = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const filePath = path.join(baseDir, entry.name, 'index.tsx');
      try {
        await fs.access(filePath);
      } catch {
        continue;
      }
      const parsed = await parseCoursePageFile(filePath);
      if (parsed) {
        results.push(parsed);
      }
    }
    return results;
  } catch (error) {
    return [];
  }
};

const collectCoursesFromInternalPage = async () => {
  const internalCoursesPath = path.join(webAppRoot, 'src', 'pages', 'InternalCourses.tsx');
  try {
    const content = await fs.readFile(internalCoursesPath, 'utf8');
    const matches = [
      ...content.matchAll(/\{[^}]*name:\s*'([^']+)'[^}]*link:\s*'([^']+)'[^}]*courseId:\s*'([^']+)'[^}]*}/gs),
    ];

    return matches
      .map(([, name, link, courseId]) => ({ name, link, courseId }))
      .filter((entry) => entry.link.startsWith('/courses/'))
      .map((entry) => ({ id: entry.courseId, name: entry.name }));
  } catch (error) {
    return [];
  }
};

const collectFallbackCourses = async () => {
  // Prefer newly generated course pages
  const modernPages = await collectFromDirectory(coursePagesDir);
  if (modernPages.length > 0) {
    return modernPages;
  }

  // Legacy course pages
  const legacyDir = path.join(webAppRoot, 'src', 'pages', 'courses');
  const legacyPages = await collectFromDirectory(legacyDir);
  if (legacyPages.length > 0) {
    return legacyPages;
  }

  const internalCourses = await collectCoursesFromInternalPage();
  if (internalCourses.length > 0) {
    return internalCourses;
  }

  // Fallback to default class list definition
  const defaultClassesPath = path.join(webAppRoot, 'src', 'lib', 'default-classes.ts');
  try {
    const content = await fs.readFile(defaultClassesPath, 'utf8');
    const matches = [...content.matchAll(/\{\s*id:\s*([^,]+),\s*name:\s*'([^']+)'/g)];
    return matches.map(([, rawId, name]) => {
      const trimmed = rawId.trim();
      const numeric = Number(trimmed);
      const id = Number.isFinite(numeric) ? String(numeric) : trimmed.replace(/^['"]|['"]$/g, '');
      return { id, name };
    });
  } catch (error) {
    console.warn('[generate-course-pages] Failed to read default classes:', error.message);
    return [];
  }
};

const ensureDirectory = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const generatePage = async (course) => {
  const courseId = normaliseCourseId(course);
  if (!courseId) {
    console.warn('[generate-course-pages] Skip course due to missing identifier:', course);
    return null;
  }

  const courseName = course.name ?? course.courseName ?? course.title ?? courseId;
  const componentName = toPascalCase(courseId);
  const targetDir = path.join(coursePagesDir, courseId);
  await ensureDirectory(targetDir);
  const filePath = path.join(targetDir, 'index.tsx');
  const fileContent = TEMPLATE({ componentName, courseId, courseName });
  await fs.writeFile(filePath, fileContent, 'utf8');
  return { courseId, filePath };
};

const removeStalePages = async (validIds) => {
  try {
    const entries = await fs.readdir(coursePagesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      if (!validIds.has(slug)) {
        await fs.rm(path.join(coursePagesDir, slug), { recursive: true, force: true });
      }
    }
  } catch {
    // ignore missing directory
  }
};

const main = async () => {
  await ensureDirectory(coursePagesDir);

  let courses = fetchClassesFromD1();
  if (!Array.isArray(courses) || courses.length === 0) {
    courses = await collectFallbackCourses();
  }

  if (!Array.isArray(courses) || courses.length === 0) {
    console.error('[generate-course-pages] No courses found.');
    process.exitCode = 1;
    return;
  }

  const validIds = new Set();
  for (const course of courses) {
    const result = await generatePage(course);
    if (result) {
      validIds.add(result.courseId);
    }
  }

  await removeStalePages(validIds);

  console.log(`[generate-course-pages] Generated ${validIds.size} course page(s).`);
};

main().catch((error) => {
  console.error('[generate-course-pages] Unexpected error:', error);
  process.exitCode = 1;
});
