// 🔄 Force Cloudflare Functions redeploy - 2025-10-29
import { ensureBaseSchema } from "../../_utils/index.js";
import { jsonResponse, errorResponse } from "../../utils.js";
import { getDB } from "../../_db.js";

/**
 * 코스 코드 검증 API
 * POST /api/courses
 * body: { courseId: string|number, code: string }
 */
export async function onRequestPost(context) {
  try {
    const DB = getDB(context.env);
    await ensureBaseSchema(DB);

    // 🔹 요청 JSON 파싱
    let payload = {};
    try {
      payload = await context.request.json();
    } catch {
      return jsonResponse(
        { success: false, message: "유효한 JSON 본문이 필요합니다." },
        400
      );
    }

    const courseIdRaw = normaliseCourseId(payload.courseId);
    const codeRaw = normaliseCourseId(payload.code);

    if (!courseIdRaw || !codeRaw) {
      return jsonResponse(
        { success: false, message: "강의 ID와 수강 코드를 모두 입력해주세요." },
        400
      );
    }

    const courseIdLower = courseIdRaw.toLowerCase();
    const numericId = Number(courseIdRaw);

    // 🔹 1단계: 숫자형 ID로 검색
    let course = null;
    if (!Number.isNaN(numericId)) {
      const result = await DB.prepare(
        "SELECT id, name, code, category FROM classes WHERE id = ?1"
      )
        .bind(numericId)
        .all();

      course = result?.results?.[0] ?? null;
    }

    // 🔹 2단계: 이름 또는 카테고리로 검색
    if (!course) {
      const result = await DB.prepare(
        "SELECT id, name, code, category FROM classes WHERE LOWER(name) = ?1 OR LOWER(category) = ?1"
      )
        .bind(courseIdLower)
        .all();

      course = result?.results?.[0] ?? null;
    }

    // 🔹 3단계: 존재하지 않으면 에러
    if (!course) {
      return jsonResponse(
        { success: false, message: "등록되지 않은 강의입니다." },
        404
      );
    }

    // 🔹 4단계: 코드 비교
    const storedCode = (course.code || "").trim();
    if (!storedCode) {
      return jsonResponse({
        success: false,
        data: [
          {
            valid: false,
            courseId: resolveCourseIdentifier(course),
            message: "강의 코드가 등록되지 않았습니다.",
          },
        ],
      });
    }

    const inputCode = codeRaw.trim();
    const isValid =
      storedCode.localeCompare(inputCode, undefined, {
        sensitivity: "accent",
      }) === 0;

    if (!isValid) {
      return jsonResponse({
        success: false,
        data: [
          {
            valid: false,
            courseId: resolveCourseIdentifier(course),
            message: "유효하지 않은 코드입니다.",
          },
        ],
      });
    }

    // 🔹 성공
    return jsonResponse({
      success: true,
      data: [
        {
          valid: true,
          matched: true,
          courseId: resolveCourseIdentifier(course),
        },
      ],
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/* -------------------------------------------------------------------------- */
/* ✅ 헬퍼 함수들 */
/* -------------------------------------------------------------------------- */

function normaliseCourseId(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function resolveCourseIdentifier(row) {
  const identifier = [row.category, row.name]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .find((v) => v.length > 0);

  return identifier ?? String(row.id);
}
