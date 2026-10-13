import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RANGE_NOT_SATISFIABLE: 'RANGE_NOT_SATISFIABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_ENTITY_TYPE: 'INVALID_ENTITY_TYPE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

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

export const createError = (code: ErrorCode, message: string, details?: ErrorDetails): StandardErrorResponse => ({
  error: {
    code,
    message,
    details,
  },
});

type ValidationViolation = {
  field: string;
  message?: string;
  value?: unknown;
};

export const createValidationError = (message: string, violations: ValidationViolation[]): StandardErrorResponse =>
  createError(ERROR_CODES.VALIDATION_ERROR, message, { violations });

export const createNotFoundError = (message: string, entityId?: string): StandardErrorResponse =>
  createError(ERROR_CODES.NOT_FOUND, message, entityId ? { entityId } : undefined);

export const createAuthenticationRequiredError = (message: string, entityId: string): StandardErrorResponse =>
  createError(ERROR_CODES.UNAUTHORIZED, message, { entityId });

export const createForbiddenError = (message: string, entityId: string): StandardErrorResponse =>
  createError(ERROR_CODES.FORBIDDEN, message, { entityId });

export const createInternalError = (message = 'Internal server error'): StandardErrorResponse =>
  createError(ERROR_CODES.INTERNAL_ERROR, message);

const ERROR_CODE_BY_STATUS: Record<number, ErrorCode> = {
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  409: ERROR_CODES.CONFLICT,
  416: ERROR_CODES.RANGE_NOT_SATISFIABLE,
  429: ERROR_CODES.RATE_LIMIT_EXCEEDED,
};

export const errorHandler = (error: unknown, request: FastifyRequest, reply: FastifyReply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    const violations = error.validation.map((v) => ({
      field: v.instancePath,
      message: v.message,
    }));

    return reply.code(400).send(createValidationError('The request parameters are invalid', violations));
  }

  const { statusCode, status, message, headers } = (error ?? {}) as Partial<
    FastifyError & { status: number; headers: Record<string, string> }
  >;
  const httpStatus = statusCode ?? status;
  if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
    const code = ERROR_CODE_BY_STATUS[httpStatus] ?? ERROR_CODES.VALIDATION_ERROR;

    return reply
      .code(httpStatus)
      .headers(headers ?? {})
      .send(createError(code, message ?? ''));
  }

  request.log.error({ err: error });

  return reply.code(500).send(createInternalError());
};

export const notFoundHandler = (_request: FastifyRequest, reply: FastifyReply) =>
  reply.code(404).send(createNotFoundError('The requested resource was not found'));
