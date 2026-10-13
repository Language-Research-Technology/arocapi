import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import arocapi, {
  AllPublicAccessTransformer,
  AllPublicFileAccessTransformer,
  AllVisibleEntityFilter,
  AllVisibleSearchFilter,
  errorHandler,
  notFoundHandler,
} from './app.js';
import { opensearch, prisma } from './test/helpers/fastify.js';

const arocapiOptions = {
  prisma,
  opensearch,
  accessTransformer: AllPublicAccessTransformer,
  fileAccessTransformer: AllPublicFileAccessTransformer,
  fileHandler: { get: vi.fn(), head: vi.fn() },
  roCrateHandler: { get: vi.fn(), head: vi.fn() },
  entityVisibilityFilter: AllVisibleEntityFilter,
  searchVisibilityFilter: AllVisibleSearchFilter,
};

const internalErrorBody = { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
const notFoundBody = { error: { code: 'NOT_FOUND', message: 'The requested resource was not found' } };
const message = 'Something specific went wrong';

const buildConsumer = () => {
  const logs: Record<string, unknown>[] = [];
  const fastify = Fastify({
    logger: {
      level: 'info',
      stream: { write: (line: string) => logs.push(JSON.parse(line) as Record<string, unknown>) },
    },
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  return { fastify, logs };
};

describe('Error handling for consumer routes', () => {
  it('hides unexpected errors behind a generic 500 and logs them', async () => {
    const { fastify, logs } = buildConsumer();
    fastify.get('/boom', async () => {
      throw new Error('db password is hunter2');
    });

    const response = await fastify.inject({ method: 'GET', url: '/boom' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(internalErrorBody);
    expect(
      logs.some((l) => l.level === 50 && (l.err as { message: string }).message === 'db password is hunter2'),
    ).toBe(true);
  });

  it.each([
    [400, 400, { error: { code: 'VALIDATION_ERROR', message } }],
    [401, 401, { error: { code: 'UNAUTHORIZED', message } }],
    [403, 403, { error: { code: 'FORBIDDEN', message } }],
    [404, 404, { error: { code: 'NOT_FOUND', message } }],
    [405, 405, { error: { code: 'VALIDATION_ERROR', message } }],
    [409, 409, { error: { code: 'CONFLICT', message } }],
    [413, 413, { error: { code: 'VALIDATION_ERROR', message } }],
    [416, 416, { error: { code: 'RANGE_NOT_SATISFIABLE', message } }],
    [422, 422, { error: { code: 'VALIDATION_ERROR', message } }],
    [429, 429, { error: { code: 'RATE_LIMIT_EXCEEDED', message } }],
    [503, 500, internalErrorBody],
  ])('answers a thrown %i http error with %i in the spec shape', async (thrown, status, body) => {
    const { fastify } = buildConsumer();
    await fastify.register(sensible);
    fastify.get('/fail', async () => {
      throw fastify.httpErrors.createError(thrown, message);
    });

    const response = await fastify.inject({ method: 'GET', url: '/fail' });

    expect(response.statusCode).toBe(status);
    expect(response.json()).toEqual(body);
  });

  it('keeps headers carried by the error', async () => {
    const { fastify } = buildConsumer();
    await fastify.register(sensible);
    fastify.get('/fail', async () => {
      throw fastify.httpErrors.createError(401, message, { headers: { 'www-authenticate': 'Bearer' } });
    });

    const response = await fastify.inject({ method: 'GET', url: '/fail' });

    expect(response.statusCode).toBe(401);
    expect(response.headers['www-authenticate']).toBe('Bearer');
  });

  it('maps errors that carry only a status', async () => {
    const { fastify } = buildConsumer();
    fastify.get('/fail', async () => {
      throw Object.assign(new Error(message), { status: 403 });
    });

    const response = await fastify.inject({ method: 'GET', url: '/fail' });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: { code: 'FORBIDDEN', message } });
  });

  it('maps a thrown plain object with a status and no message', async () => {
    const { fastify } = buildConsumer();
    fastify.get('/fail', async () => {
      throw { statusCode: 404 };
    });

    const response = await fastify.inject({ method: 'GET', url: '/fail' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: 'NOT_FOUND', message: '' } });
  });

  it.each([null, undefined])('answers a thrown %s with a generic 500', async (thrown) => {
    const { fastify } = buildConsumer();
    fastify.get('/fail', async () => {
      throw thrown;
    });

    const response = await fastify.inject({ method: 'GET', url: '/fail' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(internalErrorBody);
  });

  it('answers Zod validation failures with VALIDATION_ERROR violations', async () => {
    const { fastify } = buildConsumer();
    fastify
      .withTypeProvider<ZodTypeProvider>()
      .get('/things', { schema: { querystring: z.object({ limit: z.coerce.number().int() }) } }, async () => ({}));

    const response = await fastify.inject({ method: 'GET', url: '/things?limit=abc' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request parameters are invalid',
        details: { violations: [{ field: '/limit' }] },
      },
    });
  });

  it('answers unknown routes with NOT_FOUND', async () => {
    const { fastify } = buildConsumer();

    const response = await fastify.inject({ method: 'GET', url: '/nowhere' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(notFoundBody);
  });

  it.each([
    ['without a prefix', undefined, '/entities'],
    ['under a prefix', '/api', '/api/entities'],
  ])('answers arocapi routes registered %s in the spec shape', async (_label, prefix, url) => {
    const { fastify } = buildConsumer();
    await fastify.register(arocapi, { ...arocapiOptions, prefix });

    const invalid = await fastify.inject({ method: 'GET', url: `${url}?limit=abc` });
    const unknown = await fastify.inject({ method: 'GET', url: `${url}/nowhere/else` });

    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().error.code).toBe('VALIDATION_ERROR');
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json().error.code).toBe('NOT_FOUND');
  });

  it('leaves 404s to a prefixed consumer scope that mounts arocapi without its own prefix', async () => {
    const { fastify } = buildConsumer();
    await fastify.register(
      async (api) => {
        api.setNotFoundHandler((_request, reply) => reply.code(404).send({ scope: 'api' }));
        await api.register(arocapi, arocapiOptions);
      },
      { prefix: '/api' },
    );

    const response = await fastify.inject({ method: 'GET', url: '/api/nowhere' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ scope: 'api' });
  });
  it("leaves the consumer's root 404s alone when arocapi is registered with prefix '/'", async () => {
    const fastify = Fastify({ logger: false });
    fastify.setNotFoundHandler((_request, reply) => reply.code(404).send({ scope: 'root' }));
    await fastify.register(arocapi, { ...arocapiOptions, prefix: '/' });

    const response = await fastify.inject({ method: 'GET', url: '/nowhere' });

    expect(response.json()).toEqual({ scope: 'root' });
  });
});

describe('Error handling for arocapi on its own', () => {
  it('answers unknown paths under its prefix with NOT_FOUND', async () => {
    const fastify = Fastify({ logger: false });
    await fastify.register(arocapi, { ...arocapiOptions, prefix: '/api' });

    const response = await fastify.inject({ method: 'GET', url: '/api/nowhere' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(notFoundBody);
  });
});
