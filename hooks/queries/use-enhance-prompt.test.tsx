/**
 * @vitest-environment jsdom
 * 
 * Tests for useEnhancePrompt Hook
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, act, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useEnhancePrompt } from "./use-enhance-prompt"

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })

    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient} >
                {children}
            </QueryClientProvider>
        )
    }
}

describe("useEnhancePrompt", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn() as unknown as typeof fetch
    })

    it("successfully enhances a prompt", async () => {
        const mockResponse = {
            success: true,
            data: { enhancedText: "An ultra-detailed cinematic sunset" }
        }

        // Use a promise we can resolve manually to control timing
        let resolveFetch: () => void
        const fetchPromise = new Promise((resolve) => {
            resolveFetch = () => resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            })
        })

        vi.mocked(global.fetch).mockReturnValue(fetchPromise as Promise<Response>)

        const onSuccess = vi.fn()
        const { result } = renderHook(() => useEnhancePrompt({ onSuccess }), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.enhance({ prompt: "sunset", type: "prompt" })
        })

        // Verify it enters enhancing state
        await waitFor(() => {
            expect(result.current.isEnhancing).toBe(true)
        })

        // Resolve the fetch
        await act(async () => {
            resolveFetch()
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toBe("An ultra-detailed cinematic sunset")
        expect(onSuccess).toHaveBeenCalledWith("An ultra-detailed cinematic sunset", {
            prompt: "sunset",
            type: "prompt"
        })
    })

    it("should handle API errors", async () => {
        const mockErrorResponse = {
            success: false,
            error: {
                code: "API_ERROR",
                message: "Failed to enhance prompt"
            }
        }

        vi.mocked(global.fetch).mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve(mockErrorResponse),
        } as Response)

        const onError = vi.fn()
        const { result } = renderHook(() => useEnhancePrompt({ onError }), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.enhance({ prompt: "sunset", type: "prompt" })
        })

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error?.message).toBe("Failed to enhance prompt")
        expect(result.current.error?.code).toBe("API_ERROR")
        expect(onError).toHaveBeenCalledWith(expect.any(Error), {
            prompt: "sunset",
            type: "prompt"
        })
    })

    it("should support cancellation", async () => {
        vi.mocked(global.fetch).mockReturnValue(new Promise(() => { }) as Promise<Response>)

        const { result } = renderHook(() => useEnhancePrompt(), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.enhance({ prompt: "sunset", type: "prompt" })
        })

        await waitFor(() => {
            expect(result.current.isEnhancing).toBe(true)
        })

        act(() => {
            result.current.cancel()
        })

        await waitFor(() => {
            expect(result.current.isEnhancing).toBe(false)
        })
        expect(result.current.data).toBeUndefined()
    })

    it("should abort the previous request when a new one is triggered", async () => {
        const abortSpy = vi.spyOn(AbortController.prototype, "abort")

        vi.mocked(global.fetch).mockReturnValue(new Promise(() => { }) as Promise<Response>)

        const { result } = renderHook(() => useEnhancePrompt(), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.enhance({ prompt: "first", type: "prompt" })
        })

        // Wait for the first mutation to start setting the abortControllerRef
        await waitFor(() => {
            expect(result.current.isEnhancing).toBe(true)
        })

        act(() => {
            result.current.enhance({ prompt: "second", type: "prompt" })
        })

        expect(abortSpy).toHaveBeenCalled()
    })

    it("should not call onSuccess when cancelled after fetch completes", async () => {
        const mockResponse = {
            success: true,
            data: { enhancedText: "Enhanced text that should NOT be applied" }
        }

        // Create a promise we control to simulate race condition
        let resolveFetch: () => void
        const fetchPromise = new Promise<Response>((resolve) => {
            resolveFetch = () => resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response)
        })

        vi.mocked(global.fetch).mockReturnValue(fetchPromise)

        const onSuccess = vi.fn()
        const { result } = renderHook(() => useEnhancePrompt({ onSuccess }), {
            wrapper: createWrapper(),
        })

        // Start enhancement
        act(() => {
            result.current.enhance({ prompt: "test", type: "prompt" })
        })

        await waitFor(() => {
            expect(result.current.isEnhancing).toBe(true)
        })

        // Cancel before fetch resolves (simulating user clicking stop)
        act(() => {
            result.current.cancel()
        })

        // Wait for isEnhancing state to update after cancel
        await waitFor(() => {
            expect(result.current.isEnhancing).toBe(false)
        })

        // Now resolve the fetch (simulating network completing after cancel)
        await act(async () => {
            resolveFetch()
            // Small delay to let any callbacks process
            await new Promise((r) => setTimeout(r, 50))
        })

        // onSuccess should NOT have been called because we cancelled
        expect(onSuccess).not.toHaveBeenCalled()
    })
})
