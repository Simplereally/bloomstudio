import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { StudioLayout } from "./studio-layout"

interface MockPanelGroupProps {
    children?: React.ReactNode
    className?: string
    "data-testid"?: string
}

interface MockPanelProps {
    children?: React.ReactNode
    "data-testid"?: string
}

interface MockHandleProps {
    "data-testid"?: string
}

// Mock the resizable components to avoid complex DOM interactions in tests
// Filter out all non-DOM props to prevent React warnings
vi.mock("@/components/ui/resizable", () => ({
    ResizablePanelGroup: ({ children, className, "data-testid": testId }: MockPanelGroupProps) => (
        <div data-testid={testId ?? "studio-layout"} className={className}>
            {children}
        </div>
    ),
    ResizablePanel: ({ children, "data-testid": testId }: MockPanelProps) => (
        <div data-testid={testId}>
            {children}
        </div>
    ),
    ResizableHandle: ({ "data-testid": testId }: MockHandleProps) => (
        <div data-testid={testId} />
    ),
}))

describe("StudioLayout", () => {
    const mockSidebar = <div data-testid="sidebar-content">Sidebar</div>
    const mockCanvas = <div data-testid="canvas-content">Canvas</div>
    const mockGallery = <div data-testid="gallery-content">Gallery</div>

    it("renders all three panels when gallery is shown", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                gallery={mockGallery}
                showGallery={true}
            />
        )

        expect(screen.getByTestId("sidebar-content")).toBeInTheDocument()
        expect(screen.getByTestId("canvas-content")).toBeInTheDocument()
        expect(screen.getByTestId("gallery-content")).toBeInTheDocument()
    })

    it("renders only sidebar and canvas when gallery is hidden", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                gallery={mockGallery}
                showGallery={false}
            />
        )

        expect(screen.getByTestId("sidebar-content")).toBeInTheDocument()
        expect(screen.getByTestId("canvas-content")).toBeInTheDocument()
        expect(screen.queryByTestId("gallery-content")).not.toBeInTheDocument()
    })

    it("renders without gallery when gallery prop is not provided", () => {
        render(<StudioLayout sidebar={mockSidebar} canvas={mockCanvas} />)

        expect(screen.getByTestId("sidebar-content")).toBeInTheDocument()
        expect(screen.getByTestId("canvas-content")).toBeInTheDocument()
    })

    it("applies custom className", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                className="custom-class"
            />
        )

        const layout = screen.getByTestId("studio-layout")
        expect(layout).toHaveClass("custom-class")
    })

    it("renders resize handles when gallery is shown", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                gallery={mockGallery}
                showGallery={true}
            />
        )

        expect(screen.getByTestId("sidebar-handle")).toBeInTheDocument()
        expect(screen.getByTestId("gallery-handle")).toBeInTheDocument()
    })

    it("renders only sidebar handle when gallery is hidden", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                showGallery={false}
            />
        )

        expect(screen.getByTestId("sidebar-handle")).toBeInTheDocument()
        expect(screen.queryByTestId("gallery-handle")).not.toBeInTheDocument()
    })
})
