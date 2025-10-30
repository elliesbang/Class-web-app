import { env } from 'cloudflare:env';
import { D1Database } from '@cloudflare/workers-types';

// Cloudflare D1 DB 연결 설정
export const DB = /** @type {D1Database} */ (env.DB);

// ✅ 예외 처리용 샘플 쿼리 실행 함수
export async function query(sql, ...params) {
  try {
    const result = await DB.prepare(sql).bind(...params).all();
    return result.results || [];
  } catch (err) {
    console.error('DB Query Error:', err.message);
    throw err;
  }
}
