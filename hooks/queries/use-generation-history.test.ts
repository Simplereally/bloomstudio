// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { useGenerationHistory } from "./use-generation-history"
import { queryKeys } from "@/lib/query"
import type { GeneratedImage } from "@/lib/schemas/pollinations.schema"

// Create a wrapper with QueryClientProvider for testing
function createWrapper(queryClient?: QueryClient) {
    const client = queryClient ?? new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client }, children)
    }
}

describe("useGenerationHistory", () => {
    const mockImages: GeneratedImage[] = [
        {
            id: "img_1",
            url: "https://example.com/image1.jpg",
            prompt: "A beautiful sunset",
            params: {
                prompt: "A beautiful sunset",
                width: 1024,
                height: 1024,
                model: "zimage",
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            },
            timestamp: Date.now(),
        },
        {
            id: "img_2",
            url: "https://example.com/image2.jpg",
            prompt: "A mountain landscape",
            params: {
                prompt: "A mountain landscape",
                width: 1024,
                height: 1024,
                model: "zimage",
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            },
            timestamp: Date.now() - 1000,
        },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("initializes with empty history", () => {
        const { result } = renderHook(() => useGenerationHistory(), {
            wrapper: createWrapper(),
        })

        expect(result.current.history).toEqual([])
        expect(result.current.count).toBe(0)
    })

    it("returns history from query cache", async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        })

        // Pre-populate the cache
        queryClient.setQueryData(queryKeys.images.history, mockImages)

        const { result } = renderHook(() => useGenerationHistory(), {
            wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
            expect(result.current.history).toEqual(mockImages)
        })

        expect(result.current.count).toBe(2)
    })

    it("getById returns correct image", async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        })

        queryClient.setQueryData(queryKeys.images.history, mockImages)

        const { result } = renderHook(() => useGenerationHistory(), {
            wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
            expect(result.current.history.length).toBe(2)
        })

        expect(result.current.getById("img_1")).toEqual(mockImages[0])
        expect(result.current.getById("img_2")).toEqual(mockImages[1])
        expect(result.current.getById("nonexistent")).toBeUndefined()
    })

    it("clear removes all history", async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        })

        queryClient.setQueryData(queryKeys.images.history, mockImages)

        const { result } = renderHook(() => useGenerationHistory(), {
            wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
            expect(result.current.count).toBe(2)
        })

        act(() => {
            result.current.clear()
        })

        await waitFor(() => {
            expect(result.current.count).toBe(0)
        })

        expect(result.current.history).toEqual([])
    })

    it("remove deletes specific image from history", async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        })

        queryClient.setQueryData(queryKeys.images.history, mockImages)

        const { result } = renderHook(() => useGenerationHistory(), {
            wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
            expect(result.current.count).toBe(2)
        })

        act(() => {
            result.current.remove("img_1")
        })

        await waitFor(() => {
            expect(result.current.count).toBe(1)
        })

        expect(result.current.history).toEqual([mockImages[1]])
        expect(result.current.getById("img_1")).toBeUndefined()
    })
})
