// ✅ Cloudflare Pages + D1 완전 호환 버전
export default class DB {
  constructor(d1) {
    this.d1 = d1;
  }

  async run(query, params = []) {
    try {
      return await this.d1.prepare(query).bind(...params).run();
    } catch (err) {
      console.error('DB run error:', err);
      throw err;
    }
  }

  async all(query, params = []) {
    try {
      return await this.d1.prepare(query).bind(...params).all();
    } catch (err) {
      console.error('DB all error:', err);
      throw err;
    }
  }

  async first(query, params = []) {
    try {
      return await this.d1.prepare(query).bind(...params).first();
    } catch (err) {
      console.error('DB first error:', err);
      throw err;
    }
  }
}
