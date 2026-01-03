import { describe, it, expect } from "vitest"
import { z } from "zod"
import {
    PollinationsApiError,
    isPollinationsApiError,
    isErrorWithMessage,
    getErrorMessage,
    isBadRequestError,
    isUnauthorizedError,
    isInternalError,
    isApiError,
    isApiErrorCode,
    isClientErrorCode,
    isFluxModelUnavailable,
    ApiErrorCodeConst,
    ClientErrorCodeConst,
    AllErrorCodes,
    ERROR_MESSAGES,
} from "./pollinations-error"

describe("pollinations-error", () => {
    describe("PollinationsApiError", () => {
        it("creates error with default values", () => {
            const error = new PollinationsApiError("Test error")

            expect(error.message).toBe("Test error")
            expect(error.code).toBe(ClientErrorCodeConst.UNKNOWN_ERROR)
            expect(error.status).toBe(500)
            expect(error.details).toEqual({})
            expect(error.name).toBe("PollinationsApiError")
            expect(error.timestamp).toBeInstanceOf(Date)
        })

        it("creates error with all properties", () => {
            const error = new PollinationsApiError(
                "Test error",
                ApiErrorCodeConst.BAD_REQUEST,
                400,
                { fieldErrors: { prompt: ["Required"] }, requestId: "req_123" }
            )

            expect(error.message).toBe("Test error")
            expect(error.code).toBe(ApiErrorCodeConst.BAD_REQUEST)
            expect(error.status).toBe(400)
            expect(error.details.fieldErrors).toEqual({ prompt: ["Required"] })
            expect(error.requestId).toBe("req_123")
        })

        describe("userMessage", () => {
            it("returns mapped message for known error codes", () => {
                const badRequest = new PollinationsApiError(
                    "technical",
                    ApiErrorCodeConst.BAD_REQUEST,
                    400
                )
                const unauthorized = new PollinationsApiError(
                    "technical",
                    ApiErrorCodeConst.UNAUTHORIZED,
                    401
                )
                const internal = new PollinationsApiError(
                    "technical",
                    ApiErrorCodeConst.INTERNAL_ERROR,
                    500
                )

                expect(badRequest.userMessage).toBe(ERROR_MESSAGES[ApiErrorCodeConst.BAD_REQUEST])
                expect(unauthorized.userMessage).toBe(ERROR_MESSAGES[ApiErrorCodeConst.UNAUTHORIZED])
                expect(internal.userMessage).toBe(ERROR_MESSAGES[ApiErrorCodeConst.INTERNAL_ERROR])
            })
        })

        describe("hasFieldErrors", () => {
            it("returns true when field errors exist", () => {
                const error = new PollinationsApiError(
                    "Validation failed",
                    ApiErrorCodeConst.BAD_REQUEST,
                    400,
                    { fieldErrors: { prompt: ["Required"] } }
                )

                expect(error.hasFieldErrors).toBe(true)
            })

            it("returns false when no field errors", () => {
                const error = new PollinationsApiError("Error")
                expect(error.hasFieldErrors).toBe(false)
            })

            it("returns false for empty field errors", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ApiErrorCodeConst.BAD_REQUEST,
                    400,
                    { fieldErrors: {} }
                )
                expect(error.hasFieldErrors).toBe(false)
            })
        })

        describe("flatFieldErrors", () => {
            it("returns flattened array of field errors", () => {
                const error = new PollinationsApiError(
                    "Validation failed",
                    ApiErrorCodeConst.BAD_REQUEST,
                    400,
                    {
                        fieldErrors: {
                            prompt: ["Required", "Too short"],
                            width: ["Must be positive"],
                        },
                    }
                )

                const flat = error.flatFieldErrors
                expect(flat).toHaveLength(3)
                expect(flat).toContain("prompt: Required")
                expect(flat).toContain("prompt: Too short")
                expect(flat).toContain("width: Must be positive")
            })

            it("returns empty array when no field errors", () => {
                const error = new PollinationsApiError("Error")
                expect(error.flatFieldErrors).toEqual([])
            })
        })

        describe("isRetryable", () => {
            it("returns true for internal errors", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ApiErrorCodeConst.INTERNAL_ERROR,
                    500
                )
                expect(error.isRetryable).toBe(true)
            })

            it("returns true for network errors", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ClientErrorCodeConst.NETWORK_ERROR,
                    0
                )
                expect(error.isRetryable).toBe(true)
            })

            it("returns true for rate limit (429)", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ApiErrorCodeConst.BAD_REQUEST,
                    429
                )
                expect(error.isRetryable).toBe(true)
            })

            it("returns true for 5xx status codes", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ClientErrorCodeConst.GENERATION_FAILED,
                    502
                )
                expect(error.isRetryable).toBe(true)
            })

            it("returns false for validation errors", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ApiErrorCodeConst.BAD_REQUEST,
                    400
                )
                expect(error.isRetryable).toBe(false)
            })
        })

        describe("isAuthError", () => {
            it("returns true for unauthorized code", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ApiErrorCodeConst.UNAUTHORIZED,
                    403
                )
                expect(error.isAuthError).toBe(true)
            })

            it("returns true for 401 status", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ClientErrorCodeConst.GENERATION_FAILED,
                    401
                )
                expect(error.isAuthError).toBe(true)
            })

            it("returns false for other errors", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ApiErrorCodeConst.BAD_REQUEST,
                    400
                )
                expect(error.isAuthError).toBe(false)
            })
        })

        describe("isValidationError", () => {
            it("returns true for bad request code", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ApiErrorCodeConst.BAD_REQUEST,
                    400
                )
                expect(error.isValidationError).toBe(true)
            })

            it("returns true for validation error code", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ClientErrorCodeConst.VALIDATION_ERROR,
                    400
                )
                expect(error.isValidationError).toBe(true)
            })

            it("returns true for 400 status", () => {
                const error = new PollinationsApiError(
                    "Error",
                    ClientErrorCodeConst.GENERATION_FAILED,
                    400
                )
                expect(error.isValidationError).toBe(true)
            })
        })

        describe("fromApiResponse", () => {
            it("creates error from BadRequest API response", () => {
                const response = {
                    status: 400 as const,
                    success: false as const,
                    error: {
                        code: "BAD_REQUEST" as const,
                        message: "Validation failed",
                        timestamp: new Date().toISOString(),
                        requestId: "req_123",
                        details: {
                            name: "ZodError",
                            formErrors: [] as string[],
                            fieldErrors: { prompt: ["Required"] } as Record<string, string[]>,
                        },
                    },
                }

                const error = PollinationsApiError.fromApiResponse(response)

                expect(error.message).toBe("Validation failed")
                expect(error.code).toBe(ApiErrorCodeConst.BAD_REQUEST)
                expect(error.status).toBe(400)
                expect(error.requestId).toBe("req_123")
            })

            it("creates error from Unauthorized API response", () => {
                const response = {
                    status: 401 as const,
                    success: false as const,
                    error: {
                        code: "UNAUTHORIZED" as const,
                        message: "Authentication required",
                        timestamp: new Date().toISOString(),
                        requestId: "req_456",
                        details: {
                            name: "UnauthorizedError",
                        },
                    },
                }

                const error = PollinationsApiError.fromApiResponse(response)

                expect(error.message).toBe("Authentication required")
                expect(error.code).toBe(ApiErrorCodeConst.UNAUTHORIZED)
                expect(error.status).toBe(401)
            })

            it("creates error from InternalError API response", () => {
                const response = {
                    status: 500 as const,
                    success: false as const,
                    error: {
                        code: "INTERNAL_ERROR" as const,
                        message: "Server error",
                        timestamp: new Date().toISOString(),
                        details: {
                            name: "InternalError",
                        },
                    },
                }

                const error = PollinationsApiError.fromApiResponse(response)

                expect(error.message).toBe("Server error")
                expect(error.code).toBe(ApiErrorCodeConst.INTERNAL_ERROR)
                expect(error.status).toBe(500)
            })
        })

        describe("fromResponse", () => {
            it("parses JSON error response", async () => {
                const mockResponse = {
                    status: 400,
                    ok: false,
                    json: async () => ({
                        status: 400,
                        success: false,
                        error: {
                            code: "BAD_REQUEST",
                            message: "Bad request",
                            timestamp: new Date().toISOString(),
                            details: {
                                name: "ValidationError",
                                formErrors: [],
                                fieldErrors: {},
                            },
                        },
                    }),
                } as unknown as Response

                const error = await PollinationsApiError.fromResponse(mockResponse)

                expect(error.message).toBe("Bad request")
                expect(error.code).toBe(ApiErrorCodeConst.BAD_REQUEST)
            })

            it("handles non-JSON response", async () => {
                const mockResponse = {
                    status: 503,
                    ok: false,
                    json: async () => {
                        throw new Error("Not JSON")
                    },
                } as unknown as Response

                const error = await PollinationsApiError.fromResponse(mockResponse)

                expect(error.message).toBe("Request failed with status 503")
                expect(error.code).toBe(ApiErrorCodeConst.INTERNAL_ERROR)
            })

            it("parses Unauthorized response using specific schema", async () => {
                const mockResponse = {
                    status: 401,
                    ok: false,
                    json: async () => ({
                        status: 401,
                        success: false,
                        error: {
                            code: "UNAUTHORIZED",
                            message: "Invalid API key",
                            timestamp: new Date().toISOString(),
                            details: {
                                name: "UnauthorizedError",
                            },
                        },
                    }),
                } as unknown as Response

                const error = await PollinationsApiError.fromResponse(mockResponse)

                expect(error.message).toBe("Invalid API key")
                expect(error.code).toBe(ApiErrorCodeConst.UNAUTHORIZED)
                expect(error.isAuthError).toBe(true)
            })
        })

        describe("fromError", () => {
            it("returns existing PollinationsApiError unchanged", () => {
                const original = new PollinationsApiError(
                    "Original",
                    ApiErrorCodeConst.BAD_REQUEST,
                    400
                )
                const result = PollinationsApiError.fromError(original)

                expect(result).toBe(original)
            })

            it("converts ZodError to validation error", () => {
                // Create a ZodError by actually failing validation
                const TestSchema = z.object({
                    prompt: z.string().min(1),
                })

                let zodError: z.ZodError | null = null
                try {
                    TestSchema.parse({ prompt: "" })
                } catch (e) {
                    zodError = e as z.ZodError
                }

                expect(zodError).not.toBeNull()
                const error = PollinationsApiError.fromError(zodError!)

                expect(error.code).toBe(ClientErrorCodeConst.VALIDATION_ERROR)
                expect(error.status).toBe(400)
            })

            it("converts TypeError with fetch to network error", () => {
                const fetchError = new TypeError("Failed to fetch")

                const error = PollinationsApiError.fromError(fetchError)

                expect(error.code).toBe(ClientErrorCodeConst.NETWORK_ERROR)
            })

            it("wraps generic Error", () => {
                const genericError = new Error("Something broke")

                const error = PollinationsApiError.fromError(genericError)

                expect(error.message).toBe("Something broke")
                expect(error.code).toBe(ClientErrorCodeConst.UNKNOWN_ERROR)
            })

            it("handles non-Error values", () => {
                const error = PollinationsApiError.fromError("string error")

                expect(error.message).toBe("An unexpected error occurred")
                expect(error.code).toBe(ClientErrorCodeConst.UNKNOWN_ERROR)
            })
        })

        describe("toJSON", () => {
            it("serializes error to JSON object", () => {
                const error = new PollinationsApiError(
                    "Test",
                    ApiErrorCodeConst.INTERNAL_ERROR,
                    500,
                    { requestId: "req_123" }
                )

                const json = error.toJSON()

                expect(json).toMatchObject({
                    name: "PollinationsApiError",
                    message: "Test",
                    code: ApiErrorCodeConst.INTERNAL_ERROR,
                    status: 500,
                    requestId: "req_123",
                })
                expect(json.timestamp).toBeDefined()
            })
        })
    })

    describe("isPollinationsApiError", () => {
        it("returns true for PollinationsApiError", () => {
            const error = new PollinationsApiError("Test")
            expect(isPollinationsApiError(error)).toBe(true)
        })

        it("returns false for regular Error", () => {
            const error = new Error("Test")
            expect(isPollinationsApiError(error)).toBe(false)
        })

        it("returns false for plain objects", () => {
            expect(isPollinationsApiError({ message: "Test" })).toBe(false)
        })

        it("returns false for null/undefined", () => {
            expect(isPollinationsApiError(null)).toBe(false)
            expect(isPollinationsApiError(undefined)).toBe(false)
        })
    })

    describe("isErrorWithMessage", () => {
        it("returns true for objects with message string", () => {
            expect(isErrorWithMessage({ message: "Test" })).toBe(true)
            expect(isErrorWithMessage(new Error("Test"))).toBe(true)
        })

        it("returns false for invalid inputs", () => {
            expect(isErrorWithMessage(null)).toBe(false)
            expect(isErrorWithMessage(undefined)).toBe(false)
            expect(isErrorWithMessage("string")).toBe(false)
            expect(isErrorWithMessage({ message: 123 })).toBe(false)
        })
    })

    describe("getErrorMessage", () => {
        it("returns userMessage for PollinationsApiError", () => {
            const error = new PollinationsApiError(
                "Technical error",
                ApiErrorCodeConst.UNAUTHORIZED,
                401
            )

            expect(getErrorMessage(error)).toBe(ERROR_MESSAGES[ApiErrorCodeConst.UNAUTHORIZED])
        })

        it("returns message for Error objects", () => {
            const error = new Error("Custom message")
            expect(getErrorMessage(error)).toBe("Custom message")
        })

        it("returns default message for unknown types", () => {
            expect(getErrorMessage("string")).toBe(ERROR_MESSAGES[ClientErrorCodeConst.UNKNOWN_ERROR])
            expect(getErrorMessage(null)).toBe(ERROR_MESSAGES[ClientErrorCodeConst.UNKNOWN_ERROR])
        })

        it("returns MODEL_UNAVAILABLE message for ServerGenerationError with that code", () => {
            // Create an object that matches ServerGenerationError shape
            const serverError = {
                name: "ServerGenerationError",
                message: "Model is unavailable",
                code: "MODEL_UNAVAILABLE",
            }
            expect(getErrorMessage(serverError)).toBe(ERROR_MESSAGES[ClientErrorCodeConst.MODEL_UNAVAILABLE])
        })
    })

    describe("ERROR_MESSAGES", () => {
        it("has messages for all error codes", () => {
            Object.values(AllErrorCodes).forEach((code) => {
                expect(ERROR_MESSAGES[code]).toBeDefined()
                expect(typeof ERROR_MESSAGES[code]).toBe("string")
            })
        })
    })

    describe("type guards", () => {
        describe("isBadRequestError", () => {
            it("returns true for valid BadRequest response", () => {
                const response = {
                    status: 400,
                    success: false,
                    error: {
                        code: "BAD_REQUEST",
                        message: "Validation failed",
                        timestamp: new Date().toISOString(),
                        details: {
                            name: "ZodError",
                            formErrors: [],
                            fieldErrors: {},
                        },
                    },
                }
                expect(isBadRequestError(response)).toBe(true)
            })

            it("returns false for other error types", () => {
                const response = {
                    status: 401,
                    success: false,
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Auth required",
                        timestamp: new Date().toISOString(),
                        details: { name: "Error" },
                    },
                }
                expect(isBadRequestError(response)).toBe(false)
            })
        })

        describe("isUnauthorizedError", () => {
            it("returns true for valid Unauthorized response", () => {
                const response = {
                    status: 401,
                    success: false,
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Auth required",
                        timestamp: new Date().toISOString(),
                        details: { name: "UnauthorizedError" },
                    },
                }
                expect(isUnauthorizedError(response)).toBe(true)
            })
        })

        describe("isInternalError", () => {
            it("returns true for valid InternalError response", () => {
                const response = {
                    status: 500,
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Server error",
                        timestamp: new Date().toISOString(),
                        details: { name: "InternalError" },
                    },
                }
                expect(isInternalError(response)).toBe(true)
            })
        })

        describe("isApiError", () => {
            it("returns true for any valid API error response", () => {
                const badRequest = {
                    status: 400,
                    success: false,
                    error: {
                        code: "BAD_REQUEST",
                        message: "Bad",
                        timestamp: new Date().toISOString(),
                        details: { name: "Error", formErrors: [], fieldErrors: {} },
                    },
                }
                expect(isApiError(badRequest)).toBe(true)
            })

            it("returns false for invalid responses", () => {
                expect(isApiError({ status: 404 })).toBe(false)
                expect(isApiError(null)).toBe(false)
            })
        })

        describe("isApiErrorCode", () => {
            it("returns true for API error codes", () => {
                expect(isApiErrorCode("BAD_REQUEST")).toBe(true)
                expect(isApiErrorCode("UNAUTHORIZED")).toBe(true)
                expect(isApiErrorCode("INTERNAL_ERROR")).toBe(true)
            })

            it("returns false for client error codes", () => {
                expect(isApiErrorCode("NETWORK_ERROR")).toBe(false)
                expect(isApiErrorCode("UNKNOWN_ERROR")).toBe(false)
            })
        })

        describe("isClientErrorCode", () => {
            it("returns true for client error codes", () => {
                expect(isClientErrorCode("NETWORK_ERROR")).toBe(true)
                expect(isClientErrorCode("UNKNOWN_ERROR")).toBe(true)
                expect(isClientErrorCode("VALIDATION_ERROR")).toBe(true)
                expect(isClientErrorCode("GENERATION_FAILED")).toBe(true)
                expect(isClientErrorCode("MODEL_UNAVAILABLE")).toBe(true)
            })

            it("returns false for API error codes", () => {
                expect(isClientErrorCode("BAD_REQUEST")).toBe(false)
                expect(isClientErrorCode("UNAUTHORIZED")).toBe(false)
            })
        })
    })

    // NOTE: These tests are for deprecated functionality (Flux has been decommissioned)
    // but we keep the tests to ensure legacy error handling still works
    describe("isFluxModelUnavailable (deprecated - legacy support)", () => {
        it("returns true for direct match of flux unavailable message", () => {
            expect(isFluxModelUnavailable("No active flux servers available")).toBe(true)
        })

        it("returns true when message contains the flux unavailable pattern", () => {
            expect(isFluxModelUnavailable("Error: No active flux servers available, please try again later")).toBe(true)
        })

        it("returns true for nested JSON error with flux unavailable message", () => {
            // This matches the actual Pollinations API error structure
            const nestedJsonMessage = JSON.stringify({
                error: "Internal Server Error",
                message: "No active flux servers available",
                timingInfo: [],
                requestId: "abc123",
            })
            expect(isFluxModelUnavailable(nestedJsonMessage)).toBe(true)
        })

        it("returns true for nested JSON with error field containing the pattern", () => {
            const nestedJsonMessage = JSON.stringify({
                error: "No active flux servers available",
                message: "Something else",
            })
            expect(isFluxModelUnavailable(nestedJsonMessage)).toBe(true)
        })

        it("returns false for unrelated error messages", () => {
            expect(isFluxModelUnavailable("Bad request")).toBe(false)
            expect(isFluxModelUnavailable("Internal server error")).toBe(false)
            expect(isFluxModelUnavailable("Network timeout")).toBe(false)
        })

        it("returns false for empty string", () => {
            expect(isFluxModelUnavailable("")).toBe(false)
        })

        it("returns false for valid JSON without the pattern", () => {
            const jsonMessage = JSON.stringify({
                error: "Some other error",
                message: "Different message",
            })
            expect(isFluxModelUnavailable(jsonMessage)).toBe(false)
        })

        it("handles malformed JSON gracefully", () => {
            expect(isFluxModelUnavailable("{invalid json")).toBe(false)
            expect(isFluxModelUnavailable("{ message: 'unquoted' }")).toBe(false)
        })

        it("handles the exact Pollinations API error structure", () => {
            // Exact structure from the user's example
            const pollinationsError = JSON.stringify({
                error: "Internal Server Error",
                message: "No active flux servers available",
                timingInfo: [
                    { step: "Request received.", timestamp: 0 },
                    { step: "Start generating job", timestamp: 0 },
                ],
                requestId: "n5krj4",
                requestParameters: {
                    prompt: "test prompt",
                    width: 1024,
                    height: 1024,
                    model: "flux",
                },
            })
            expect(isFluxModelUnavailable(pollinationsError)).toBe(true)
        })
    })
})
