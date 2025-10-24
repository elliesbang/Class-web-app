import { Hono } from 'hono';
import {
  AppEnv,
  assertClassExists,
  ensureBaseSchema,
  errorResponse,
  handleRoute,
  parseJsonBody,
  parseNumericQuery,
  successResponse,
} from './hono-utils';

type NoticeRow = {
  id: number;
  title: string;
  content: string;
  class_id: number;
  created_at: string;
};

type CreateNoticePayload = {
  title?: string;
  content?: string;
  class_id?: number;
  classId?: number;
};

const app = new Hono<AppEnv>();

app.use('*', async (c, next) => {
  await ensureBaseSchema(c.env.DB);
  await next();
});

app.get('/', (c) =>
  handleRoute(c, async () => {
    const classId = parseNumericQuery(c.req.query('class_id') ?? c.req.query('classId'));

    if (Number.isNaN(classId)) {
      return errorResponse(c, 'class_id 쿼리 파라미터가 필요합니다.', 400);
    }

    const { results } = await c.env.DB
      .prepare(
        'SELECT id, title, content, class_id, created_at FROM notices WHERE class_id = ?1 ORDER BY created_at DESC, id DESC',
      )
      .bind(classId)
      .all<NoticeRow>();

    const notices = results ?? [];
    return successResponse(c, notices, '공지 목록을 조회했습니다.');
  }),
);

app.post('/', (c) =>
  handleRoute(c, async () => {
    const payload = await parseJsonBody<CreateNoticePayload>(c);
    const { title, content, class_id, classId } = payload;
    const resolvedClassId = typeof class_id === 'number' ? class_id : classId;

    if (!title || !content || typeof resolvedClassId !== 'number' || Number.isNaN(resolvedClassId)) {
      return errorResponse(c, 'title, content, class_id는 필수 항목입니다.', 400);
    }

    const classExists = await assertClassExists(c.env.DB, resolvedClassId);
    if (!classExists) {
      return errorResponse(c, '존재하지 않는 class_id 입니다.', 400);
    }

    const { results } = await c.env.DB
      .prepare(
        'INSERT INTO notices (title, content, class_id) VALUES (?1, ?2, ?3) RETURNING id, title, content, class_id, created_at',
      )
      .bind(title, content, resolvedClassId)
      .all<NoticeRow>();

    const [notice] = results ?? [];

    return successResponse(c, notice ?? null, '공지가 등록되었습니다.', 201);
  }),
);

app.delete('/', (c) =>
  handleRoute(c, async () => {
    const id = parseNumericQuery(c.req.query('id'));

    if (Number.isNaN(id)) {
      return errorResponse(c, 'id 쿼리 파라미터가 필요합니다.', 400);
    }

    const result = await c.env.DB.prepare('DELETE FROM notices WHERE id = ?1').bind(id).run();
    const changes = typeof result.meta?.changes === 'number' ? result.meta.changes : 0;

    if (changes === 0) {
      return errorResponse(c, '삭제할 공지가 없습니다.', 404);
    }

    return successResponse(c, { id }, '공지가 삭제되었습니다.');
  }),
);

export default app;
