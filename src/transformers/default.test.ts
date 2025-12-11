import { describe, expect, it } from 'vitest';
import type { Entity } from '../generated/prisma/client.js';
import { AllPublicAccessTransformer, baseEntityTransformer } from './default.js';

describe('baseEntityTransformer', () => {
  it('should transform entity to standard entity shape', () => {
    const entity: Entity = {
      id: 1,
      rocrateId: 'http://example.com/entity/123',
      name: 'Test Entity',
      description: 'A test entity description',
      entityType: 'http://pcdm.org/models#Collection',
      fileId: null,
      memberOf: 'http://example.com/parent',
      rootCollection: 'http://example.com/root',
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by-sa/4.0/',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
      rocrate: { '@context': 'test' },
      meta: { test: 'data' },
    };

    const result = baseEntityTransformer(entity);

    expect(result).toEqual({
      id: 'http://example.com/entity/123',
      name: 'Test Entity',
      description: 'A test entity description',
      entityType: 'http://pcdm.org/models#Collection',
      memberOf: 'http://example.com/parent',
      rootCollection: 'http://example.com/root',
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by-sa/4.0/',
    });
  });

  it('should handle null memberOf and rootCollection', () => {
    const entity: Entity = {
      id: 1,
      rocrateId: 'http://example.com/collection',
      name: 'Top Collection',
      description: 'A top-level collection',
      entityType: 'http://pcdm.org/models#Collection',
      fileId: null,
      memberOf: null,
      rootCollection: null,
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      createdAt: new Date(),
      updatedAt: new Date(),
      rocrate: {},
      meta: null,
    };

    const result = baseEntityTransformer(entity);

    expect(result.memberOf).toBeNull();
    expect(result.rootCollection).toBeNull();
  });

  it('should exclude database-specific fields', () => {
    const entity: Entity = {
      id: 1,
      rocrateId: 'http://example.com/entity/456',
      name: 'Test',
      description: 'Test',
      entityType: 'http://pcdm.org/models#Object',
      fileId: null,
      memberOf: null,
      rootCollection: null,
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      createdAt: new Date(),
      updatedAt: new Date(),
      rocrate: { test: 'value' },
      meta: { storage: 'path' },
    };

    const result = baseEntityTransformer(entity);

    // Result should have 'id' (mapped from rocrateId), but not the numeric database id
    expect(result.id).toBe('http://example.com/entity/456');
    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('updatedAt');
    expect(result).not.toHaveProperty('rocrate');
    expect(result).not.toHaveProperty('meta');
    expect(Object.keys(result)).toEqual([
      'id',
      'name',
      'description',
      'entityType',
      'memberOf',
      'rootCollection',
      'metadataLicenseId',
      'contentLicenseId',
    ]);
  });

  it('should handle File entity (MediaObject) with fileId', () => {
    const entity: Entity = {
      id: 1,
      rocrateId: 'http://example.com/file/audio.wav',
      name: 'Audio File',
      description: 'An audio recording',
      entityType: 'http://schema.org/MediaObject',
      fileId: 'http://example.com/files/audio.wav',
      memberOf: 'http://example.com/collection',
      rootCollection: 'http://example.com/collection',
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      createdAt: new Date(),
      updatedAt: new Date(),
      rocrate: {},
      meta: null,
    };

    const result = baseEntityTransformer(entity);

    expect(result).toEqual({
      id: 'http://example.com/file/audio.wav',
      name: 'Audio File',
      description: 'An audio recording',
      entityType: 'http://schema.org/MediaObject',
      fileId: 'http://example.com/files/audio.wav',
      memberOf: 'http://example.com/collection',
      rootCollection: 'http://example.com/collection',
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    });
    expect(result.fileId).toBe('http://example.com/files/audio.wav');
  });
});

describe('AllPublicAccessTransformer', () => {
  it('should grant full access to metadata and content', () => {
    const standardEntity = {
      id: 'http://example.com/entity/123',
      name: 'Test Entity',
      description: 'A test entity',
      entityType: 'http://schema.org/MediaObject',
      memberOf: { id: 'http://example.com/parent', name: 'Parent Entity' },
      rootCollection: { id: 'http://example.com/root', name: 'Root Collection' },
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    };

    const result = AllPublicAccessTransformer(standardEntity);

    expect(result).toEqual({
      ...standardEntity,
      access: {
        metadata: true,
        content: true,
      },
    });
  });

  it('should preserve all standard entity fields', () => {
    const standardEntity = {
      id: 'http://example.com/entity/789',
      name: 'Another Entity',
      description: 'Another description',
      entityType: 'http://schema.org/Person',
      memberOf: null,
      rootCollection: null,
      metadataLicenseId: 'https://creativecommons.org/publicdomain/zero/1.0/',
      contentLicenseId: 'https://creativecommons.org/publicdomain/zero/1.0/',
    };

    const result = AllPublicAccessTransformer(standardEntity);

    expect(result.id).toBe(standardEntity.id);
    expect(result.name).toBe(standardEntity.name);
    expect(result.description).toBe(standardEntity.description);
    expect(result.entityType).toBe(standardEntity.entityType);
    expect(result.memberOf).toBe(standardEntity.memberOf);
    expect(result.rootCollection).toBe(standardEntity.rootCollection);
    expect(result.metadataLicenseId).toBe(standardEntity.metadataLicenseId);
    expect(result.contentLicenseId).toBe(standardEntity.contentLicenseId);
  });

  it('should not add contentAuthorizationUrl for public access', () => {
    const standardEntity = {
      id: 'http://example.com/entity/public',
      name: 'Public Entity',
      description: 'Fully public',
      entityType: 'http://pcdm.org/models#Collection',
      memberOf: null,
      rootCollection: null,
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    };

    const result = AllPublicAccessTransformer(standardEntity);

    expect(result.access.contentAuthorizationUrl).toBeUndefined();
  });
});
