import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fastify, fastifyAfter, fastifyBefore, prisma } from '../test/helpers/fastify.js';
import type { FileHandler, FileResult } from '../types/fileHandlers.js';
import type { StandardErrorResponse } from '../utils/errors.js';
import fileRoute from './file.js';

vi.mock('node:fs', () => ({
  createReadStream: vi.fn(),
}));

describe('File Route', () => {
  const mockFileHandler: FileHandler = {
    get: vi.fn(),
    head: vi.fn(),
  };

  beforeEach(async () => {
    await fastifyBefore();
    await fastify.register(fileRoute, { fileHandler: mockFileHandler });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fastifyAfter();
  });

  const mockFile = {
    id: 1,
    fileId: 'http://example.com/file/test.wav',
    filename: 'test.wav',
    mediaType: 'audio/wav',
    size: BigInt(1024),
    memberOf: 'http://example.com/collection',
    rootCollection: 'http://example.com/collection',
    contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    meta: { storagePath: '/data/files/test.wav' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /file/:id', () => {
    it('should stream file content successfully', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const mockStream = Readable.from(['test file content']);
      const mockResult: FileResult = {
        type: 'stream',
        stream: mockStream,
        metadata: {
          contentType: 'audio/wav',
          contentLength: 17,
          etag: '"abc123"',
          lastModified: new Date('2025-01-01'),
        },
      };
      vi.mocked(mockFileHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('audio/wav');
      expect(response.headers['content-length']).toBe('17');
      expect(response.headers.etag).toBe('"abc123"');
      expect(response.headers['content-disposition']).toBe('inline; filename="test.wav"');
      expect(response.body).toBe('test file content');

      expect(mockFileHandler.get).toHaveBeenCalledWith(
        mockFile,
        expect.objectContaining({
          request: expect.any(Object),
          fastify: expect.any(Object),
        }),
      );
    });

    it('should handle attachment disposition', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const mockStream = Readable.from(['test']);
      const mockResult: FileResult = {
        type: 'stream',
        stream: mockStream,
        metadata: {
          contentType: 'audio/wav',
          contentLength: 4,
        },
      };
      vi.mocked(mockFileHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}?disposition=attachment`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-disposition']).toBe('attachment; filename="test.wav"');
    });

    it('should use custom filename when provided', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const mockStream = Readable.from(['test']);
      const mockResult: FileResult = {
        type: 'stream',
        stream: mockStream,
        metadata: {
          contentType: 'audio/wav',
          contentLength: 4,
        },
      };
      vi.mocked(mockFileHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}?filename=custom-name.wav`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-disposition']).toBe('inline; filename="custom-name.wav"');
    });

    it('should handle redirect response with noRedirect=false (default)', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const mockResult: FileResult = {
        type: 'redirect',
        url: 'https://storage.example.com/files/test.wav',
      };
      vi.mocked(mockFileHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('https://storage.example.com/files/test.wav');
    });

    it('should handle redirect response with noRedirect=true', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const mockResult: FileResult = {
        type: 'redirect',
        url: 'https://storage.example.com/files/test.wav',
      };
      vi.mocked(mockFileHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}?noRedirect=true`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({ location: 'https://storage.example.com/files/test.wav' });
    });

    it('should handle file path response without nginx X-Accel-Redirect', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const mockStream = Readable.from(['file content']);
      vi.mocked(createReadStream).mockReturnValue(mockStream as never);

      const mockResult: FileResult = {
        type: 'file',
        path: '/data/files/test.wav',
        metadata: {
          contentType: 'audio/wav',
          contentLength: 1024,
        },
      };
      vi.mocked(mockFileHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('audio/wav');
      expect(response.headers['content-length']).toBe('1024');
      expect(response.headers['x-accel-redirect']).toBeUndefined();
      expect(createReadStream).toHaveBeenCalledWith('/data/files/test.wav');
    });

    it('should handle file path response with nginx X-Accel-Redirect', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const mockResult: FileResult = {
        type: 'file',
        path: '/data/files/test.wav',
        accelPath: '/internal/files/test.wav',
        metadata: {
          contentType: 'audio/wav',
          contentLength: 1024,
        },
      };
      vi.mocked(mockFileHandler.get).mockResolvedValue(mockResult);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('audio/wav');
      // Note: Content-Length is '0' because Fastify sends an empty response.
      // In production, nginx will replace this with the actual file size when serving via X-Accel-Redirect
      expect(response.headers['content-length']).toBe('0');
      expect(response.headers['x-accel-redirect']).toBe('/internal/files/test.wav');
      expect(response.body).toBe(''); // Empty body when using X-Accel-Redirect
    });

    it('should return 404 when entity not found', async () => {
      prisma.entity.findFirst.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/nonexistent')}`,
      });
      const body = JSON.parse(response.body) as { error: { code: string; message: string } };

      expect(response.statusCode).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('The requested file was not found');
      expect(mockFileHandler.get).not.toHaveBeenCalled();
    });

    it('should return 500 when database error occurs', async () => {
      prisma.file.findFirst.mockRejectedValue(new Error('Database connection failed'));

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should return 500 when fileHandler throws error', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);
      vi.mocked(mockFileHandler.get).mockRejectedValue(new Error('File not found in storage'));

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should validate ID parameter format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/file/invalid-id',
      });
      const body = JSON.parse(response.body) as StandardErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
    });

    it('should validate disposition parameter', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}?disposition=invalid`,
      });
      const body = JSON.parse(response.body) as StandardErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
    });

    it('should return 404 when get handler returns false', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);
      vi.mocked(mockFileHandler.get).mockResolvedValue(false);

      const response = await fastify.inject({
        method: 'GET',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });
      const body = JSON.parse(response.body) as { error: { code: string; message: string } };

      expect(response.statusCode).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('The requested file could not be retrieved');
    });
  });

  describe('HEAD /file/:id', () => {
    it('should return headers without body using head handler', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const mockMetadata = {
        contentType: 'audio/wav',
        contentLength: 17,
        etag: '"abc123"',
        lastModified: new Date('2025-01-01'),
      };
      vi.mocked(mockFileHandler.head).mockResolvedValue(mockMetadata);

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('audio/wav');
      expect(response.headers['content-length']).toBe('17');
      expect(response.headers.etag).toBe('"abc123"');
      expect(response.body).toBe(''); // No body for HEAD

      expect(mockFileHandler.head).toHaveBeenCalledWith(
        mockFile,
        expect.objectContaining({
          request: expect.any(Object),
          fastify: expect.any(Object),
        }),
      );
    });

    it('should return 404 when file not found', async () => {
      prisma.file.findFirst.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/file/${encodeURIComponent('http://example.com/file/nonexistent')}`,
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(mockFileHandler.get).not.toHaveBeenCalled();
    });

    it('should return 500 when head handler throws error', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);
      vi.mocked(mockFileHandler.head).mockRejectedValue(new Error('Failed to get metadata'));

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should return 404 when head handler returns false', async () => {
      prisma.file.findFirst.mockResolvedValue(mockFile);
      vi.mocked(mockFileHandler.head).mockResolvedValue(false);

      const response = await fastify.inject({
        method: 'HEAD',
        url: `/file/${encodeURIComponent('http://example.com/file/test.wav')}`,
      });
      const body = JSON.parse(response.body) as { error: { code: string; message: string } };

      expect(response.statusCode).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('The requested file metadata was not found');
    });
  });
});
