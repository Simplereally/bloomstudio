// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { useImageModels } from "./use-image-models"

// Mock the API module
vi.mock("@/lib/api/models-api", () => ({
    fetchImageModels: vi.fn(),
}))

import { fetchImageModels } from "@/lib/api/models-api"

const mockFetchImageModels = fetchImageModels as unknown as ReturnType<typeof vi.fn>

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    })
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }
}

describe("useImageModels", () => {
    const mockModels = [
        {
            name: "flux",
            aliases: ["default"],
            pricing: { currency: "pollen" as const },
            description: "Test model",
        },
        {
            name: "turbo",
            aliases: ["fast"],
            pricing: { currency: "pollen" as const },
            description: "Fast model",
        },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("fetches models on mount", async () => {
        mockFetchImageModels.mockResolvedValueOnce(mockModels)

        const { result } = renderHook(() => useImageModels(), {
            wrapper: createWrapper(),
        })

        // Wait for loading to complete and data to be fetched
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Verify the fetch was called
        expect(mockFetchImageModels).toHaveBeenCalledTimes(1)

        // Wait for the mock data to be returned
        await waitFor(() => {
            expect(result.current.models.length).toBe(mockModels.length)
        })

        expect(result.current.models).toEqual(mockModels)
    })

    it("returns empty models when API fails", async () => {
        mockFetchImageModels.mockRejectedValueOnce(new Error("API Error"))

        const { result } = renderHook(() => useImageModels(), {
            wrapper: createWrapper(),
        })

        // Wait for error state (query completes with error)
        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        }, { timeout: 5000 })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.models).toEqual([])
    })

    it("finds model by name", async () => {
        mockFetchImageModels.mockResolvedValueOnce(mockModels)

        const { result } = renderHook(() => useImageModels(), {
            wrapper: createWrapper(),
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Wait for data to be the mocked models
        await waitFor(() => {
            expect(result.current.models).toEqual(mockModels)
        })

        expect(result.current.getModel("flux")).toEqual(mockModels[0])
    })

    it("finds model by alias", async () => {
        mockFetchImageModels.mockResolvedValueOnce(mockModels)

        const { result } = renderHook(() => useImageModels(), {
            wrapper: createWrapper(),
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Wait for data to be the mocked models
        await waitFor(() => {
            expect(result.current.models).toEqual(mockModels)
        })

        expect(result.current.getModel("fast")).toEqual(mockModels[1])
    })

    it("returns undefined for unknown model", async () => {
        mockFetchImageModels.mockResolvedValueOnce(mockModels)

        const { result } = renderHook(() => useImageModels(), {
            wrapper: createWrapper(),
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        await waitFor(() => {
            expect(result.current.models).toEqual(mockModels)
        })

        expect(result.current.getModel("unknown-model")).toBeUndefined()
    })

    it("respects enabled option", () => {
        const { result } = renderHook(() => useImageModels({ enabled: false }), {
            wrapper: createWrapper(),
        })

        expect(mockFetchImageModels).not.toHaveBeenCalled()
        expect(result.current.isLoading).toBe(false)
    })

    it("can refetch models", async () => {
        mockFetchImageModels.mockResolvedValueOnce(mockModels)

        const { result } = renderHook(() => useImageModels(), {
            wrapper: createWrapper(),
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        const updatedModels = [
            ...mockModels,
            {
                name: "new-model",
                aliases: [],
                pricing: { currency: "pollen" as const },
                description: "New model",
            },
        ]
        mockFetchImageModels.mockResolvedValueOnce(updatedModels)

        await result.current.refetch()

        await waitFor(() => {
            expect(result.current.models).toEqual(updatedModels)
        })
    })

    it("provides error state when fetch fails", async () => {
        const error = new Error("Network error")
        mockFetchImageModels.mockRejectedValueOnce(error)

        const { result } = renderHook(() => useImageModels(), {
            wrapper: createWrapper(),
        })

        // Wait for error state (query completes with error)
        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        }, { timeout: 5000 })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeTruthy()
    })
})
