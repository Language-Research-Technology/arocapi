import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockReset } from 'vitest-mock-extended';

import type { Options } from './app.js';
import app, {
  AllPublicAccessTransformer,
  AllPublicFileAccessTransformer,
  AllVisibleEntityFilter,
  AllVisibleSearchFilter,
} from './app.js';

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
      });

      await expect(() => fastify.ready()).rejects.toThrowError('Prisma client is required');
    });

    it('should handle missing opensearch', async () => {
      const fastify = Fastify({ logger: false });

      // @ts-expect-error we are testing missing options
      fastify.register(app, {
        prisma,
      });

      await expect(() => fastify.ready()).rejects.toThrowError('OpenSearch client is required');
    });

    it('should handle missing accessTransformer', async () => {
      const fastify = Fastify({ logger: false });

      // @ts-expect-error we are testing missing options
      fastify.register(app, {
        prisma,
        opensearch,
      });

      await expect(() => fastify.ready()).rejects.toThrowError('accessTransformer is required');
    });

    it('should handle missing fileAccessTransformer', async () => {
      const fastify = Fastify({ logger: false });

      // @ts-expect-error we are testing missing options
      fastify.register(app, {
        prisma,
        opensearch,
        accessTransformer: AllPublicAccessTransformer,
      });

      await expect(() => fastify.ready()).rejects.toThrowError('fileAccessTransformer is required');
    });

    it('should handle missing fileHandler', async () => {
      const fastify = Fastify({ logger: false });

      // @ts-expect-error we are testing missing options
      fastify.register(app, {
        prisma,
        opensearch,
        accessTransformer: AllPublicAccessTransformer,
        fileAccessTransformer: AllPublicFileAccessTransformer,
      });

      await expect(() => fastify.ready()).rejects.toThrowError('fileHandler is required');
    });

    it('should handle missing roCrateHandler', async () => {
      const fastify = Fastify({ logger: false });

      // @ts-expect-error we are testing missing options
      fastify.register(app, {
        prisma,
        opensearch,
        accessTransformer: AllPublicAccessTransformer,
        fileAccessTransformer: AllPublicFileAccessTransformer,
        fileHandler: {
          get: vi.fn(),
          head: vi.fn(),
        },
      });

      await expect(() => fastify.ready()).rejects.toThrowError('roCrateHandler is required');
    });

    it('should handle missing entityVisibilityFilter', async () => {
      const fastify = Fastify({ logger: false });

      // @ts-expect-error we are testing missing options
      fastify.register(app, {
        prisma,
        opensearch,
        accessTransformer: AllPublicAccessTransformer,
        fileAccessTransformer: AllPublicFileAccessTransformer,
        fileHandler: { get: vi.fn(), head: vi.fn() },
        roCrateHandler: { get: vi.fn(), head: vi.fn() },
      });

      await expect(() => fastify.ready()).rejects.toThrowError('entityVisibilityFilter is required');
    });

    it('should handle missing searchVisibilityFilter', async () => {
      const fastify = Fastify({ logger: false });

      // @ts-expect-error we are testing missing options
      fastify.register(app, {
        prisma,
        opensearch,
        accessTransformer: AllPublicAccessTransformer,
        fileAccessTransformer: AllPublicFileAccessTransformer,
        fileHandler: { get: vi.fn(), head: vi.fn() },
        roCrateHandler: { get: vi.fn(), head: vi.fn() },
        entityVisibilityFilter: AllVisibleEntityFilter,
      });

      await expect(() => fastify.ready()).rejects.toThrowError('searchVisibilityFilter is required');
    });

    const requiredOptions = () => ({
      prisma,
      opensearch,
      accessTransformer: AllPublicAccessTransformer,
      fileAccessTransformer: AllPublicFileAccessTransformer,
      fileHandler: { get: vi.fn(), head: vi.fn() },
      roCrateHandler: { get: vi.fn(), head: vi.fn() },
      entityVisibilityFilter: AllVisibleEntityFilter,
      searchVisibilityFilter: AllVisibleSearchFilter,
    });

    it('should reject the removed hiddenResponse option', async () => {
      const fastify = Fastify({ logger: false });

      fastify.register(app, { ...requiredOptions(), hiddenResponse: 'notFound' } as Options);

      await expect(() => fastify.ready()).rejects.toThrowError(
        'hiddenResponse has been replaced by promptLoginForHidden and isAuthenticated',
      );
    });

    it('should ignore a removed option left undefined', async () => {
      const fastify = Fastify({ logger: false });

      await fastify.register(app, { ...requiredOptions(), hiddenResponse: undefined } as Options);

      await expect(fastify.ready()).resolves.toBeDefined();

      await fastify.close();
    });

    it('should reject promptLoginForHidden without isAuthenticated', async () => {
      const fastify = Fastify({ logger: false });

      fastify.register(app, { ...requiredOptions(), promptLoginForHidden: true });

      await expect(() => fastify.ready()).rejects.toThrowError('promptLoginForHidden requires isAuthenticated');
    });

    it('should register successfully with all required options', async () => {
      const fastify = Fastify({ logger: false });

      await fastify.register(app, {
        prisma,
        opensearch,
        accessTransformer: AllPublicAccessTransformer,
        fileAccessTransformer: AllPublicFileAccessTransformer,
        fileHandler: { get: vi.fn(), head: vi.fn() },
        roCrateHandler: { get: vi.fn(), head: vi.fn() },
        entityVisibilityFilter: AllVisibleEntityFilter,
        searchVisibilityFilter: AllVisibleSearchFilter,
      });

      await expect(fastify.ready()).resolves.toBeDefined();

      await fastify.close();
    });
  });
});
