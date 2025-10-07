import Fastify from 'fastify';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockReset } from 'vitest-mock-extended';

import app from './app.js';

import { opensearch, prisma } from './test/helpers/fastify.js';

describe('Entity Route', () => {
  beforeEach(() => {
    mockReset(prisma);
    mockReset(opensearch);
  });

  describe('App Registration', () => {
    it('should handle missing prisma', async () => {
      const fastify = Fastify({ logger: false });

      // @ts-expect-error we are testing missing options
      fastify.register(app, {
        opensearch,
        disableCors: false,
      });

      await expect(() => fastify.ready()).rejects.toThrowError('Prisma client is required');
    });

    it('should handle missing opensearch', async () => {
      const fastify = Fastify({ logger: false });

      // @ts-expect-error we are testing missing options
      fastify.register(app, {
        prisma,
        disableCors: false,
      });

      await expect(() => fastify.ready()).rejects.toThrowError('OpenSearch client is required');
    });

    it('should handle broken opensearch', async () => {
      opensearch.ping.mockRejectedValue(new Error('Connection failed'));

      const fastify = Fastify({ logger: false });

      fastify.register(app, {
        prisma,
        opensearch,
        disableCors: false,
      });

      await expect(() => fastify.ready()).rejects.toThrowError('Connection failed');
    });

    it('should handle random errors', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(app, {
        prisma,
        opensearch,
        disableCors: false,
      });
      fastify.get('/error', async () => {
        throw new Error('Random');
      });

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/error',
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(body).toMatchSnapshot();
    });
  });
});
