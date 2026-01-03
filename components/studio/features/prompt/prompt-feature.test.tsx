// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { PromptFeature, PromptManagerContext, usePromptManagerContext } from "./prompt-feature"
import * as React from "react"

// Mock PromptView
vi.mock("./prompt-view", () => ({
    PromptView: ({ isGenerating, showNegativePrompt, promptHistory, suggestions }: {
        isGenerating: boolean;
        showNegativePrompt: boolean;
        promptHistory: string[];
        suggestions: string[];
    }) => (
        <div data-testid="prompt-view">
            <span data-testid="is-generating">{String(isGenerating)}</span>
            <span data-testid="show-negative">{String(showNegativePrompt)}</span>
            <span data-testid="history-count">{promptHistory.length}</span>
            <span data-testid="suggestions-count">{suggestions.length}</span>
        </div>
    ),
}))

// Mock usePromptManager
const mockPromptManager = {
    promptSectionRef: { current: null },
    promptHistory: ["history1", "history2"],
    addToPromptHistory: vi.fn(),
    suggestions: ["suggestion1"],
    isLoadingSuggestions: false,
    fetchSuggestions: vi.fn(),
    isEnhancingPrompt: false,
    enhancePrompt: vi.fn(),
    cancelEnhancePrompt: vi.fn(),
    isEnhancingNegativePrompt: false,
    enhanceNegativePrompt: vi.fn(),
    cancelEnhanceNegativePrompt: vi.fn(),
    handlePromptContentChange: vi.fn(),
    handleSelectHistory: vi.fn(),
    hasPromptContent: false,
    setHasPromptContent: vi.fn(),
    getPromptValues: vi.fn(() => ({ prompt: "", negativePrompt: "" })),
}

vi.mock("@/hooks/use-prompt-manager", () => ({
    usePromptManager: () => mockPromptManager,
}))

describe("PromptFeature", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("standalone mode (no context provided)", () => {
        it("renders PromptView", () => {
            render(<PromptFeature />)

            expect(screen.getByTestId("prompt-view")).toBeInTheDocument()
        })

        it("passes isGenerating prop to PromptView", () => {
            render(<PromptFeature isGenerating={true} />)

            expect(screen.getByTestId("is-generating")).toHaveTextContent("true")
        })

        it("defaults isGenerating to false", () => {
            render(<PromptFeature />)

            expect(screen.getByTestId("is-generating")).toHaveTextContent("false")
        })

        it("passes showNegativePrompt prop to PromptView", () => {
            render(<PromptFeature showNegativePrompt={false} />)

            expect(screen.getByTestId("show-negative")).toHaveTextContent("false")
        })

        it("defaults showNegativePrompt to true", () => {
            render(<PromptFeature />)

            expect(screen.getByTestId("show-negative")).toHaveTextContent("true")
        })

        it("passes promptHistory from hook to PromptView", () => {
            render(<PromptFeature />)

            expect(screen.getByTestId("history-count")).toHaveTextContent("2")
        })

        it("passes suggestions from hook to PromptView", () => {
            render(<PromptFeature />)

            expect(screen.getByTestId("suggestions-count")).toHaveTextContent("1")
        })
    })

    describe("integrated mode (context provided by parent)", () => {
        const customPromptManager = {
            ...mockPromptManager,
            promptHistory: ["custom1", "custom2", "custom3"],
            suggestions: ["customSuggestion1", "customSuggestion2"],
        }

        it("uses provided context instead of creating own state", () => {
            render(
                <PromptManagerContext.Provider value={customPromptManager}>
                    <PromptFeature />
                </PromptManagerContext.Provider>
            )

            // Should use the custom prompt manager's values
            expect(screen.getByTestId("history-count")).toHaveTextContent("3")
            expect(screen.getByTestId("suggestions-count")).toHaveTextContent("2")
        })

        it("passes props correctly in integrated mode", () => {
            render(
                <PromptManagerContext.Provider value={customPromptManager}>
                    <PromptFeature isGenerating={true} showNegativePrompt={false} />
                </PromptManagerContext.Provider>
            )

            expect(screen.getByTestId("is-generating")).toHaveTextContent("true")
            expect(screen.getByTestId("show-negative")).toHaveTextContent("false")
        })
    })
})

describe("usePromptManagerContext", () => {
    it("throws error when used outside PromptFeature", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

        const TestComponent = () => {
            usePromptManagerContext()
            return null
        }

        expect(() => render(<TestComponent />)).toThrow(
            "usePromptManagerContext must be used within PromptFeature"
        )

        consoleError.mockRestore()
    })

    it("returns context value when used within provider", () => {
        let contextValue: ReturnType<typeof usePromptManagerContext> | null = null

        const ConsumerComponent = () => {
            contextValue = usePromptManagerContext()
            return <div>consumed</div>
        }

        render(
            <PromptManagerContext.Provider value={mockPromptManager}>
                <ConsumerComponent />
            </PromptManagerContext.Provider>
        )

        expect(contextValue).toBe(mockPromptManager)
    })
})
