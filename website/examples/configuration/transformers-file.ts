import type { FileTransformer } from 'arocapi';

export const addSizeInKb: FileTransformer = (file) => ({ ...file, sizeInKb: Math.round(file.size / 1024) });
