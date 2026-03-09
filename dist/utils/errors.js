const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    INVALID_REQUEST: 'INVALID_REQUEST',
    INVALID_ENTITY_TYPE: 'INVALID_ENTITY_TYPE',
};
const createErrorResponse = (code, message, details) => ({
    error: {
        code,
        message,
        details,
    },
});
export const createValidationError = (message, issues) => createErrorResponse(ERROR_CODES.VALIDATION_ERROR, message, { issues });
export const createNotFoundError = (message, entityId) => createErrorResponse(ERROR_CODES.NOT_FOUND, message, entityId ? { entityId } : undefined);
export const createInternalError = (message = 'Internal server error') => {
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, message);
};
//# sourceMappingURL=errors.js.map