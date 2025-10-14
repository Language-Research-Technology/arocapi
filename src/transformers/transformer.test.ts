import type { FastifyInstance, FastifyRequest } from 'fastify';
import { describe, expect, it } from 'vitest';
import type { AccessTransformer, EntityTransformer, TransformerContext } from '../types/transformers.js';
import {
  AllPublicAccessTransformer,
  type AuthorisedEntity,
  baseEntityTransformer,
  type StandardEntity,
} from './default.js';

describe('Entity Transformers', () => {
  const mockContext: TransformerContext = {
    request: {} as FastifyRequest,
    fastify: {} as FastifyInstance,
  };

  const mockStandardEntity: StandardEntity = {
    id: 'http://example.com/entity/123',
    name: 'Test Entity',
    description: 'A test entity',
    entityType: 'http://schema.org/Person',
    memberOf: 'http://example.com/collection',
    rootCollection: 'http://example.com/root',
    metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
  };

  const mockAuthorisedEntity: AuthorisedEntity = {
    ...mockStandardEntity,
    access: {
      metadata: true,
      content: true,
    },
  };

  describe('baseEntityTransformer', () => {
    it('should transform raw entity to standard shape', () => {
      const rawEntity = {
        id: 1,
        rocrateId: 'http://example.com/entity/123',
        name: 'Test Entity',
        description: 'A test entity',
        entityType: 'http://schema.org/Person',
        memberOf: 'http://example.com/collection',
        rootCollection: 'http://example.com/root',
        metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        rocrate: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = baseEntityTransformer(rawEntity);

      expect(result).toEqual(mockStandardEntity);
    });
  });

  describe('AllPublicAccessTransformer', () => {
    it('should add full access to standard entity', () => {
      const result = AllPublicAccessTransformer(mockStandardEntity);

      expect(result).toEqual({
        ...mockStandardEntity,
        access: {
          metadata: true,
          content: true,
        },
      });
    });

    it('should grant metadata and content access', () => {
      const result = AllPublicAccessTransformer(mockStandardEntity);

      expect(result.access.metadata).toBe(true);
      expect(result.access.content).toBe(true);
      expect(result.access.contentAuthorizationUrl).toBeUndefined();
    });
  });

  describe('Custom transformers', () => {
    it('should allow custom transformer to add computed fields', () => {
      const customTransformer: EntityTransformer<AuthorisedEntity, { id: string; displayName: string; uri: string }> = (
        entity,
      ) => ({
        id: entity.id,
        displayName: entity.name.toUpperCase(),
        uri: entity.id,
      });

      const result = customTransformer(mockAuthorisedEntity, mockContext);

      expect(result).toEqual({
        id: 'http://example.com/entity/123',
        displayName: 'TEST ENTITY',
        uri: 'http://example.com/entity/123',
      });
    });

    it('should support async transformers for fetching related data', async () => {
      const asyncTransformer: EntityTransformer<
        AuthorisedEntity,
        { id: string; name: string; relatedData: string }
      > = async (entity) => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 1));

        return {
          id: entity.id,
          name: entity.name,
          relatedData: 'fetched-data',
        };
      };

      const result = await asyncTransformer(mockAuthorisedEntity, mockContext);

      expect(result).toEqual({
        id: 'http://example.com/entity/123',
        name: 'Test Entity',
        relatedData: 'fetched-data',
      });
    });

    it('should allow transformer to access context', async () => {
      const contextAwareTransformer: EntityTransformer<
        AuthorisedEntity,
        {
          id: string;
          name: string;
          requestUrl: string;
        }
      > = async (entity, context) => ({
        id: entity.id,
        name: entity.name,
        requestUrl: context.request.url || 'unknown',
      });

      const contextWithUrl: TransformerContext = {
        request: { url: '/test-url' } as FastifyRequest,
        fastify: {} as FastifyInstance,
      };

      const result = await contextAwareTransformer(mockAuthorisedEntity, contextWithUrl);

      expect(result).toEqual({
        id: 'http://example.com/entity/123',
        name: 'Test Entity',
        requestUrl: '/test-url',
      });
    });

    it('should support transformer pipeline', async () => {
      const addDisplayName: EntityTransformer<AuthorisedEntity, AuthorisedEntity & { displayName: string }> = (
        entity,
      ) => ({
        ...entity,
        displayName: `${entity.name} [${entity.entityType.split('/').pop()}]`,
      });

      const addUpperCase: EntityTransformer<
        AuthorisedEntity & { displayName: string },
        AuthorisedEntity & { displayName: string; upperName: string }
      > = (entity) => ({
        ...entity,
        upperName: entity.name.toUpperCase(),
      });

      // Simulate pipeline
      // biome-ignore lint/suspicious/noExplicitAny: fine in tests
      let result: any = mockAuthorisedEntity;
      result = await addDisplayName(result, mockContext);
      result = await addUpperCase(result, mockContext);

      expect(result).toMatchObject({
        id: 'http://example.com/entity/123',
        name: 'Test Entity',
        displayName: 'Test Entity [Person]',
        upperName: 'TEST ENTITY',
      });
    });

    it('should demonstrate full pipeline: base -> access -> custom', async () => {
      const rawEntity = {
        id: 1,
        rocrateId: 'http://example.com/entity/123',
        name: 'Test Entity',
        description: 'A test entity',
        entityType: 'http://schema.org/Person',
        memberOf: 'http://example.com/collection',
        rootCollection: 'http://example.com/root',
        metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        rocrate: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customAccessTransformer: AccessTransformer = (entity) => ({
        ...entity,
        access: {
          metadata: true,
          content: false,
          contentAuthorizationUrl: 'https://example.com/auth',
        },
      });

      const addMetadata: EntityTransformer<AuthorisedEntity, AuthorisedEntity & { processed: boolean }> = (entity) => ({
        ...entity,
        processed: true,
      });

      // Full pipeline
      const standard = baseEntityTransformer(rawEntity);
      const authorised = await customAccessTransformer(standard, mockContext);
      const final = await addMetadata(authorised, mockContext);

      expect(final).toMatchObject({
        id: 'http://example.com/entity/123',
        name: 'Test Entity',
        access: {
          metadata: true,
          content: false,
          contentAuthorizationUrl: 'https://example.com/auth',
        },
        processed: true,
      });
    });
  });
});
