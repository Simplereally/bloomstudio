/**
 * Pollinations API Error Handling
 *
 * Type-safe error classes and utilities for handling gen.pollinations.ai API errors.
 * Uses Zod inference for full type safety down the stack.
 */

import { z } from "zod"
import {
    ApiErrorSchema,
    BadRequestErrorSchema,
    UnauthorizedErrorSchema,
    InternalErrorSchema,
    ValidationErrorDetailsSchema,
    ApiErrorCodeSchema,
    ClientErrorCodeSchema,
    type ApiError,
    type BadRequestError,
    type UnauthorizedError,
    type InternalError,
    type ApiErrorCode,
    type ClientErrorCode,
    type ErrorCode,
} from "@/lib/schemas/pollinations.schema"

// Re-export schema types for convenience
export type { ApiErrorCode, ClientErrorCode, ErrorCode }

/**
 * Client-side error code constants derived from Zod schema
 * These codes are used for errors that occur on the client side
 */
export const ClientErrorCodeConst = {
    GENERATION_FAILED: "GENERATION_FAILED",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    NETWORK_ERROR: "NETWORK_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const satisfies Record<ClientErrorCode, ClientErrorCode>

/**
 * API error code constants derived from Zod schema
 * These codes match what the Pollinations API returns
 */
export const ApiErrorCodeConst = {
    BAD_REQUEST: "BAD_REQUEST",
    UNAUTHORIZED: "UNAUTHORIZED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
} as const satisfies Record<ApiErrorCode, ApiErrorCode>

/**
 * All error codes (API + Client) for convenience
 */
export const AllErrorCodes = {
    ...ApiErrorCodeConst,
    ...ClientErrorCodeConst,
} as const

/**
 * User-friendly error messages for each error code
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
    [ApiErrorCodeConst.BAD_REQUEST]: "Invalid generation parameters",
    [ApiErrorCodeConst.UNAUTHORIZED]: "Authentication required",
    [ApiErrorCodeConst.INTERNAL_ERROR]: "Server error, please retry",
    [ClientErrorCodeConst.GENERATION_FAILED]: "Generation failed",
    [ClientErrorCodeConst.VALIDATION_ERROR]: "Invalid parameters provided",
    [ClientErrorCodeConst.NETWORK_ERROR]: "Network error, check your connection",
    [ClientErrorCodeConst.UNKNOWN_ERROR]: "An unexpected error occurred",
} as const

/**
 * Validation error details type inferred from Zod schema
 */
export type ValidationErrorDetails = z.infer<typeof ValidationErrorDetailsSchema>

/**
 * Enhanced error details interface
 */
export interface PollinationsErrorDetails {
    /** Error name for logging */
    name?: string
    /** Stack trace (development only) */
    stack?: string
    /** Form-level validation errors */
    formErrors?: string[]
    /** Field-level validation errors */
    fieldErrors?: Record<string, string[]>
    /** Rate limit retry-after in seconds */
    retryAfter?: number
    /** Request ID for support */
    requestId?: string
    /** Any additional context */
    [key: string]: unknown
}

/**
 * Custom error class for Pollinations API errors with typed details.
 *
 * Provides:
 * - Type-safe error codes (Zod-inferred from schema)
 * - Structured validation error details
 * - User-friendly messages
 * - Support for rate limiting info
 */
export class PollinationsApiError extends Error {
    public readonly code: ErrorCode
    public readonly status: number
    public readonly details: PollinationsErrorDetails
    public readonly timestamp: Date
    public readonly requestId?: string

    constructor(
        message: string,
        code: ErrorCode = ClientErrorCodeConst.UNKNOWN_ERROR,
        status: number = 500,
        details: PollinationsErrorDetails = {}
    ) {
        super(message)
        this.name = "PollinationsApiError"
        this.code = code
        this.status = status
        this.details = details
        this.timestamp = new Date()
        this.requestId = details.requestId

        // Ensure prototype chain is properly set
        Object.setPrototypeOf(this, PollinationsApiError.prototype)
    }

    /**
     * Get user-friendly error message based on error code
     */
    get userMessage(): string {
        return ERROR_MESSAGES[this.code] ?? ERROR_MESSAGES[ClientErrorCodeConst.UNKNOWN_ERROR]
    }

    /**
     * Check if error has field-level validation errors
     */
    get hasFieldErrors(): boolean {
        return !!(
            this.details.fieldErrors &&
            Object.keys(this.details.fieldErrors).length > 0
        )
    }

    /**
     * Get all field errors as a flat array of strings
     */
    get flatFieldErrors(): string[] {
        if (!this.details.fieldErrors) return []
        return Object.entries(this.details.fieldErrors).flatMap(
            ([field, errors]) => errors.map((error) => `${field}: ${error}`)
        )
    }

    /**
     * Check if this is a retryable error
     */
    get isRetryable(): boolean {
        return (
            this.code === ApiErrorCodeConst.INTERNAL_ERROR ||
            this.code === ClientErrorCodeConst.NETWORK_ERROR ||
            this.status === 429 ||
            this.status >= 500
        )
    }

    /**
     * Check if this is an authentication error
     */
    get isAuthError(): boolean {
        return this.code === ApiErrorCodeConst.UNAUTHORIZED || this.status === 401
    }

    /**
     * Check if this is a validation error
     */
    get isValidationError(): boolean {
        return (
            this.code === ApiErrorCodeConst.BAD_REQUEST ||
            this.code === ClientErrorCodeConst.VALIDATION_ERROR ||
            this.status === 400
        )
    }

    /**
     * Create error from a parsed BadRequestError response
     */
    static fromBadRequest(response: BadRequestError): PollinationsApiError {
        const { status, error } = response
        return new PollinationsApiError(
            error.message,
            ApiErrorCodeConst.BAD_REQUEST,
            status,
            {
                ...error.details,
                requestId: error.requestId,
            }
        )
    }

    /**
     * Create error from a parsed UnauthorizedError response
     */
    static fromUnauthorized(response: UnauthorizedError): PollinationsApiError {
        const { status, error } = response
        return new PollinationsApiError(
            error.message,
            ApiErrorCodeConst.UNAUTHORIZED,
            status,
            {
                ...error.details,
                requestId: error.requestId,
            }
        )
    }

    /**
     * Create error from a parsed InternalError response
     */
    static fromInternalError(response: InternalError): PollinationsApiError {
        const { status, error } = response
        return new PollinationsApiError(
            error.message,
            ApiErrorCodeConst.INTERNAL_ERROR,
            status,
            {
                ...error.details,
                requestId: error.requestId,
            }
        )
    }

    /**
     * Create error from API response using discriminated union parsing
     */
    static fromApiResponse(response: ApiError): PollinationsApiError {
        // Use discriminated union to get proper type narrowing
        switch (response.status) {
            case 400:
                return PollinationsApiError.fromBadRequest(response)
            case 401:
                return PollinationsApiError.fromUnauthorized(response)
            case 500:
                return PollinationsApiError.fromInternalError(response)
            default: {
                // This should never happen due to exhaustive check, but TypeScript needs it
                const _exhaustive: never = response
                return _exhaustive
            }
        }
    }

    /**
     * Create error from HTTP response with schema validation
     */
    static async fromResponse(response: Response): Promise<PollinationsApiError> {
        try {
            const json = await response.json()
            
            // Try parsing with specific schemas for better type narrowing
            const badRequest = BadRequestErrorSchema.safeParse(json)
            if (badRequest.success) {
                return PollinationsApiError.fromBadRequest(badRequest.data)
            }

            const unauthorized = UnauthorizedErrorSchema.safeParse(json)
            if (unauthorized.success) {
                return PollinationsApiError.fromUnauthorized(unauthorized.data)
            }

            const internalError = InternalErrorSchema.safeParse(json)
            if (internalError.success) {
                return PollinationsApiError.fromInternalError(internalError.data)
            }

            // Fallback: try the union schema
            const apiError = ApiErrorSchema.safeParse(json)
            if (apiError.success) {
                return PollinationsApiError.fromApiResponse(apiError.data)
            }
        } catch {
            // Response is not valid JSON or doesn't match schema
        }

        // Fallback for non-standard error responses
        return new PollinationsApiError(
            `Request failed with status ${response.status}`,
            PollinationsApiError.statusToCode(response.status),
            response.status
        )
    }

    /**
     * Create error from a caught exception
     */
    static fromError(error: unknown): PollinationsApiError {
        if (error instanceof PollinationsApiError) {
            return error
        }

        if (error instanceof z.ZodError) {
            // Zod v4 uses 'issues' property
            const issues = error.issues ?? []
            return new PollinationsApiError(
                "Validation failed",
                ClientErrorCodeConst.VALIDATION_ERROR,
                400,
                {
                    formErrors: issues.map((e) => e.message),
                    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
                }
            )
        }

        if (error instanceof TypeError && error.message.includes("fetch")) {
            return new PollinationsApiError(
                "Network request failed",
                ClientErrorCodeConst.NETWORK_ERROR,
                0
            )
        }

        if (error instanceof Error) {
            return new PollinationsApiError(
                error.message,
                ClientErrorCodeConst.UNKNOWN_ERROR,
                500,
                {
                    name: error.name,
                    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
                }
            )
        }

        return new PollinationsApiError(
            "An unexpected error occurred",
            ClientErrorCodeConst.UNKNOWN_ERROR,
            500
        )
    }

    /**
     * Convert HTTP status code to error code
     */
    private static statusToCode(status: number): ErrorCode {
        switch (status) {
            case 400:
                return ApiErrorCodeConst.BAD_REQUEST
            case 401:
            case 403:
                return ApiErrorCodeConst.UNAUTHORIZED
            case 500:
            case 502:
            case 503:
            case 504:
                return ApiErrorCodeConst.INTERNAL_ERROR
            default:
                return ClientErrorCodeConst.GENERATION_FAILED
        }
    }

    /**
     * Serialize error for logging or transmission
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            status: this.status,
            details: this.details,
            timestamp: this.timestamp.toISOString(),
            requestId: this.requestId,
        }
    }
}

/**
 * Type guard for PollinationsApiError
 */
export function isPollinationsApiError(
    error: unknown
): error is PollinationsApiError {
    return error instanceof PollinationsApiError
}

/**
 * Type guard for BadRequestError API response
 */
export function isBadRequestError(error: unknown): error is BadRequestError {
    return BadRequestErrorSchema.safeParse(error).success
}

/**
 * Type guard for UnauthorizedError API response
 */
export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
    return UnauthorizedErrorSchema.safeParse(error).success
}

/**
 * Type guard for InternalError API response
 */
export function isInternalError(error: unknown): error is InternalError {
    return InternalErrorSchema.safeParse(error).success
}

/**
 * Type guard for any API error response
 */
export function isApiError(error: unknown): error is ApiError {
    return ApiErrorSchema.safeParse(error).success
}

/**
 * Type guard to check if a code is an API error code (from the server)
 */
export function isApiErrorCode(code: string): code is ApiErrorCode {
    return ApiErrorCodeSchema.safeParse(code).success
}

/**
 * Type guard to check if a code is a client error code
 */
export function isClientErrorCode(code: string): code is ClientErrorCode {
    return ClientErrorCodeSchema.safeParse(code).success
}

/**
 * Type guard for any error with a message
 */
export function isErrorWithMessage(
    error: unknown
): error is { message: string } {
    return (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
    )
}

/**
 * Get error message from any error type
 */
export function getErrorMessage(error: unknown): string {
    if (isPollinationsApiError(error)) {
        return error.userMessage
    }
    if (isErrorWithMessage(error)) {
        return error.message
    }
    return ERROR_MESSAGES[ClientErrorCodeConst.UNKNOWN_ERROR]
}
