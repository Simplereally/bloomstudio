import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { StudioLayout } from "./studio-layout"

// Mock the resizable components to avoid complex DOM interactions in tests
vi.mock("@/components/ui/resizable", () => ({
    ResizablePanelGroup: ({ children, className, orientation: _o, ...props }: any) => (
        <div data-testid="studio-layout" className={className} {...props}>
            {children}
        </div>
    ),
    ResizablePanel: ({ children, panelRef: _pRef, collapsible: _c, collapsedSize: _cs, defaultSize: _ds, minSize: _min, maxSize: _max, ...props }: any) => (
        <div data-testid={props["data-testid"]} {...props}>
            {children}
        </div>
    ),
    ResizableHandle: ({ withHandle: _w, ...props }: any) => (
        <div data-testid={props["data-testid"]} {...props} />
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
