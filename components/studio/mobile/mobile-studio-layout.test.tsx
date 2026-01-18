/**
 * @vitest-environment jsdom
 *
 * Tests for MobileStudioLayout Component
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MobileStudioLayout } from "./mobile-studio-layout"

// Mock child components
vi.mock("./mobile-studio-navigation", () => ({
    MobileStudioNavigation: ({
        onOpenEditor,
        onOpenHistory,
        onGenerate,
        isGenerating,
        isGenerateDisabled,
        isEditorOpen,
        isHistoryOpen,
        selectionMode,
    }: {
        onOpenEditor: () => void
        onOpenHistory: () => void
        onGenerate: () => void
        isGenerating?: boolean
        isGenerateDisabled?: boolean
        isEditorOpen?: boolean
        isHistoryOpen?: boolean
        selectionMode?: {
            enabled: boolean
            count: number
            onDelete: () => void
            onMakePublic: () => void
            onCancel: () => void
        }
    }) => (
        <nav data-testid="mobile-studio-navigation">
            <button data-testid="nav-editor" onClick={onOpenEditor}>Editor</button>
            <button
                data-testid="nav-generate"
                onClick={onGenerate}
                disabled={isGenerateDisabled || isGenerating}
                data-generating={isGenerating}
            >
                Generate
            </button>
            <button data-testid="nav-history" onClick={onOpenHistory}>History</button>
            <span data-testid="nav-editor-open">{String(isEditorOpen)}</span>
            <span data-testid="nav-history-open">{String(isHistoryOpen)}</span>
            {selectionMode?.enabled && (
                <div data-testid="nav-selection-mode">
                    <span>{selectionMode.count}</span>
                    <button data-testid="nav-selection-delete" onClick={selectionMode.onDelete}>Delete</button>
                    <button data-testid="nav-selection-public" onClick={selectionMode.onMakePublic}>Public</button>
                    <button data-testid="nav-selection-cancel" onClick={selectionMode.onCancel}>Cancel</button>
                </div>
            )}
        </nav>
    ),
}))

vi.mock("./mobile-editor-drawer", () => ({
    MobileEditorDrawer: ({
        open,
        onOpenChange,
        children,
    }: {
        open: boolean
        onOpenChange: (open: boolean) => void
        children: React.ReactNode
    }) => (
        open ? (
            <div data-testid="mobile-editor-drawer">
                <button data-testid="drawer-close" onClick={() => onOpenChange(false)}>Close</button>
                <div data-testid="drawer-content">{children}</div>
            </div>
        ) : null
    ),
}))

vi.mock("./mobile-history-drawer", () => ({
    MobileHistoryDrawer: ({
        open,
        onOpenChange,
        children,
    }: {
        open: boolean
        onOpenChange: (open: boolean) => void
        children: React.ReactNode
    }) => (
        open ? (
            <div data-testid="mobile-history-drawer">
                <button data-testid="drawer-close-history" onClick={() => onOpenChange(false)}>Close</button>
                <div data-testid="drawer-content-history">{children}</div>
            </div>
        ) : null
    ),
}))

describe("MobileStudioLayout", () => {
    const mockOnEditorOpenChange = vi.fn()
    const mockOnHistoryOpenChange = vi.fn()
    const mockOnGenerate = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    const defaultProps = {
        canvas: <div data-testid="canvas-content">Canvas</div>,
        editorContent: <div data-testid="editor-content">Editor Controls</div>,
        historyContent: <div data-testid="history-content">Image History</div>,
        isEditorOpen: false,
        onEditorOpenChange: mockOnEditorOpenChange,
        isHistoryOpen: false,
        onHistoryOpenChange: mockOnHistoryOpenChange,
        onGenerate: mockOnGenerate,
    }

    describe("Rendering", () => {
        it("renders the layout container", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            expect(screen.getByTestId("mobile-studio-layout")).toBeInTheDocument()
        })

        it("renders the canvas container", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            expect(screen.getByTestId("mobile-canvas-container")).toBeInTheDocument()
        })

        it("renders canvas content", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            expect(screen.getByTestId("canvas-content")).toBeInTheDocument()
            expect(screen.getByText("Canvas")).toBeInTheDocument()
        })

        it("renders the bottom navigation", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            expect(screen.getByTestId("mobile-studio-navigation")).toBeInTheDocument()
        })

        it("applies custom className", () => {
            render(<MobileStudioLayout {...defaultProps} className="custom-layout" />)

            expect(screen.getByTestId("mobile-studio-layout")).toHaveClass("custom-layout")
        })

        it("applies dvh height class for iOS compatibility", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            expect(screen.getByTestId("mobile-studio-layout")).toHaveClass("h-[100dvh]")
        })
    })

    describe("Editor Drawer", () => {
        it("does not render editor drawer when closed", () => {
            render(<MobileStudioLayout {...defaultProps} isEditorOpen={false} />)

            expect(screen.queryByTestId("mobile-editor-drawer")).not.toBeInTheDocument()
        })

        it("renders editor drawer when open", () => {
            render(<MobileStudioLayout {...defaultProps} isEditorOpen={true} />)

            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
        })

        it("renders editor content inside drawer", () => {
            render(<MobileStudioLayout {...defaultProps} isEditorOpen={true} />)

            expect(screen.getByTestId("editor-content")).toBeInTheDocument()
            expect(screen.getByText("Editor Controls")).toBeInTheDocument()
        })

        it("opens editor when Editor nav button is clicked", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            fireEvent.click(screen.getByTestId("nav-editor"))
            expect(mockOnEditorOpenChange).toHaveBeenCalledWith(true)
        })

        it("closes editor drawer via callback", () => {
            render(<MobileStudioLayout {...defaultProps} isEditorOpen={true} />)

            fireEvent.click(screen.getByTestId("drawer-close"))
            expect(mockOnEditorOpenChange).toHaveBeenCalledWith(false)
        })
    })

    describe("History Drawer", () => {
        it("does not render history drawer when closed", () => {
            render(<MobileStudioLayout {...defaultProps} isHistoryOpen={false} />)

            expect(screen.queryByTestId("mobile-history-drawer")).not.toBeInTheDocument()
        })

        it("renders history drawer when open", () => {
            render(<MobileStudioLayout {...defaultProps} isHistoryOpen={true} />)

            expect(screen.getByTestId("mobile-history-drawer")).toBeInTheDocument()
        })

        it("renders history content inside drawer", () => {
            render(<MobileStudioLayout {...defaultProps} isHistoryOpen={true} />)

            expect(screen.getByTestId("history-content")).toBeInTheDocument()
            expect(screen.getByText("Image History")).toBeInTheDocument()
        })

        it("opens history when History nav button is clicked", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            fireEvent.click(screen.getByTestId("nav-history"))
            expect(mockOnHistoryOpenChange).toHaveBeenCalledWith(true)
        })

        it("closes history drawer via callback", () => {
            render(<MobileStudioLayout {...defaultProps} isHistoryOpen={true} />)

            fireEvent.click(screen.getByTestId("drawer-close-history"))
            expect(mockOnHistoryOpenChange).toHaveBeenCalledWith(false)
        })
    })

    describe("Generate Functionality", () => {
        it("calls onGenerate when nav generate button is clicked", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            fireEvent.click(screen.getByTestId("nav-generate"))
            expect(mockOnGenerate).toHaveBeenCalledTimes(1)
        })

        it("closes editor drawer when generating from nav", () => {
            render(<MobileStudioLayout {...defaultProps} isEditorOpen={true} />)

            fireEvent.click(screen.getByTestId("nav-generate"))
            expect(mockOnEditorOpenChange).toHaveBeenCalledWith(false)
            expect(mockOnGenerate).toHaveBeenCalledTimes(1)
        })

        it("disables generate when isGenerateDisabled is true", () => {
            render(<MobileStudioLayout {...defaultProps} isGenerateDisabled={true} />)

            expect(screen.getByTestId("nav-generate")).toBeDisabled()
        })

        it("disables generate when isGenerating is true", () => {
            render(<MobileStudioLayout {...defaultProps} isGenerating={true} />)

            expect(screen.getByTestId("nav-generate")).toBeDisabled()
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

        it("passes selection mode to navigation", () => {
            render(
                <MobileStudioLayout {...defaultProps} selectionMode={selectionMode} />
            )

            expect(screen.getByTestId("nav-selection-mode")).toBeInTheDocument()
        })

        it("displays selection count", () => {
            render(
                <MobileStudioLayout {...defaultProps} selectionMode={selectionMode} />
            )

            expect(screen.getByText("3")).toBeInTheDocument()
        })

        it("calls onDelete when delete is clicked", () => {
            render(
                <MobileStudioLayout {...defaultProps} selectionMode={selectionMode} />
            )

            fireEvent.click(screen.getByTestId("nav-selection-delete"))
            expect(selectionMode.onDelete).toHaveBeenCalledTimes(1)
        })

        it("calls onMakePublic when public is clicked", () => {
            render(
                <MobileStudioLayout {...defaultProps} selectionMode={selectionMode} />
            )

            fireEvent.click(screen.getByTestId("nav-selection-public"))
            expect(selectionMode.onMakePublic).toHaveBeenCalledTimes(1)
        })

        it("calls onCancel when cancel is clicked", () => {
            render(
                <MobileStudioLayout {...defaultProps} selectionMode={selectionMode} />
            )

            fireEvent.click(screen.getByTestId("nav-selection-cancel"))
            expect(selectionMode.onCancel).toHaveBeenCalledTimes(1)
        })
    })

    describe("State Propagation", () => {
        it("passes isEditorOpen to navigation", () => {
            render(<MobileStudioLayout {...defaultProps} isEditorOpen={true} />)

            expect(screen.getByTestId("nav-editor-open")).toHaveTextContent("true")
        })

        it("passes isHistoryOpen to navigation", () => {
            render(<MobileStudioLayout {...defaultProps} isHistoryOpen={true} />)

            expect(screen.getByTestId("nav-history-open")).toHaveTextContent("true")
        })

        it("passes isGenerating to navigation", () => {
            render(<MobileStudioLayout {...defaultProps} isGenerating={true} />)

            expect(screen.getByTestId("nav-generate")).toHaveAttribute("data-generating", "true")
        })
    })

    describe("Layout Structure", () => {
        it("renders main element for canvas", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            expect(screen.getByTestId("mobile-canvas-container").tagName).toBe("MAIN")
        })

        it("canvas container has flex-1 to fill space", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            expect(screen.getByTestId("mobile-canvas-container")).toHaveClass("flex-1")
        })

        it("canvas container has bottom padding for nav bar", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            expect(screen.getByTestId("mobile-canvas-container")).toHaveClass("pb-16")
        })

        it("layout prevents overflow", () => {
            render(<MobileStudioLayout {...defaultProps} />)

            expect(screen.getByTestId("mobile-studio-layout")).toHaveClass("overflow-hidden")
        })
    })
})
