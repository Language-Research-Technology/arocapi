import type { FastifyPluginAsync } from 'fastify';
import type { FileAccessTransformer, FileTransformer } from '../types/transformers.js';
type FilesRouteOptions = {
    fileAccessTransformer: FileAccessTransformer;
    fileTransformers?: FileTransformer[];
};
declare const files: FastifyPluginAsync<FilesRouteOptions>;
export default files;
