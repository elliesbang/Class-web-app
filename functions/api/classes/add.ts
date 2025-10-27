import { Hono } from "hono";
import { z } from "zod";

import { DB, withBindings } from "../hono-utils";

const addClassSchema = z
  .object({
    classCode: z
      .string({
        required_error: "classCode is required",
        invalid_type_error: "classCode must be a string",
      })
      .transform((value) => value.trim())
      .refine((value) => value.length > 0, {
        message: "classCode cannot be empty",
      }),
    category: z
      .union([z.string(), z.undefined(), z.null()])
      .transform((value) => {
        if (typeof value !== "string") {
          return undefined;
        }

        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }),
  })
  .passthrough();

export const classes = new Hono();

classes.onError((err, c) => {
  console.error('[Classes Add API Error]', err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return c.json({ error: message }, 500);
});

classes.post("/add", async (c) => {
  try {
    const parseResult = addClassSchema.safeParse(await c.req.json());

    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          errors: parseResult.error.flatten(),
        },
        400,
      );
    }

    const body = parseResult.data as Record<string, unknown>;
    const db = c.env.DB;

    await db
      .prepare(
        "INSERT INTO classes (name, uploadOption, uploadTime, uploadDays, uploadPeriod, classTitle, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        body.name as string,
        body.uploadOption,
        body.uploadTime,
        body.uploadDays,
        body.uploadPeriod,
        body.classTitle,
        body.categoryId,
      )
      .run();

    return c.json({ success: true, message: "수업이 정상적으로 추가되었습니다." });
  } catch (err) {
    console.error("❌ 수업 추가 오류:", err);
    return c.json({ error: String(err) }, 500);
  }
});

export const onRequest = withBindings(classes.fetch, { DB });

export default classes;
