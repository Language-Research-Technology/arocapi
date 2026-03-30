import type { FastifyReply } from 'fastify';

export const setFileHeaders = (
  reply: FastifyReply,
  metadata: { contentType: string; contentLength: number; etag?: string; lastModified?: Date },
) => {
  reply.header('Content-Type', metadata.contentType);
  reply.header('Content-Length', metadata.contentLength.toString());

  if (metadata.etag) {
    reply.header('ETag', metadata.etag);
  }
  if (metadata.lastModified) {
    reply.header('Last-Modified', metadata.lastModified.toUTCString());
  }
};
