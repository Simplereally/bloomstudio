import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry, isRetryableError } from "./retry";

describe("retry.ts", () => {
    describe("withRetry", () => {
        beforeEach(() => {
           vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should return the result if the function succeeds on the first attempt", async () => {
            const mockFn = vi.fn().mockResolvedValue("success");
            const result = await withRetry(mockFn);

            expect(result).toBe("success");
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it("should retry if the function fails and succeeds continuously", async () => {
            const mockFn = vi.fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValueOnce("success");

            const promise = withRetry(mockFn, { initialDelayMs: 100 });
            
            // Fast-forward timers
            await vi.advanceTimersByTimeAsync(100);
            
            const result = await promise;
            expect(result).toBe("success");
            expect(mockFn).toHaveBeenCalledTimes(2);
        });

        it("should fail if max attempts are reached", async () => {
            const mockFn = vi.fn().mockRejectedValue(new Error("fail"));

            const promise = withRetry(mockFn, { 
                maxAttempts: 3, 
                initialDelayMs: 100 
            });

            // Prevent unhandled rejection warning
            promise.catch(() => {});

            // Fast-forward timers enough times
            await vi.advanceTimersByTimeAsync(100); // Wait 1st retry
            await vi.advanceTimersByTimeAsync(200); // Wait 2nd retry

            await expect(promise).rejects.toThrow("fail");
            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        it("should stop retrying if shouldRetry returns false", async () => {
           const mockFn = vi.fn().mockRejectedValue(new Error("fatal error"));
           const shouldRetry = vi.fn().mockReturnValue(false);

           await expect(withRetry(mockFn, { shouldRetry })).rejects.toThrow("fatal error");
           expect(mockFn).toHaveBeenCalledTimes(1);
           expect(shouldRetry).toHaveBeenCalledTimes(1);
        });

        it("should respect maxDelayMs", async () => {
             const mockFn = vi.fn().mockRejectedValue(new Error("fail"));

             const promise = withRetry(mockFn, {
                 maxAttempts: 4,
                 initialDelayMs: 1000,
                 maxDelayMs: 1500
             });
             
             // Suppress unhandled rejection warning as we expect this to fail eventually
             promise.catch(() => {});
             
             // 1st retry: 1000ms
             await vi.advanceTimersByTimeAsync(1000);
             
             // 2nd retry: should be 2000ms but capped at 1500ms
             await vi.advanceTimersByTimeAsync(1500);

             // 3rd retry: 1500ms
             await vi.advanceTimersByTimeAsync(1500);
             
             await expect(promise).rejects.toThrow("fail");
             
             expect(mockFn).toHaveBeenCalledTimes(4);
        });
    });

    describe("isRetryableError", () => {
        it("should return true for network errors", () => {
            expect(isRetryableError(new Error("Network Error"))).toBe(true);
            expect(isRetryableError(new Error("Connection refused"))).toBe(true);
            expect(isRetryableError(new Error("Fetch failed"))).toBe(true);
            expect(isRetryableError(new Error("Request timeout"))).toBe(true);
        });

        it("should return false for generic errors", () => {
            expect(isRetryableError(new Error("Invalid argument"))).toBe(false);
            expect(isRetryableError(new Error("Something broke"))).toBe(false);
        });

        it("should return true for 5xx status codes in AWS SDK errors", () => {
            const error500 = { $metadata: { httpStatusCode: 500 } };
            const error503 = { $metadata: { httpStatusCode: 503 } };
            
            expect(isRetryableError(error500)).toBe(true);
            expect(isRetryableError(error503)).toBe(true);
        });

        it("should return false for 4xx status codes in AWS SDK errors", () => {
            const error404 = { $metadata: { httpStatusCode: 404 } };
            const error400 = { $metadata: { httpStatusCode: 400 } };

            expect(isRetryableError(error404)).toBe(false);
            expect(isRetryableError(error400)).toBe(false);
        });
        
        it("should handle null/undefined errors gracefully", () => {
            expect(isRetryableError(null)).toBe(false);
            expect(isRetryableError(undefined)).toBe(false);
            expect(isRetryableError("string error")).toBe(false);
        });
    });
});
