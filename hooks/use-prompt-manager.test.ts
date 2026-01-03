// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { usePromptManager } from "./use-prompt-manager"

// Mock useEnhancePrompt
vi.mock("@/hooks/queries", () => ({
    useEnhancePrompt: vi.fn(() => ({
        enhance: vi.fn(),
        cancel: vi.fn(),
        isEnhancing: false,
    })),
    useSuggestions: vi.fn(() => ({
        suggestions: [],
        isLoading: false,
        fetchSuggestions: vi.fn(),
    })),
}))

describe("usePromptManager", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("initializes with default values", () => {
        const { result } = renderHook(() => usePromptManager())

        expect(result.current.promptHistory).toEqual([])
        expect(result.current.suggestions).toEqual([])
        expect(result.current.isLoadingSuggestions).toBe(false)
        expect(result.current.isEnhancingPrompt).toBe(false)
        expect(result.current.isEnhancingNegativePrompt).toBe(false)
        expect(result.current.hasPromptContent).toBe(false)
    })

    it("provides a promptSectionRef", () => {
        const { result } = renderHook(() => usePromptManager())

        expect(result.current.promptSectionRef).toBeDefined()
        expect(result.current.promptSectionRef.current).toBeNull()
    })

    it("adds prompts to history without duplicates", () => {
        const { result } = renderHook(() => usePromptManager())

        act(() => {
            result.current.addToPromptHistory("First prompt")
        })

        expect(result.current.promptHistory).toEqual(["First prompt"])

        act(() => {
            result.current.addToPromptHistory("Second prompt")
        })

        expect(result.current.promptHistory).toEqual(["Second prompt", "First prompt"])

        // Adding duplicate should not change history
        act(() => {
            result.current.addToPromptHistory("First prompt")
        })

        expect(result.current.promptHistory).toEqual(["Second prompt", "First prompt"])
    })

    it("limits history to 10 items", () => {
        const { result } = renderHook(() => usePromptManager())

        // Add 12 unique prompts
        for (let i = 1; i <= 12; i++) {
            act(() => {
                result.current.addToPromptHistory(`Prompt ${i}`)
            })
        }

        expect(result.current.promptHistory.length).toBe(10)
        expect(result.current.promptHistory[0]).toBe("Prompt 12")
        expect(result.current.promptHistory[9]).toBe("Prompt 3")
    })

    it("handles prompt content change", () => {
        const { result } = renderHook(() => usePromptManager())

        expect(result.current.hasPromptContent).toBe(false)

        act(() => {
            result.current.handlePromptContentChange(true)
        })

        expect(result.current.hasPromptContent).toBe(true)

        act(() => {
            result.current.handlePromptContentChange(false)
        })

        expect(result.current.hasPromptContent).toBe(false)
    })

    it("setHasPromptContent updates state", () => {
        const { result } = renderHook(() => usePromptManager())

        act(() => {
            result.current.setHasPromptContent(true)
        })

        expect(result.current.hasPromptContent).toBe(true)
    })

    it("handleSelectHistory updates content state", () => {
        const { result } = renderHook(() => usePromptManager())

        act(() => {
            result.current.handleSelectHistory("A beautiful landscape")
        })

        expect(result.current.hasPromptContent).toBe(true)
    })

    it("handleSelectHistory with empty string sets hasPromptContent to false", () => {
        const { result } = renderHook(() => usePromptManager())

        // First set to true
        act(() => {
            result.current.handleSelectHistory("Something")
        })
        expect(result.current.hasPromptContent).toBe(true)

        // Then set to empty
        act(() => {
            result.current.handleSelectHistory("")
        })

        expect(result.current.hasPromptContent).toBe(false)
    })

    it("getPromptValues returns trimmed values when ref is null", () => {
        const { result } = renderHook(() => usePromptManager())

        const values = result.current.getPromptValues()

        expect(values).toEqual({ prompt: "", negativePrompt: "" })
    })

    it("exposes enhancePrompt callback", () => {
        const { result } = renderHook(() => usePromptManager())

        expect(typeof result.current.enhancePrompt).toBe("function")
    })

    it("exposes cancelEnhancePrompt callback", () => {
        const { result } = renderHook(() => usePromptManager())

        expect(typeof result.current.cancelEnhancePrompt).toBe("function")
    })

    it("exposes enhanceNegativePrompt callback", () => {
        const { result } = renderHook(() => usePromptManager())

        expect(typeof result.current.enhanceNegativePrompt).toBe("function")
    })

    it("exposes cancelEnhanceNegativePrompt callback", () => {
        const { result } = renderHook(() => usePromptManager())

        expect(typeof result.current.cancelEnhanceNegativePrompt).toBe("function")
    })

    it("exposes fetchSuggestions callback", () => {
        const { result } = renderHook(() => usePromptManager())

        expect(typeof result.current.fetchSuggestions).toBe("function")
    })
})
