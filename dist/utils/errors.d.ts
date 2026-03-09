declare const ERROR_CODES: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly INVALID_ENTITY_TYPE: "INVALID_ENTITY_TYPE";
};
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
export declare const createValidationError: (message: string, issues: string[]) => StandardErrorResponse;
export declare const createNotFoundError: (message: string, entityId?: string) => StandardErrorResponse;
export declare const createInternalError: (message?: string) => StandardErrorResponse;
export {};
