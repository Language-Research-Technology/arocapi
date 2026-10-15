import type { FileTransformer } from 'arocapi';

const addSizeInKb: FileTransformer = (file) => ({ ...file, sizeInKb: Math.round(file.size / 1024) });
