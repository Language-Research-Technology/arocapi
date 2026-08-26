import { describe, expect, it, vi } from 'vitest';
import type { Entity } from '../generated/prisma/client.js';
import {
  AllPublicAccessTransformer,
  AllPublicFileAccessTransformer,
  baseEntityTransformer,
  baseFileTransformer,
  resolveEntityReferences,
} from './default.js';

describe('baseEntityTransformer', () => {
  it('should transform entity to standard entity shape', () => {
    const entity: Entity & { file?: { id: string } | null } = {
      id: 'http://example.com/entity/123',
      name: 'Test Entity',
      description: 'A test entity description',
      entityType: 'http://pcdm.org/models#Collection',
      memberOf: 'http://example.com/parent',
      rootCollection: 'http://example.com/root',
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by-sa/4.0/',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
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
    const entity: Entity & { file?: { id: string } | null } = {
      id: 'http://example.com/collection',
      name: 'Top Collection',
      description: 'A top-level collection',
      entityType: 'http://pcdm.org/models#Collection',
      memberOf: null,
      rootCollection: null,
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      createdAt: new Date(),
      updatedAt: new Date(),
      meta: null,
    };

    const result = baseEntityTransformer(entity);

    expect(result.memberOf).toBeNull();
    expect(result.rootCollection).toBeNull();
  });

  it('should exclude database-specific fields', () => {
    const entity: Entity & { file?: { id: string } | null } = {
      id: 'http://example.com/entity/456',
      name: 'Test',
      description: 'Test',
      entityType: 'http://pcdm.org/models#Object',
      memberOf: null,
      rootCollection: null,
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      createdAt: new Date(),
      updatedAt: new Date(),
      meta: { storage: 'path' },
    };

    const result = baseEntityTransformer(entity);

    expect(result.id).toBe('http://example.com/entity/456');
    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('updatedAt');
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

  it('should handle File entity (MediaObject) with file relation', () => {
    const entity: Entity & { file?: { id: string } | null } = {
      id: 'http://example.com/file/audio.wav',
      name: 'Audio File',
      description: 'An audio recording',
      entityType: 'http://schema.org/MediaObject',
      memberOf: 'http://example.com/collection',
      rootCollection: 'http://example.com/collection',
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      createdAt: new Date(),
      updatedAt: new Date(),
      meta: null,
      file: { id: 'http://example.com/files/audio.wav' },
    };

    const result = baseEntityTransformer(entity);

    expect(result).toEqual({
      id: 'http://example.com/file/audio.wav',
      name: 'Audio File',
      description: 'An audio recording',
      entityType: 'http://schema.org/MediaObject',
      memberOf: 'http://example.com/collection',
      rootCollection: 'http://example.com/collection',
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    });
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

describe('baseFileTransformer', () => {
  it('should transform a raw file to a standard file shape', () => {
    const file = {
      id: 'http://example.com/file/123',
      filename: 'example.txt',
      mediaType: 'text/plain',
      size: 1024n,
    };

    expect(baseFileTransformer(file as any)).toEqual({
      id: 'http://example.com/file/123',
      filename: 'example.txt',
      mediaType: 'text/plain',
      size: 1024,
    });
  });
});

describe('AllPublicFileAccessTransformer', () => {
  it('should grant public content access for a file entity', () => {
    const file = {
      id: 'http://example.com/file/123',
      filename: 'example.txt',
      mediaType: 'text/plain',
      size: 1024,
      entityType: 'http://schema.org/MediaObject',
      name: 'Example file',
      description: 'A sample file',
      memberOf: null,
      rootCollection: null,
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    };

    expect(AllPublicFileAccessTransformer(file as any)).toEqual({
      ...file,
      access: {
        content: true,
      },
    });
  });
});

describe('resolveEntityReferences', () => {
  it('should return an empty map when there are no referenced entities', async () => {
    const prisma = {
      entity: {
        findMany: vi.fn(),
      },
    } as any;

    const result = await resolveEntityReferences([{ memberOf: null, rootCollection: null }], prisma);

    expect(result).toEqual(new Map());
    expect(prisma.entity.findMany).not.toHaveBeenCalled();
  });

  it('should resolve referenced parent and root collection names in one query', async () => {
    const prisma = {
      entity: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'http://example.com/parent', name: 'Parent Entity' },
          { id: 'http://example.com/root', name: 'Root Collection' },
        ]),
      },
    } as any;

    const result = await resolveEntityReferences(
      [
        { memberOf: 'http://example.com/parent', rootCollection: null },
        { memberOf: null, rootCollection: 'http://example.com/root' },
      ],
      prisma,
    );

    expect(prisma.entity.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['http://example.com/parent', 'http://example.com/root'] } },
      select: { id: true, name: true },
    });
    expect(result).toEqual(
      new Map([
        ['http://example.com/parent', { id: 'http://example.com/parent', name: 'Parent Entity' }],
        ['http://example.com/root', { id: 'http://example.com/root', name: 'Root Collection' }],
      ]),
    );
  });
});
