import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fastify, fastifyAfter, fastifyBefore, prisma } from '../test/helpers/fastify.js';
import type { FileResult, RoCrateHandler } from '../types/fileHandlers.js';
import type { StandardErrorResponse } from '../utils/errors.js';
import crateRoute from './crate.js';

vi.mock('node:fs', () => ({
  createReadStream: vi.fn(),
}));

describe('Crate Route', () => {
  const mockRoCrateHandler: RoCrateHandler = {
    get: vi.fn(),
    head: vi.fn(),
  };

  beforeEach(async () => {
    await fastifyBefore();
    await fastify.register(crateRoute, { roCrateHandler: mockRoCrateHandler });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fastifyAfter();
  });

  const mockFileEntity = {
    id: 1,
    rocrateId: 'http://example.com/entity/file.wav',
    name: 'test.wav',
    description: 'A test file',
    entityType: 'http://schema.org/MediaObject',
    fileId: null,
    memberOf: 'http://example.com/collection',
    rootCollection: 'http://example.com/collection',
    metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    createdAt: new Date(),
    updatedAt: new Date(),
    rocrate: {
      '@context': 'https://w3id.org/ro/crate/1.1/context',
      '@graph': [
        {
          '@id': 'ro-crate-metadata.json',
          '@type': 'CreativeWork',
          conformsTo: { '@id': 'https://w3id.org/ro/crate/1.1' },
          about: { '@id': './' },
        },
        {
          '@id': './',
          '@type': 'Dataset',
          name: 'Test RO-Crate',
        },
      ],
    },
    meta: {},
  };

  const mockCollectionEntity = {
    ...mockFileEntity,
    rocrateId: 'http://example.com/collection',
    name: 'Test Collection',
    entityType: 'http://pcdm.org/models#Collection',
    memberOf: null,
    rootCollection: null,
  };

  const mockObjectEntity = {
    ...mockFileEntity,
    rocrateId: 'http://example.com/object',
    name: 'Test Object',
    entityType: 'http://pcdm.org/models#Object',
    memberOf: 'http://example.com/collection',
    rootCollection: 'http://example.com/collection',
  };

  describe('GET /entity/:id/rocrate', () => {
    it('should stream RO-Crate metadata for File entity', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockFileEntity);

      const mockStream = Readable.from(['{"@context": "https://w3id.org/ro/crate/1.1/context"}']);
      const mockResult: FileResult = {
        type: 'stream',
        stream: mockStream,
        metadata: {
          contentType: 'text/plain',
          contentLength: 52,
          etag: '"rocrate123"',
          lastModified: new Date('2025-01-01'),
        },
      };
      vi.mocked(mockRoCrateHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/ld+json');
      expect(response.headers['content-length']).toBe('52');
      expect(response.headers.etag).toBe('"rocrate123"');
      expect(response.body).toBe('{"@context": "https://w3id.org/ro/crate/1.1/context"}');

      expect(mockRoCrateHandler.get).toHaveBeenCalledWith(
        mockFileEntity,
        expect.objectContaining({
          request: expect.any(Object),
          fastify: expect.any(Object),
        }),
      );
    });

    it('should stream RO-Crate metadata for Collection entity', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockCollectionEntity);

      const mockStream = Readable.from(['{"@context": "https://w3id.org/ro/crate/1.1/context"}']);
      const mockResult: FileResult = {
        type: 'stream',
        stream: mockStream,
        metadata: {
          contentType: 'application/json',
          contentLength: 52,
        },
      };
      vi.mocked(mockRoCrateHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/collection')}/rocrate`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/ld+json');
      expect(mockRoCrateHandler.get).toHaveBeenCalledWith(mockCollectionEntity, expect.any(Object));
    });

    it('should stream RO-Crate metadata for Object entity', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockObjectEntity);

      const mockStream = Readable.from(['{"@context": "https://w3id.org/ro/crate/1.1/context"}']);
      const mockResult: FileResult = {
        type: 'stream',
        stream: mockStream,
        metadata: {
          contentType: 'application/ld+json',
          contentLength: 52,
        },
      };
      vi.mocked(mockRoCrateHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/object')}/rocrate`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/ld+json');
      expect(mockRoCrateHandler.get).toHaveBeenCalledWith(mockObjectEntity, expect.any(Object));
    });

    it('should handle redirect response', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockFileEntity);

      const mockResult: FileResult = {
        type: 'redirect',
        url: 'https://storage.example.com/ro-crate-metadata.json',
      };
      vi.mocked(mockRoCrateHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('https://storage.example.com/ro-crate-metadata.json');
    });

    it('should handle file path response without nginx X-Accel-Redirect', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockCollectionEntity);

      const mockStream = Readable.from(['rocrate content']);
      vi.mocked(createReadStream).mockReturnValue(mockStream as never);

      const mockResult: FileResult = {
        type: 'file',
        path: '/data/rocrate/ro-crate-metadata.json',
        metadata: {
          contentType: 'application/ld+json',
          contentLength: 1024,
        },
      };
      vi.mocked(mockRoCrateHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/collection')}/rocrate`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/ld+json');
      expect(response.headers['content-length']).toBe('1024');
      expect(response.headers['x-accel-redirect']).toBeUndefined();
      expect(createReadStream).toHaveBeenCalledWith('/data/rocrate/ro-crate-metadata.json');
    });

    it('should handle file path response with nginx X-Accel-Redirect', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockFileEntity);

      const mockResult: FileResult = {
        type: 'file',
        path: '/data/rocrate/ro-crate-metadata.json',
        accelPath: '/internal/rocrate/ro-crate-metadata.json',
        metadata: {
          contentType: 'application/ld+json',
          contentLength: 2048,
        },
      };
      vi.mocked(mockRoCrateHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/ld+json');
      expect(response.headers['x-accel-redirect']).toBe('/internal/rocrate/ro-crate-metadata.json');
      expect(response.body).toBe('');
    });

    it('should return 404 when entity not found', async () => {
      prisma.entity.findFirst.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/nonexistent')}/rocrate`,
      });
      const body = JSON.parse(response.body) as { error: { code: string; message: string } };

      expect(response.statusCode).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('The requested entity was not found');
      expect(mockRoCrateHandler.get).not.toHaveBeenCalled();
    });

    it('should return 404 when handler returns false', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockFileEntity);
      vi.mocked(mockRoCrateHandler.get).mockResolvedValue(false);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });
      const body = JSON.parse(response.body) as { error: { code: string; message: string } };

      expect(response.statusCode).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('The requested RO-Crate could not be retrieved');
    });

    it('should return 500 when database error occurs', async () => {
      prisma.entity.findFirst.mockRejectedValue(new Error('Database connection failed'));

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should return 500 when roCrateHandler throws error', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockFileEntity);
      vi.mocked(mockRoCrateHandler.get).mockRejectedValue(new Error('RO-Crate error'));

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should validate ID parameter format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/entity/invalid-id/rocrate',
      });
      const body = JSON.parse(response.body) as StandardErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
    });
  });

  describe('HEAD /entity/:id/rocrate', () => {
    it('should return RO-Crate metadata headers for File entity', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockFileEntity);

      const mockMetadata = {
        contentType: 'application/ld+json',
        contentLength: 1024,
        etag: '"rocrate-etag"',
        lastModified: new Date('2025-01-15'),
      };
      vi.mocked(mockRoCrateHandler.head).mockResolvedValue(mockMetadata);

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/ld+json');
      expect(response.headers['content-length']).toBe('1024');
      expect(response.headers.etag).toBe('"rocrate-etag"');
      expect(response.body).toBe('');

      expect(mockRoCrateHandler.head).toHaveBeenCalledWith(
        mockFileEntity,
        expect.objectContaining({
          request: expect.any(Object),
          fastify: expect.any(Object),
        }),
      );
    });

    it('should return RO-Crate metadata headers for Collection entity', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockCollectionEntity);

      const mockMetadata = {
        contentType: 'text/plain',
        contentLength: 512,
      };
      vi.mocked(mockRoCrateHandler.head).mockResolvedValue(mockMetadata);

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/entity/${encodeURIComponent('http://example.com/collection')}/rocrate`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/plain');
      expect(response.headers['content-length']).toBe('512');
      expect(response.body).toBe('');
    });

    it('should return RO-Crate metadata headers for Object entity', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockObjectEntity);

      const mockMetadata = {
        contentType: 'application/json',
        contentLength: 2048,
      };
      vi.mocked(mockRoCrateHandler.head).mockResolvedValue(mockMetadata);

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/entity/${encodeURIComponent('http://example.com/object')}/rocrate`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.headers['content-length']).toBe('2048');
      expect(response.body).toBe('');
    });

    it('should return 404 when entity not found', async () => {
      prisma.entity.findFirst.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/entity/${encodeURIComponent('http://example.com/nonexistent')}/rocrate`,
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(mockRoCrateHandler.head).not.toHaveBeenCalled();
    });

    it('should return 404 when head handler returns false', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockFileEntity);
      vi.mocked(mockRoCrateHandler.head).mockResolvedValue(false);

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });
      const body = JSON.parse(response.body) as { error: { code: string; message: string } };

      expect(response.statusCode).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('The requested RO-Crate metadata was not found');
    });

    it('should return 500 when head handler throws error', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockFileEntity);
      vi.mocked(mockRoCrateHandler.head).mockRejectedValue(new Error('Metadata error'));

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET /entity/:id/rocrate - exhaustiveness check', () => {
    it('should handle unexpected RO-Crate result type', async () => {
      prisma.entity.findFirst.mockResolvedValue(mockFileEntity);

      // Mock an invalid result type to test exhaustiveness check
      const invalidResult = {
        type: 'invalid',
        metadata: { contentType: 'application/ld+json', contentLength: 1024 },
      };
      vi.mocked(mockRoCrateHandler.get).mockResolvedValue(invalidResult as never);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/file.wav')}/rocrate`,
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
