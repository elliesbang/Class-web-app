import app from '../../src/functions/api/class-categories';

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

const handleRequest: PagesHandler<Env> = (context) => app.fetch(context.request, context.env, context);

export const onRequest: PagesHandler<Env> = (context) => handleRequest(context);

export const onRequestGet: PagesHandler<Env> = (context) => handleRequest(context);

export const onRequestPost: PagesHandler<Env> = (context) => handleRequest(context);

export const onRequestPut: PagesHandler<Env> = (context) => handleRequest(context);

export const onRequestDelete: PagesHandler<Env> = (context) => handleRequest(context);

export const onRequestOptions: PagesHandler<Env> = (context) => handleRequest(context);
