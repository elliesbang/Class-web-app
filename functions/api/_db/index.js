import { D1Database } from "@cloudflare/workers-types";

/**
 * Cloudflare D1 Database 연결 헬퍼
 * - 모든 API 파일에서 import { getDB } from "../_db"; 형태로 호출됨
 */
export function getDB(env) {
  if (!env || !env.DB) {
    throw new Error("⚠️ D1 Database binding(DB)이 누락되었습니다.");
  }
  return env.DB;
}
