/**
 * @vitest-environment jsdom
 * 
 * Tests for PromptHeaderControls Component
 * 
 * NOTE: This component now manages its own character count state internally
 * by subscribing to DOM events on the prompt input element. Tests must
 * provide a mock prompt input in the DOM for proper functionality.
 */
import { TooltipProvider } from "@/components/ui/tooltip"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PromptHeaderControls } from "./prompt-header-controls"
import { type PromptSectionAPI } from "./prompt-section"

describe("PromptHeaderControls", () => {
    const mockRef = {
        current: {
            getPrompt: vi.fn(),
            getNegativePrompt: vi.fn(),
            setPrompt: vi.fn(),
            setNegativePrompt: vi.fn(),
            focusPrompt: vi.fn(),
            getCharacterCount: vi.fn(),
            getMaxLength: vi.fn(),
            isHistoryOpen: vi.fn(),
            toggleHistory: vi.fn(),
        } as PromptSectionAPI
    }

    const defaultProps = {
        maxLength: 2000,
        hasHistory: true,
        promptSectionRef: mockRef,
    }

    // Create a mock prompt input element for the component to subscribe to
    let mockPromptInput: HTMLTextAreaElement | null = null

    beforeEach(() => {
        mockPromptInput = document.createElement('textarea')
        mockPromptInput.setAttribute('data-testid', 'prompt-input')
        mockPromptInput.value = ''
        document.body.appendChild(mockPromptInput)
    })

    afterEach(() => {
        if (mockPromptInput && document.body.contains(mockPromptInput)) {
            document.body.removeChild(mockPromptInput)
        }
        mockPromptInput = null
    })

    const renderWithTooltip = (ui: React.ReactElement) => {
        return render(<TooltipProvider>{ui}</TooltipProvider>)
    }

    it("renders character count and history toggle", async () => {
        // Set initial value before rendering
        if (mockPromptInput) {
            mockPromptInput.value = "test prompt with 100 chars".padEnd(100, "x")
        }

        renderWithTooltip(<PromptHeaderControls {...defaultProps} />)

        // Wait for the component to pick up the initial value
        await waitFor(() => {
            expect(screen.getByTestId("prompt-header-character-count")).toBeInTheDocument()
        })
        expect(screen.getByTestId("prompt-header-history-toggle")).toBeInTheDocument()
    })

    it("calls toggleHistory when history toggle is clicked", async () => {
        renderWithTooltip(<PromptHeaderControls {...defaultProps} />)

        const toggle = screen.getByTestId("prompt-header-history-toggle")
        await userEvent.click(toggle)

        expect(mockRef.current.toggleHistory).toHaveBeenCalled()
    })

    it("hides history toggle when hasHistory is false", () => {
        renderWithTooltip(<PromptHeaderControls {...defaultProps} hasHistory={false} />)

        expect(screen.queryByTestId("prompt-header-history-toggle")).not.toBeInTheDocument()
    })

    it("updates character count when input event fires", async () => {
        if (mockPromptInput) {
            mockPromptInput.value = ""
        }

        renderWithTooltip(<PromptHeaderControls {...defaultProps} />)

        // Wait for initial render
        await waitFor(() => {
            expect(screen.getByTestId("prompt-header-character-count")).toHaveTextContent("0/2000")
        })

        // Simulate typing
        if (mockPromptInput) {
            mockPromptInput.value = "Hello"
            // Wrap manual DOM event dispatch in act since it triggers React state updates
            // but doesn't go through React's event system or userEvent
            const { act } = await import("@testing-library/react")
            act(() => {
                mockPromptInput?.dispatchEvent(new Event('input', { bubbles: true }))
            })
        }

        await waitFor(() => {
            expect(screen.getByTestId("prompt-header-character-count")).toHaveTextContent("5/2000")
        })
    })

    it("applies destructive class when near character limit", async () => {
        if (mockPromptInput) {
            // Set value to 1900 chars (above 90% of 2000)
            mockPromptInput.value = "x".repeat(1900)
        }

        renderWithTooltip(<PromptHeaderControls {...defaultProps} />)

        // Wait for the component to pick up the value
        await waitFor(() => {
            expect(screen.getByTestId("prompt-header-character-count")).toHaveClass("text-destructive")
        })
    })
})
