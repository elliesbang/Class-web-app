import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

type CreateVideoPayload = {
  title?: string;
  url?: string;
  class_id?: number;
};

type VideoRecord = {
  id: number;
  title: string;
  url: string;
};

const ensureVideosTable = async (db: D1Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      class_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
  try {
    const payload = ((await c.req.json().catch(() => null)) ?? {}) as CreateVideoPayload;
    const { title, url, class_id } = payload;

    if (!title || !url || typeof class_id !== 'number') {
      return c.json(
        { success: false, message: 'title, url, class_id는 필수 값입니다.' },
        400,
      );
    }

    await ensureVideosTable(c.env.DB);

    const result = await c.env.DB.prepare(
      'INSERT INTO videos (title, url, class_id) VALUES (?1, ?2, ?3)',
    )
      .bind(title, url, class_id)
      .run();

    if (!result.success) {
      return c.json(
        { success: false, message: '영상 정보를 저장하는 중 오류가 발생했습니다.' },
        500,
      );
    }

    return c.json({ success: true }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

app.get('/', async (c) => {
  try {
    const classIdParam = c.req.query('class_id');

    if (!classIdParam) {
      return c.json(
        { success: false, message: 'class_id는 필수 쿼리 매개변수입니다.' },
        400,
      );
    }

    const classId = Number(classIdParam);
    if (!Number.isInteger(classId)) {
      return c.json(
        { success: false, message: 'class_id는 정수여야 합니다.' },
        400,
      );
    }

    await ensureVideosTable(c.env.DB);

    const { results } = await c.env.DB
      .prepare('SELECT id, title, url FROM videos WHERE class_id = ?1 ORDER BY created_at DESC, id DESC')
      .bind(classId)
      .all<VideoRecord>();

    return c.json({ success: true, data: results ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

app.delete('/', async (c) => {
  try {
    const idParam = c.req.query('id');

    if (!idParam) {
      return c.json({ success: false, message: 'id는 필수 쿼리 매개변수입니다.' }, 400);
    }

    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      return c.json({ success: false, message: 'id는 정수여야 합니다.' }, 400);
    }

    await ensureVideosTable(c.env.DB);

    const result = await c.env.DB.prepare('DELETE FROM videos WHERE id = ?1').bind(id).run();

    if (!result.success) {
      return c.json({ success: false, message: '영상 삭제 중 오류가 발생했습니다.' }, 500);
    }

    const changes = Number((result.meta as { changes?: number } | undefined)?.changes ?? 0);
    if (changes < 1) {
      return c.json({ success: false, message: '삭제할 영상을 찾을 수 없습니다.' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

type PagesContext<Bindings> = {
  request: Request;
  env: Bindings;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

export const onRequest = (context: PagesContext<Env>) =>
  app.fetch(context.request, context.env, context);
