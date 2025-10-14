const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

type ErrorDetails = {
  [key: string]: unknown;
};

export type StandardErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
  };
};

const createErrorResponse = (code: ErrorCode, message: string, details?: ErrorDetails): StandardErrorResponse => ({
  error: {
    code,
    message,
    details,
  },
});

export const createValidationError = (message: string, issues: string[]): StandardErrorResponse =>
  createErrorResponse(ERROR_CODES.VALIDATION_ERROR, message, { issues });

export const createNotFoundError = (message: string, entityId?: string): StandardErrorResponse =>
  createErrorResponse(ERROR_CODES.NOT_FOUND, message, entityId ? { entityId } : undefined);

// export const createRateLimitError = (retryAfter: number): StandardErrorResponse =>
//   createErrorResponse(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded. Please retry after the specified time.', {
//     retryAfter,
//   });

export const createInternalError = (message = 'Internal server error'): StandardErrorResponse => {
  return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, message);
};
