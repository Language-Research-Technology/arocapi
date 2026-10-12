import { afterEach, describe, expect, it, vi } from 'vitest';

import app, { AllPublicFileAccessTransformer, type Options } from '../app.js';
import { fastify, fastifyAfter, fastifyBefore, opensearch, prisma } from '../test/helpers/fastify.js';
import { AllPublicAccessTransformer } from '../transformers/default.js';
import { OpensearchQueryBuilder, type SearchCapability } from '../utils/queryBuilder.js';

const registerApp = async (options: Partial<Options> = {}) => {
  await fastifyBefore();
  await fastify.register(app, {
    prisma,
    opensearch,
    accessTransformer: AllPublicAccessTransformer,
    fileAccessTransformer: AllPublicFileAccessTransformer,
    fileHandler: { get: vi.fn(), head: vi.fn() },
    roCrateHandler: { get: vi.fn(), head: vi.fn() },
    ...options,
  });
};

const getCapabilities = async () => {
  const response = await fastify.inject({ method: 'GET', url: '/capabilities' });

  return { statusCode: response.statusCode, body: response.json<{ search: SearchCapability }>() };
};

describe('Capabilities Route', () => {
  afterEach(async () => {
    await fastifyAfter();
  });

  describe('GET /capabilities', () => {
    it('should declare the default capabilities', async () => {
      await registerApp();

      const { statusCode, body } = await getCapabilities();

      expect(statusCode).toBe(200);
      expect(body).toMatchSnapshot();
    });

    it('should declare every facet as a filter', async () => {
      await registerApp();

      const { body } = await getCapabilities();

      expect(Object.keys(body.search.filters)).toEqual(expect.arrayContaining(Object.keys(body.search.facets)));
    });

    it('should declare only terms aggregations', async () => {
      await registerApp({
        queryBuilderOptions: {
          aggregations: {
            inLanguage: { terms: { size: 20 } },
            dateCreated: { date_histogram: { field: 'dateCreated', calendar_interval: 'year' } },
          },
        },
      });

      const { body } = await getCapabilities();

      expect(body.search).toEqual({
        filters: { inLanguage: { type: 'string' } },
        facets: { inLanguage: {} },
      });
    });

    it('should use an overridden searchCapabilities', async () => {
      const labelled: SearchCapability = {
        filters: {
          inLanguage: { type: 'string', label: 'Language' },
          dateCreated: { type: 'date', label: 'Date created' },
        },
        facets: { inLanguage: { label: 'Language' } },
      };
      class LabelledQueryBuilder extends OpensearchQueryBuilder {
        searchCapabilities() {
          return labelled;
        }
      }

      await registerApp({ queryBuilderClass: LabelledQueryBuilder });

      const { body } = await getCapabilities();

      expect(body.search).toEqual(labelled);
    });

    it('should not run the access transformer', async () => {
      const accessTransformer = vi.fn(() => {
        throw new Error('Unauthorised');
      });

      await registerApp({ accessTransformer });

      const { statusCode } = await getCapabilities();

      expect(statusCode).toBe(200);
      expect(accessTransformer).not.toHaveBeenCalled();
    });
  });
});
