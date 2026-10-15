import { createError, createNotFoundError, ERROR_CODES } from 'arocapi';

const id = 'https://example.org/collection';

const notFound = createNotFoundError('The requested collection was not found', id);
const conflict = createError(ERROR_CODES.CONFLICT, 'The deposit is already finalised');
