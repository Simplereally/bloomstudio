/**
 * @vitest-environment jsdom
 *
 * Tests for MobileStudioNavigation Component
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MobileStudioNavigation } from "./mobile-studio-navigation"

describe("MobileStudioNavigation", () => {
    const mockOnOpenEditor = vi.fn()
    const mockOnOpenHistory = vi.fn()
    const mockOnGenerate = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    const defaultProps = {
        onOpenEditor: mockOnOpenEditor,
        onOpenHistory: mockOnOpenHistory,
        onGenerate: mockOnGenerate,
    }

    describe("Default Navigation Mode", () => {
        it("renders the navigation bar", () => {
            render(<MobileStudioNavigation {...defaultProps} />)

            expect(screen.getByTestId("mobile-studio-navigation")).toBeInTheDocument()
        })

        it("renders Editor button", () => {
            render(<MobileStudioNavigation {...defaultProps} />)

            expect(screen.getByRole("button", { name: /editor/i })).toBeInTheDocument()
        })

        it("renders History button", () => {
            render(<MobileStudioNavigation {...defaultProps} />)

            expect(screen.getByRole("button", { name: /history/i })).toBeInTheDocument()
        })

        it("renders Generate FAB", () => {
            render(<MobileStudioNavigation {...defaultProps} />)

            expect(screen.getByTestId("mobile-generate-fab")).toBeInTheDocument()
        })

        it("calls onOpenEditor when Editor button is clicked", () => {
            render(<MobileStudioNavigation {...defaultProps} />)

            fireEvent.click(screen.getByRole("button", { name: /editor/i }))
            expect(mockOnOpenEditor).toHaveBeenCalledTimes(1)
        })

        it("calls onOpenHistory when History button is clicked", () => {
            render(<MobileStudioNavigation {...defaultProps} />)

            fireEvent.click(screen.getByRole("button", { name: /history/i }))
            expect(mockOnOpenHistory).toHaveBeenCalledTimes(1)
        })

        it("calls onGenerate when Generate FAB is clicked", () => {
            render(<MobileStudioNavigation {...defaultProps} />)

            fireEvent.click(screen.getByTestId("mobile-generate-fab"))
            expect(mockOnGenerate).toHaveBeenCalledTimes(1)
        })

        it("shows active state on Editor when isEditorOpen is true", () => {
            render(<MobileStudioNavigation {...defaultProps} isEditorOpen={true} />)

            const editorButton = screen.getByRole("button", { name: /editor/i })
            expect(editorButton).toHaveClass("text-primary")
        })

        it("shows active state on History when isHistoryOpen is true", () => {
            render(<MobileStudioNavigation {...defaultProps} isHistoryOpen={true} />)

            const historyButton = screen.getByRole("button", { name: /history/i })
            expect(historyButton).toHaveClass("text-primary")
        })
    })

    describe("Generate FAB States", () => {
        it("disables Generate FAB when isGenerateDisabled is true", () => {
            render(<MobileStudioNavigation {...defaultProps} isGenerateDisabled={true} />)

            const fab = screen.getByTestId("mobile-generate-fab")
            expect(fab).toBeDisabled()
        })

        it("disables Generate FAB when isGenerating is true", () => {
            render(<MobileStudioNavigation {...defaultProps} isGenerating={true} />)

            const fab = screen.getByTestId("mobile-generate-fab")
            expect(fab).toBeDisabled()
        })

        it("shows pulse animation when isGenerating is true", () => {
            render(<MobileStudioNavigation {...defaultProps} isGenerating={true} />)

            const fab = screen.getByTestId("mobile-generate-fab")
            expect(fab).toHaveClass("animate-pulse")
        })

        it("does not call onGenerate when disabled", () => {
            render(<MobileStudioNavigation {...defaultProps} isGenerateDisabled={true} />)

            fireEvent.click(screen.getByTestId("mobile-generate-fab"))
            expect(mockOnGenerate).not.toHaveBeenCalled()
        })

        it("has correct aria-label when generating", () => {
            render(<MobileStudioNavigation {...defaultProps} isGenerating={true} />)

            const fab = screen.getByTestId("mobile-generate-fab")
            expect(fab).toHaveAttribute("aria-label", "Generating...")
        })

        it("has correct aria-label when not generating", () => {
            render(<MobileStudioNavigation {...defaultProps} isGenerating={false} />)

            const fab = screen.getByTestId("mobile-generate-fab")
            expect(fab).toHaveAttribute("aria-label", "Generate")
        })
    })

    describe("Selection Mode", () => {
        const selectionMode = {
            enabled: true,
            count: 3,
            onDelete: vi.fn(),
            onMakePublic: vi.fn(),
            onCancel: vi.fn(),
        }

        beforeEach(() => {
            selectionMode.onDelete.mockClear()
            selectionMode.onMakePublic.mockClear()
            selectionMode.onCancel.mockClear()
        })

        it("renders selection mode bar when selectionMode.enabled is true", () => {
            render(
                <MobileStudioNavigation {...defaultProps} selectionMode={selectionMode} />
            )

            expect(screen.getByTestId("selection-mode-bar")).toBeInTheDocument()
        })

        it("hides navigation buttons in selection mode", () => {
            render(
                <MobileStudioNavigation {...defaultProps} selectionMode={selectionMode} />
            )

            expect(screen.queryByRole("button", { name: /editor/i })).not.toBeInTheDocument()
            expect(screen.queryByRole("button", { name: /history/i })).not.toBeInTheDocument()
            expect(screen.queryByTestId("mobile-generate-fab")).not.toBeInTheDocument()
        })

        it("displays selected count", () => {
            render(
                <MobileStudioNavigation {...defaultProps} selectionMode={selectionMode} />
            )

            expect(screen.getByText("3 selected")).toBeInTheDocument()
        })

        it("calls onCancel when cancel button is clicked", () => {
            render(
                <MobileStudioNavigation {...defaultProps} selectionMode={selectionMode} />
            )

            const cancelButton = screen.getByRole("button", { name: /cancel/i })
            fireEvent.click(cancelButton)
            expect(selectionMode.onCancel).toHaveBeenCalledTimes(1)
        })

        it("calls onDelete when delete button is clicked", () => {
            render(
                <MobileStudioNavigation {...defaultProps} selectionMode={selectionMode} />
            )

            const deleteButton = screen.getByRole("button", { name: /delete/i })
            fireEvent.click(deleteButton)
            expect(selectionMode.onDelete).toHaveBeenCalledTimes(1)
        })

        it("calls onMakePublic when public button is clicked", () => {
            render(
                <MobileStudioNavigation {...defaultProps} selectionMode={selectionMode} />
            )

            const publicButton = screen.getByRole("button", { name: /public/i })
            fireEvent.click(publicButton)
            expect(selectionMode.onMakePublic).toHaveBeenCalledTimes(1)
        })

        it("disables action buttons when count is 0", () => {
            render(
                <MobileStudioNavigation
                    {...defaultProps}
                    selectionMode={{ ...selectionMode, count: 0 }}
                />
            )

            const deleteButton = screen.getByRole("button", { name: /delete/i })
            const publicButton = screen.getByRole("button", { name: /public/i })

            expect(deleteButton).toBeDisabled()
            expect(publicButton).toBeDisabled()
        })

        it("shows normal navigation when selectionMode.enabled is false", () => {
            render(
                <MobileStudioNavigation
                    {...defaultProps}
                    selectionMode={{ ...selectionMode, enabled: false }}
                />
            )

            expect(screen.queryByTestId("selection-mode-bar")).not.toBeInTheDocument()
            expect(screen.getByRole("button", { name: /editor/i })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: /history/i })).toBeInTheDocument()
            expect(screen.getByTestId("mobile-generate-fab")).toBeInTheDocument()
        })
    })

    describe("Accessibility", () => {
        it("has correct aria-label on navigation", () => {
            render(<MobileStudioNavigation {...defaultProps} />)

            expect(screen.getByRole("navigation")).toHaveAttribute(
                "aria-label",
                "Studio navigation"
            )
        })

        it("has accessible labels on all buttons", () => {
            render(<MobileStudioNavigation {...defaultProps} />)

            expect(screen.getByRole("button", { name: /editor/i })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: /history/i })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: /generate/i })).toBeInTheDocument()
        })
    })

    describe("Custom className", () => {
        it("applies custom className", () => {
            render(<MobileStudioNavigation {...defaultProps} className="custom-class" />)

            expect(screen.getByTestId("mobile-studio-navigation")).toHaveClass("custom-class")
        })
    })
})
