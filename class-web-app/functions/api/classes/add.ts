import { Hono } from "hono";

export const classes = new Hono();

classes.post("/add", async (c) => {
  try {
    const db = c.env.DB;
    const { name, uploadOption, uploadTime, uploadDays, uploadPeriod, classTitle, categoryId, } =
      await c.req.json();

    const db = c.env.DB;

    await db.prepare(
      "INSERT INTO classes (name, uploadOption, uploadTime, uploadDays, uploadPeriod, classTitle, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        name,
        uploadOption,
        uploadTime,
        uploadDays,
        uploadPeriod,
        classTitle,
        categoryId,
      )
      .run();

    return c.json({ success: true, message: "수업이 정상적으로 추가되었습니다." });
  } catch (err) {
    console.error("❌ 수업 추가 오류:", err);
    return c.json({ error: String(err) }, 500);
  }
});

export default classes;
