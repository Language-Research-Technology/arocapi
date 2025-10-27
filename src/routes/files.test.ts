import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FileAccessTransformer, FileTransformer } from '../app.js';
import { fastify, fastifyAfter, fastifyBefore, prisma } from '../test/helpers/fastify.js';
import { AllPublicFileAccessTransformer } from '../transformers/default.js';
import type { StandardErrorResponse } from '../utils/errors.js';
import filesRoute from './files.js';

describe('Files Route', () => {
  beforeEach(async () => {
    await fastifyBefore();
    await fastify.register(filesRoute, { fileAccessTransformer: AllPublicFileAccessTransformer });
  });

  afterEach(async () => {
    await fastifyAfter();
  });

  const mockFile1 = {
    id: 1,
    fileId: 'http://example.com/file1.wav',
    filename: 'file1.wav',
    mediaType: 'audio/wav',
    size: BigInt(1024),
    memberOf: 'http://example.com/collection/1',
    rootCollection: 'http://example.com/collection/1',
    contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    meta: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockFile2 = {
    id: 2,
    fileId: 'http://example.com/file2.txt',
    filename: 'file2.txt',
    mediaType: 'text/plain',
    size: BigInt(512),
    memberOf: 'http://example.com/collection/1',
    rootCollection: 'http://example.com/collection/1',
    contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
    meta: {},
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  };

  describe('GET /files', () => {
    it('should list all files successfully', async () => {
      prisma.file.findMany.mockResolvedValue([mockFile1, mockFile2]);
      prisma.file.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: '/files',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { total: number; files: unknown[] };
      expect(body.total).toBe(2);
      expect(body.files).toHaveLength(2);
      expect(body.files[0]).toMatchObject({
        id: 'http://example.com/file1.wav',
        filename: 'file1.wav',
        mediaType: 'audio/wav',
        size: 1024,
        memberOf: 'http://example.com/collection/1',
        rootCollection: 'http://example.com/collection/1',
        contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        access: {
          content: true,
        },
      });
      expect(body.files[0]).not.toHaveProperty('metadataLicenseId');
    });

    it('should filter files by memberOf', async () => {
      prisma.file.findMany.mockResolvedValue([mockFile1]);
      prisma.file.count.mockResolvedValue(1);

      const response = await fastify.inject({
        method: 'GET',
        url: '/files?memberOf=http://example.com/collection/1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { total: number };
      expect(body.total).toBe(1);
      expect(prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { memberOf: 'http://example.com/collection/1' },
        }),
      );
    });

    it('should support pagination with limit and offset', async () => {
      prisma.file.findMany.mockResolvedValue([mockFile2]);
      prisma.file.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: '/files?limit=1&offset=1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { total: number; files: unknown[] };
      expect(body.total).toBe(2);
      expect(body.files).toHaveLength(1);
      expect(prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          take: 1,
        }),
      );
    });

    it('should support sorting by filename ascending', async () => {
      prisma.file.findMany.mockResolvedValue([mockFile1, mockFile2]);
      prisma.file.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: '/files?sort=filename&order=asc',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { filename: 'asc' },
        }),
      );
    });

    it('should support sorting by id (maps to fileId)', async () => {
      prisma.file.findMany.mockResolvedValue([mockFile1, mockFile2]);
      prisma.file.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: '/files?sort=id&order=desc',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { fileId: 'desc' },
        }),
      );
    });

    it('should return empty list when no files found', async () => {
      prisma.file.findMany.mockResolvedValue([]);
      prisma.file.count.mockResolvedValue(0);

      const response = await fastify.inject({
        method: 'GET',
        url: '/files',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { total: number; files: unknown[] };
      expect(body.total).toBe(0);
      expect(body.files).toHaveLength(0);
    });

    it('should not include metadataLicenseId in response', async () => {
      prisma.file.findMany.mockResolvedValue([mockFile1]);
      prisma.file.count.mockResolvedValue(1);

      const response = await fastify.inject({
        method: 'GET',
        url: '/files',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { files: Array<{ memberOf: string }> };
      expect(body.files[0]).toMatchObject({
        id: 'http://example.com/file1.wav',
        filename: 'file1.wav',
        memberOf: 'http://example.com/collection/1',
        contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      });
      expect(body.files[0]).not.toHaveProperty('metadataLicenseId');
    });

    it('should return 500 when database error occurs', async () => {
      prisma.file.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await fastify.inject({
        method: 'GET',
        url: '/files',
      });
      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(response.statusCode).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should validate limit parameter', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/files?limit=2000',
      });
      const body = JSON.parse(response.body) as StandardErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
    });

    it('should validate memberOf parameter format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/files?memberOf=invalid-url',
      });
      const body = JSON.parse(response.body) as StandardErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
    });

    it('should validate sort parameter', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/files?sort=invalid',
      });
      const body = JSON.parse(response.body) as StandardErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
    });
  });

  describe('Custom File Transformers', () => {
    it('should apply custom file transformers', async () => {
      await fastifyBefore();

      // Custom transformer that adds extra fields
      const customTransformer: FileTransformer = (file) => ({
        ...file,
        customField: 'test-value',
        uppercaseFilename: file.filename.toUpperCase(),
      });

      await fastify.register(filesRoute, {
        fileAccessTransformer: AllPublicFileAccessTransformer,
        fileTransformers: [customTransformer],
      });

      prisma.file.findMany.mockResolvedValue([mockFile1]);
      prisma.file.count.mockResolvedValue(1);

      const response = await fastify.inject({
        method: 'GET',
        url: '/files',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { files: unknown[] };
      expect(body.files[0]).toMatchObject({
        id: 'http://example.com/file1.wav',
        filename: 'file1.wav',
        customField: 'test-value',
        uppercaseFilename: 'FILE1.WAV',
      });

      await fastifyAfter();
    });

    it('should apply custom file access transformer', async () => {
      await fastifyBefore();

      // Custom access transformer that restricts content access
      const customFileAccessTransformer: FileAccessTransformer = (file) => ({
        ...file,
        access: {
          content: false,
          contentAuthorizationUrl: 'https://example.com/request-access',
        },
      });

      await fastify.register(filesRoute, {
        fileAccessTransformer: customFileAccessTransformer,
      });

      prisma.file.findMany.mockResolvedValue([mockFile1]);
      prisma.file.count.mockResolvedValue(1);

      const response = await fastify.inject({
        method: 'GET',
        url: '/files',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { files: unknown[] };
      expect(body.files[0]).toMatchObject({
        access: {
          content: false,
          contentAuthorizationUrl: 'https://example.com/request-access',
        },
      });

      await fastifyAfter();
    });
  });
});
