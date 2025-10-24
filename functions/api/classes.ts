import app from '../../src/functions/api/classes';

type Env = {
  DB: D1Database;
};

type PagesContext<Bindings> = {
  request: Request;
  env: Bindings;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

type PagesHandler<Bindings> = (context: PagesContext<Bindings>) => Promise<Response> | Response;

export const onRequest: PagesHandler<Env> = (context) =>
  app.fetch(context.request, context.env, context);

export const onRequestGet: PagesHandler<Env> = (context) => onRequest(context);
