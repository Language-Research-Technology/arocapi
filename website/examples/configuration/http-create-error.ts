import { createError, createNotFoundError, ERROR_CODES } from 'arocapi';

const id = 'https://example.org/collection';

export const notFound = createNotFoundError('The requested collection was not found', id);
export const conflict = createError(ERROR_CODES.CONFLICT, 'The deposit is already finalised');
