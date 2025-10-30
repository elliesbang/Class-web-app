import { getDB } from "../../_db";

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const ensureStudentsTable = async (db) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      joined_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
};

const normaliseString = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "";
  }
  return "";
};

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function onRequest(context) {
  const { request } = context;

  try {
    const db = getDB(context.env);
    if (!db || typeof db.prepare !== "function") {
      throw new Error("D1 Database binding(DB)이 유효하지 않습니다.");
    }

    await ensureStudentsTable(db);

    if (request.method === "POST") {
      let payload = {};
      try {
        payload = await request.json();
      } catch {
        return jsonResponse(
          { success: false, message: "유효한 JSON 본문이 필요합니다." },
          400,
        );
      }

      const name = normaliseString(payload?.name);
      const email = normaliseString(payload?.email).toLowerCase();

      if (!name || !email) {
        return jsonResponse(
          { success: false, message: "이름과 이메일은 필수입니다." },
          400,
        );
      }

      if (!isValidEmail(email)) {
        return jsonResponse(
          { success: false, message: "올바른 이메일 주소를 입력해주세요." },
          400,
        );
      }

      const existing = await db
        .prepare(
          "SELECT id FROM students WHERE LOWER(email) = ?1 LIMIT 1",
        )
        .bind(email)
        .first();

      if (existing?.id != null) {
        const existingId =
          typeof existing.id === "number"
            ? existing.id
            : Number(existing.id);

        await db
          .prepare(
            `UPDATE students
             SET name = ?1, joined_at = datetime('now', 'localtime')
             WHERE id = ?2`,
          )
          .bind(name, existingId)
          .run();

        return jsonResponse({
          success: true,
          message: "기존 수강생 정보를 업데이트했습니다.",
          data: {
            id: Number.isFinite(existingId) ? existingId : existing.id,
            name,
            email,
          },
        });
      }

      const result = await db
        .prepare(
          `INSERT INTO students (name, email, joined_at)
           VALUES (?1, ?2, datetime('now', 'localtime'))`,
        )
        .bind(name, email)
        .run();

      const insertedIdRaw = result?.meta?.last_row_id;
      const insertedId =
        typeof insertedIdRaw === "number" ? insertedIdRaw : Number(insertedIdRaw);

      return jsonResponse({
        success: true,
        message: "수강생이 정상적으로 등록되었습니다.",
        data: {
          id: Number.isFinite(insertedId) ? insertedId : insertedIdRaw ?? null,
          name,
          email,
        },
      });
    }

    if (request.method === "GET") {
      const { results } = await db
        .prepare(
          "SELECT id, name, email, joined_at FROM students ORDER BY datetime(joined_at) DESC, id DESC",
        )
        .all();

      return jsonResponse({
        success: true,
        count: results?.length ?? 0,
        data: results ?? [],
      });
    }

    return jsonResponse(
      { success: false, message: "허용되지 않은 요청입니다." },
      405,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    return jsonResponse({ success: false, error: message }, 500);
  }
}
