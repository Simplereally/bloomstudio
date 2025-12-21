import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PromptComposer } from "./prompt-composer"

describe("PromptComposer", () => {
    const defaultProps = {
        prompt: "",
        onPromptChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the prompt input", () => {
        render(<PromptComposer {...defaultProps} />)

        expect(screen.getByTestId("prompt-composer")).toBeInTheDocument()
        expect(screen.getByTestId("prompt-input")).toBeInTheDocument()
    })

    it("displays the current prompt value", () => {
        render(<PromptComposer {...defaultProps} prompt="A beautiful sunset" />)

        const input = screen.getByTestId("prompt-input")
        expect(input).toHaveValue("A beautiful sunset")
    })

    it("calls onPromptChange when typing", async () => {
        const onPromptChange = vi.fn()
        render(<PromptComposer {...defaultProps} onPromptChange={onPromptChange} />)

        const input = screen.getByTestId("prompt-input")
        await userEvent.type(input, "Hello")

        expect(onPromptChange).toHaveBeenCalled()
    })

    it("shows character count", () => {
        render(<PromptComposer {...defaultProps} prompt="Test prompt" maxLength={100} />)

        expect(screen.getByTestId("character-count")).toHaveTextContent("11/100")
    })

    it("shows clear button when prompt has content", () => {
        render(<PromptComposer {...defaultProps} prompt="Some text" />)

        expect(screen.getByTestId("clear-prompt")).toBeInTheDocument()
    })

    it("hides clear button when prompt is empty", () => {
        render(<PromptComposer {...defaultProps} prompt="" />)

        expect(screen.queryByTestId("clear-prompt")).not.toBeInTheDocument()
    })

    it("clears prompt when clear button is clicked", async () => {
        const onPromptChange = vi.fn()
        render(
            <PromptComposer
                {...defaultProps}
                prompt="Some text"
                onPromptChange={onPromptChange}
            />
        )

        await userEvent.click(screen.getByTestId("clear-prompt"))
        expect(onPromptChange).toHaveBeenCalledWith("")
    })

    it("disables input when generating", () => {
        render(<PromptComposer {...defaultProps} isGenerating={true} />)

        expect(screen.getByTestId("prompt-input")).toBeDisabled()
    })

    it("shows history toggle when history is provided", () => {
        render(
            <PromptComposer
                {...defaultProps}
                promptHistory={["Previous prompt 1", "Previous prompt 2"]}
            />
        )

        expect(screen.getByTestId("history-toggle")).toBeInTheDocument()
    })

    it("shows history dropdown when toggle is clicked", async () => {
        render(
            <PromptComposer
                {...defaultProps}
                promptHistory={["Previous prompt 1"]}
            />
        )

        await userEvent.click(screen.getByTestId("history-toggle"))
        expect(screen.getByTestId("prompt-history")).toBeInTheDocument()
    })

    it("renders suggestions when provided", () => {
        render(
            <PromptComposer
                {...defaultProps}
                suggestions={["cinematic", "4k", "detailed"]}
            />
        )

        expect(screen.getByTestId("suggestions")).toBeInTheDocument()
        expect(screen.getByText("+ cinematic")).toBeInTheDocument()
    })

    it("shows negative prompt toggle when handler is provided", () => {
        render(
            <PromptComposer
                {...defaultProps}
                onNegativePromptChange={vi.fn()}
            />
        )

        expect(screen.getByTestId("negative-prompt-toggle")).toBeInTheDocument()
    })

    it("expands negative prompt section when toggle is clicked", async () => {
        render(
            <PromptComposer
                {...defaultProps}
                onNegativePromptChange={vi.fn()}
            />
        )

        await userEvent.click(screen.getByTestId("negative-prompt-toggle"))
        expect(screen.getByTestId("negative-prompt-input")).toBeInTheDocument()
    })

    it("applies custom className", () => {
        render(<PromptComposer {...defaultProps} className="custom-class" />)

        expect(screen.getByTestId("prompt-composer")).toHaveClass("custom-class")
    })
})
