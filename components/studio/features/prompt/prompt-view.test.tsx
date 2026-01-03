// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { PromptView, type PromptViewProps } from "./prompt-view"
import * as React from "react"

// Mock the studio components
vi.mock("@/components/studio", () => ({
    CollapsibleSection: ({ children, title, testId, rightContent }: { 
        children: React.ReactNode; 
        title: string; 
        testId: string;
        rightContent?: React.ReactNode;
    }) => (
        <div data-testid={testId}>
            <div>{title}</div>
            {rightContent}
            {children}
        </div>
    ),
    PromptSection: ({ isGenerating, showNegativePrompt, promptHistory }: {
        isGenerating: boolean;
        showNegativePrompt: boolean;
        promptHistory: string[];
    }) => (
        <div data-testid="prompt-section-content">
            <span data-testid="is-generating">{String(isGenerating)}</span>
            <span data-testid="show-negative">{String(showNegativePrompt)}</span>
            <span data-testid="history-count">{promptHistory.length}</span>
        </div>
    ),
    PromptHeaderControls: ({ maxLength, hasHistory }: { maxLength: number; hasHistory: boolean }) => (
        <div data-testid="prompt-header-controls">
            <span data-testid="max-length">{maxLength}</span>
            <span data-testid="has-history">{String(hasHistory)}</span>
        </div>
    ),
}))

vi.mock("@/components/ui/separator", () => ({
    Separator: () => <hr data-testid="separator" />,
}))

describe("PromptView", () => {
    const defaultProps: PromptViewProps = {
        apiRef: { current: null },
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the prompt section", () => {
        render(<PromptView {...defaultProps} />)

        expect(screen.getByTestId("prompt-section")).toBeInTheDocument()
    })

    it("renders with default props", () => {
        render(<PromptView {...defaultProps} />)

        expect(screen.getByTestId("is-generating")).toHaveTextContent("false")
        expect(screen.getByTestId("show-negative")).toHaveTextContent("true")
        expect(screen.getByTestId("history-count")).toHaveTextContent("0")
    })

    it("passes isGenerating prop to PromptSection", () => {
        render(<PromptView {...defaultProps} isGenerating={true} />)

        expect(screen.getByTestId("is-generating")).toHaveTextContent("true")
    })

    it("passes showNegativePrompt prop to PromptSection", () => {
        render(<PromptView {...defaultProps} showNegativePrompt={false} />)

        expect(screen.getByTestId("show-negative")).toHaveTextContent("false")
    })

    it("passes promptHistory to PromptSection", () => {
        const history = ["prompt 1", "prompt 2", "prompt 3"]
        render(<PromptView {...defaultProps} promptHistory={history} />)

        expect(screen.getByTestId("history-count")).toHaveTextContent("3")
    })

    it("renders PromptHeaderControls with correct maxLength", () => {
        render(<PromptView {...defaultProps} />)

        expect(screen.getByTestId("max-length")).toHaveTextContent("2000")
    })

    it("shows hasHistory true when history exists", () => {
        render(<PromptView {...defaultProps} promptHistory={["test prompt"]} />)

        expect(screen.getByTestId("has-history")).toHaveTextContent("true")
    })

    it("shows hasHistory false when history is empty", () => {
        render(<PromptView {...defaultProps} promptHistory={[]} />)

        expect(screen.getByTestId("has-history")).toHaveTextContent("false")
    })

    it("renders separator", () => {
        render(<PromptView {...defaultProps} />)

        expect(screen.getByTestId("separator")).toBeInTheDocument()
    })
})
