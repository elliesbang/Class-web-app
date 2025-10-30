import { env } from 'cloudflare:env';

class DatabaseClient {
  constructor(binding) {
    if (!binding) {
      throw new Error('D1 database binding (env.DB) is required');
    }

    this.binding = binding;
  }

  prepare(query) {
    if (!query) {
      throw new Error('SQL query is required');
    }

    return this.binding.prepare(query);
  }

  resolveStatement(queryOrStatement) {
    if (typeof queryOrStatement === 'string') {
      return this.prepare(queryOrStatement);
    }

    if (queryOrStatement && typeof queryOrStatement.bind === 'function') {
      return queryOrStatement;
    }

    throw new Error('Invalid statement passed to the database client');
  }

  bindParams(statement, params = []) {
    if (!Array.isArray(params)) {
      throw new Error('Parameters must be provided as an array');
    }

    if (params.length > 0) {
      statement.bind(...params);
    }

    return statement;
  }

  run(queryOrStatement, params = []) {
    const statement = this.bindParams(
      this.resolveStatement(queryOrStatement),
      params,
    );

    return statement.run();
  }

  async all(queryOrStatement, params = []) {
    const statement = this.bindParams(
      this.resolveStatement(queryOrStatement),
      params,
    );

    const { results = [] } = await statement.all();
    return results;
  }

  async first(queryOrStatement, params = []) {
    const statement = this.bindParams(
      this.resolveStatement(queryOrStatement),
      params,
    );

    const result = await statement.first();
    return result ?? null;
  }

  async get(queryOrStatement, params = []) {
    return this.first(queryOrStatement, params);
  }
}

export default DatabaseClient;

export function getDB(environment = env) {
  const binding = environment?.DB ?? env?.DB;

  if (!binding) {
    throw new Error('D1 database binding (env.DB) is required');
  }

  return new DatabaseClient(binding);
}

export async function query(sql, ...params) {
  const db = getDB();
  return db.all(sql, params);
}
