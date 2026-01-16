/**
 * @vitest-environment jsdom
 *
 * Tests for usePromptInput Hook
 */
import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePromptInput } from "./use-prompt-input"

describe("usePromptInput", () => {
    it("should initialize with empty values", () => {
        const { result } = renderHook(() => usePromptInput())
        expect(result.current.getPrompt()).toBe("")
        expect(result.current.getNegativePrompt()).toBe("")
    })

    it("should set and get prompt value", () => {
        const { result } = renderHook(() => usePromptInput())

        act(() => {
            result.current.setPrompt("A beautiful sunset")
        })

        expect(result.current.getPrompt()).toBe("A beautiful sunset")
    })

    it("should set and get negative prompt value", () => {
        const { result } = renderHook(() => usePromptInput())

        act(() => {
            result.current.setNegativePrompt("blurry, low quality")
        })

        expect(result.current.getNegativePrompt()).toBe("blurry, low quality")
    })

    it("should update DOM element value when promptRef is attached", () => {
        const { result } = renderHook(() => usePromptInput())

        const textarea = document.createElement("textarea")
        result.current.promptRef.current = textarea

        act(() => {
            result.current.setPrompt("New prompt content")
        })

        expect(textarea.value).toBe("New prompt content")
        expect(result.current.getPrompt()).toBe("New prompt content")
    })

    it("should prefer DOM value over internal ref if available", () => {
        const { result } = renderHook(() => usePromptInput())

        const textarea = document.createElement("textarea")
        result.current.promptRef.current = textarea
        textarea.value = "Direct DOM change"

        expect(result.current.getPrompt()).toBe("Direct DOM change")
    })

    it("should handle subscribers for prompt changes", () => {
        const { result } = renderHook(() => usePromptInput())
        const callback = vi.fn()

        act(() => {
            result.current.subscribeToPrompt(callback)
        })

        act(() => {
            result.current.setPrompt("Updated prompt")
        })

        expect(callback).toHaveBeenCalledWith("Updated prompt")
    })

    it("should allow unsubscribing from prompt changes", () => {
        const { result } = renderHook(() => usePromptInput())
        const callback = vi.fn()

        let unsubscribe: () => void
        act(() => {
            unsubscribe = result.current.subscribeToPrompt(callback)
        })

        act(() => {
            unsubscribe()
        })

        act(() => {
            result.current.setPrompt("Another update")
        })

        expect(callback).not.toHaveBeenCalledWith("Another update")
    })

    it("should handle subscribers for negative prompt changes", () => {
        const { result } = renderHook(() => usePromptInput())
        const callback = vi.fn()

        act(() => {
            result.current.subscribeToNegativePrompt(callback)
        })

        act(() => {
            result.current.setNegativePrompt("blurry, distorted")
        })

        expect(callback).toHaveBeenCalledWith("blurry, distorted")
    })

    it("should allow unsubscribing from negative prompt changes", () => {
        const { result } = renderHook(() => usePromptInput())
        const callback = vi.fn()

        let unsubscribe: () => void
        act(() => {
            unsubscribe = result.current.subscribeToNegativePrompt(callback)
        })

        act(() => {
            unsubscribe()
        })

        act(() => {
            result.current.setNegativePrompt("low quality")
        })

        expect(callback).not.toHaveBeenCalledWith("low quality")
    })

    it("should update negative prompt DOM element value when negativePromptRef is attached", () => {
        const { result } = renderHook(() => usePromptInput())

        const textarea = document.createElement("textarea")
        result.current.negativePromptRef.current = textarea

        act(() => {
            result.current.setNegativePrompt("ugly, blurry")
        })

        expect(textarea.value).toBe("ugly, blurry")
        expect(result.current.getNegativePrompt()).toBe("ugly, blurry")
    })

    it("should prefer negative prompt DOM value over internal ref if available", () => {
        const { result } = renderHook(() => usePromptInput())

        const textarea = document.createElement("textarea")
        result.current.negativePromptRef.current = textarea
        textarea.value = "Direct negative DOM change"

        expect(result.current.getNegativePrompt()).toBe("Direct negative DOM change")
    })
})
