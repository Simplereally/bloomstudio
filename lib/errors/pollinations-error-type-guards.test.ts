/**
 * Type guard tests for Pollinations API error handling.
 * Tests for API response type guards and legacy Flux model detection.
 *
 * Split from pollinations-error.test.ts for maintainability.
 * @see pollinations-error.test.ts for PollinationsApiError class tests
 */
import { describe, it, expect } from "vitest"
import {
    isBadRequestError,
    isUnauthorizedError,
    isInternalError,
    isApiError,
    isApiErrorCode,
    isClientErrorCode,
    isFluxModelUnavailable,
} from "./pollinations-error"

describe("pollinations-error type guards", () => {
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
