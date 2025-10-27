import type { Readable } from 'node:stream';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Entity, File } from '../generated/prisma/client.js';

export type FileHandlerContext = {
  request: FastifyRequest;
  fastify: FastifyInstance;
};

export type FileMetadata = {
  contentType: string;
  contentLength: number;
  etag?: string;
  lastModified?: Date;
};

export type FileRedirectResult = {
  type: 'redirect';
  url: string;
};

export type FileStreamResult = {
  type: 'stream';
  stream: Readable;
  metadata: FileMetadata;
};

export type FilePathResult = {
  type: 'file';
  path: string; // Absolute file path on disk
  metadata: FileMetadata;
  accelPath?: string; // Optional nginx internal path for X-Accel-Redirect
};

export type FileResult = FileRedirectResult | FileStreamResult | FilePathResult;

export type GetFileHandler = (
  file: File,
  context: FileHandlerContext,
) => Promise<FileResult | false> | FileResult | false;

export type HeadFileHandler = (
  file: File,
  context: FileHandlerContext,
) => Promise<FileMetadata | false> | FileMetadata | false;

export type FileHandler = {
  get: GetFileHandler;
  head: HeadFileHandler;
};

export type GetRoCrateHandler = (
  entity: Entity,
  context: FileHandlerContext,
) => Promise<FileResult | false> | FileResult | false;

export type HeadRoCrateHandler = (
  entity: Entity,
  context: FileHandlerContext,
) => Promise<FileMetadata | false> | FileMetadata | false;

export type RoCrateHandler = {
  get: GetRoCrateHandler;
  head: HeadRoCrateHandler;
};
