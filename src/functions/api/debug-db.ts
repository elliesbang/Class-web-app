import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

type AdminRow = Record<string, unknown>;

type TablesResult = {
  name: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const metadata = db as unknown as {
      databaseId?: string;
      databaseName?: string;
      database_id?: string;
      database_name?: string;
    };

    const { results: tableRows } = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all<TablesResult>();

    const tables = (tableRows ?? []).map((row) => row.name);

    let adminRow: AdminRow | null = null;

    if (tables.includes('admins')) {
      const { results: adminsResults } = await db.prepare('SELECT * FROM admins LIMIT 1').all<AdminRow>();
      adminRow = adminsResults?.[0] ?? null;
    }

    const databaseName = metadata.databaseName ?? metadata.database_name ?? null;
    const databaseId = metadata.databaseId ?? metadata.database_id ?? null;

    return c.json({
      success: true,
      data: {
        databaseName,
        databaseId,
        database_name: metadata.database_name ?? metadata.databaseName ?? null,
        database_id: metadata.database_id ?? metadata.databaseId ?? null,
        tables,
        adminSample: adminRow,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message });
  }
});

export default app;
