export default class DB {
  constructor(d1) {
    this.d1 = d1;
  }

  async run(query, params = []) {
    return await this.d1.prepare(query).bind(...params).run();
  }

  async all(query, params = []) {
    return await this.d1.prepare(query).bind(...params).all();
  }

  async first(query, params = []) {
    return await this.d1.prepare(query).bind(...params).first();
  }
}

export const getDB = (env) => {
  if (!env || !env.DB) {
    throw new Error('D1 Database binding(DB)이 설정되지 않았습니다.');
  }
  return env.DB;
};
