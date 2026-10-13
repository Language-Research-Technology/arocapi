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
    expect(response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    expect(
      logs.some((l) => l.level === 50 && (l.err as { message: string }).message === 'db password is hunter2'),
    ).toBe(true);
  });

  it.each([
    [400, 'VALIDATION_ERROR'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [405, 'VALIDATION_ERROR'],
    [409, 'CONFLICT'],
    [413, 'VALIDATION_ERROR'],
    [416, 'RANGE_NOT_SATISFIABLE'],
    [422, 'VALIDATION_ERROR'],
    [429, 'RATE_LIMIT_EXCEEDED'],
  ])('answers a thrown %i with code %s and keeps the message', async (status, code) => {
    const { fastify } = buildConsumer();
    await fastify.register(sensible);
    fastify.get('/fail', async () => {
      throw fastify.httpErrors.createError(status, 'Something specific went wrong');
    });

    const response = await fastify.inject({ method: 'GET', url: '/fail' });

    expect(response.statusCode).toBe(status);
    expect(response.json()).toEqual({ error: { code, message: 'Something specific went wrong' } });
  });

  it('answers a thrown 5xx http error with a generic 500', async () => {
    const { fastify } = buildConsumer();
    await fastify.register(sensible);
    fastify.get('/fail', async () => {
      throw fastify.httpErrors.serviceUnavailable('upstream at 10.0.0.5 is down');
    });

    const response = await fastify.inject({ method: 'GET', url: '/fail' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
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
    expect(response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found' } });
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
});

describe('Error handling for arocapi on its own', () => {
  it('answers unknown paths under its prefix with NOT_FOUND', async () => {
    const fastify = Fastify({ logger: false });
    await fastify.register(arocapi, { ...arocapiOptions, prefix: '/api' });

    const response = await fastify.inject({ method: 'GET', url: '/api/nowhere' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found' } });
  });
});
