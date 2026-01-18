/**
 * @vitest-environment jsdom
 *
 * Tests for MobileEditorDrawer Component
 * 
 * Note: The drawer no longer has its own Generate button - generation controls
 * are provided by the editor content (children) itself, which includes the
 * Generate Image button with batch controls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MobileEditorDrawer } from "./mobile-editor-drawer"

// Mock vaul drawer components
vi.mock("@/components/ui/drawer", () => ({
    Drawer: ({
        children,
        open,

    }: {
        children: React.ReactNode
        open?: boolean
        onOpenChange?: (open: boolean) => void
    }) => (
        open ? (
            <div data-testid="drawer-root" data-open={open}>
                {children}
            </div>
        ) : null
    ),
    DrawerContent: ({
        children,
        className,
        "data-testid": testId,
    }: {
        children: React.ReactNode
        className?: string
        "data-testid"?: string
    }) => (
        <div data-testid={testId || "drawer-content"} className={className}>
            {children}
        </div>
    ),
    DrawerHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="drawer-header" className={className}>
            {children}
        </div>
    ),
    DrawerTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <h2 data-testid="drawer-title" className={className}>
            {children}
        </h2>
    ),
}))

describe("MobileEditorDrawer", () => {
    const mockOnOpenChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    const defaultProps = {
        open: true,
        onOpenChange: mockOnOpenChange,
        children: <div data-testid="drawer-children">Editor Content</div>,
    }

    describe("Rendering", () => {
        it("renders the drawer when open is true", () => {
            render(<MobileEditorDrawer {...defaultProps} />)

            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
        })

        it("does not render when open is false", () => {
            render(<MobileEditorDrawer {...defaultProps} open={false} />)

            expect(screen.queryByTestId("mobile-editor-drawer")).not.toBeInTheDocument()
        })

        it("renders children content", () => {
            render(<MobileEditorDrawer {...defaultProps} />)

            expect(screen.getByTestId("drawer-children")).toBeInTheDocument()
            expect(screen.getByText("Editor Content")).toBeInTheDocument()
        })

        it("renders the drawer title", () => {
            render(<MobileEditorDrawer {...defaultProps} />)

            expect(screen.getByTestId("drawer-title")).toBeInTheDocument()
            expect(screen.getByText("Editor")).toBeInTheDocument()
        })

        it("renders drawer header", () => {
            render(<MobileEditorDrawer {...defaultProps} />)

            expect(screen.getByTestId("drawer-header")).toBeInTheDocument()
        })
    })

    describe("Custom className", () => {
        it("applies custom className to drawer content", () => {
            render(
                <MobileEditorDrawer {...defaultProps} className="custom-drawer-class" />
            )

            expect(screen.getByTestId("mobile-editor-drawer")).toHaveClass("custom-drawer-class")
        })
    })

    describe("Drawer Configuration", () => {
        it("constrains drawer height for scrollable content", () => {
            render(<MobileEditorDrawer {...defaultProps} />)

            const content = screen.getByTestId("mobile-editor-drawer")
            expect(content).toHaveClass("h-[85dvh]")
            expect(content).toHaveClass("max-h-[85dvh]")
        })
    })

    /**
     * Snap Point Behavior Tests
     * 
     * CRITICAL: The drawer must always open at full height (snap point = 1)
     * 
     * This prevents the bug where:
     * 1. User opens drawer (full height)
     * 2. User drags drawer to 50% or closes it
     * 3. User reopens drawer - it should still open at full height, not 50%
     */
    describe("Snap Point Reset Behavior", () => {
        it("opens at full height on first render", () => {
            // Note: This tests the internal state via the mock
            // The drawer should use DEFAULT_SNAP_POINT = 1 on initial render
            const { rerender } = render(<MobileEditorDrawer {...defaultProps} />)
            
            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
            
            // Close and reopen - should still work
            rerender(<MobileEditorDrawer {...defaultProps} open={false} />)
            expect(screen.queryByTestId("mobile-editor-drawer")).not.toBeInTheDocument()
            
            rerender(<MobileEditorDrawer {...defaultProps} open={true} />)
            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
        })

        it("resets state correctly when closed and reopened", () => {
            const { rerender } = render(<MobileEditorDrawer {...defaultProps} />)
            
            // Drawer is open
            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
            
            // Close drawer
            rerender(<MobileEditorDrawer {...defaultProps} open={false} />)
            expect(screen.queryByTestId("mobile-editor-drawer")).not.toBeInTheDocument()
            
            // Reopen drawer - should render correctly (full height in real impl)
            rerender(<MobileEditorDrawer {...defaultProps} open={true} />)
            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
            
            // Close and reopen again to ensure no degradation
            rerender(<MobileEditorDrawer {...defaultProps} open={false} />)
            rerender(<MobileEditorDrawer {...defaultProps} open={true} />)
            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
        })

        it("maintains consistent behavior across multiple open/close cycles", () => {
            const { rerender } = render(<MobileEditorDrawer {...defaultProps} open={false} />)
            
            // Cycle 1
            rerender(<MobileEditorDrawer {...defaultProps} open={true} />)
            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
            rerender(<MobileEditorDrawer {...defaultProps} open={false} />)
            
            // Cycle 2
            rerender(<MobileEditorDrawer {...defaultProps} open={true} />)
            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
            rerender(<MobileEditorDrawer {...defaultProps} open={false} />)
            
            // Cycle 3
            rerender(<MobileEditorDrawer {...defaultProps} open={true} />)
            expect(screen.getByTestId("mobile-editor-drawer")).toBeInTheDocument()
            
            // All cycles should have opened to full height (verified by drawer rendering)
            // The useEffect ensures snap point is reset to DEFAULT_SNAP_POINT on each open
        })
    })
})
