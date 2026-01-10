import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { StudioLayout } from "./studio-layout"

// Mock the Sidebar components
vi.mock("@/components/ui/sidebar", () => ({
    SidebarProvider: ({ children, open, "data-testid": testId, style }: any) => (
        <div data-testid={testId || "sidebar-provider"} data-open={String(open)} style={style}>
            {children}
        </div>
    ),
    Sidebar: ({ children, side, "data-testid": testId }: any) => (
        <div data-testid={testId || "sidebar"} data-side={side}>
            {children}
        </div>
    ),
    SidebarContent: ({ children }: any) => (
        <div data-testid="sidebar-content-wrapper">
            {children}
        </div>
    ),
    SidebarInset: ({ children }: any) => (
        <div data-testid="sidebar-inset">
            {children}
        </div>
    ),
}))

describe("StudioLayout", () => {
    const mockSidebar = <div data-testid="sidebar-content">Sidebar</div>
    const mockCanvas = <div data-testid="canvas-content">Canvas</div>
    const mockGallery = <div data-testid="gallery-content">Gallery</div>

    it("renders sidebar and canvas correctly", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                showSidebar={true}
            />
        )

        expect(screen.getByTestId("sidebar-content")).toBeInTheDocument()
        expect(screen.getByTestId("canvas-content")).toBeInTheDocument()
        
        // Check if SidebarProvider for left sidebar receives correct open prop
        const providers = screen.getAllByTestId("sidebar-provider")
        expect(providers[0]).toHaveAttribute("data-open", "true")
    })

    it("renders gallery when provided", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                gallery={mockGallery}
                showGallery={true}
            />
        )

        expect(screen.getByTestId("gallery-content")).toBeInTheDocument()
        
        // Check if nested SidebarProvider for gallery receives correct open prop
        const providers = screen.getAllByTestId("sidebar-provider")
        // Provider 0 is usually left, Provider 1 is inner/right
        expect(providers[1]).toHaveAttribute("data-open", "true")
        
        // Check if right sidebar is rendered
        const sidebars = screen.getAllByTestId("studio-gallery-panel")
        expect(sidebars.length).toBeGreaterThan(0)
    })

    it("passes false to sidebar provider when sidebar hidden", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                showSidebar={false}
            />
        )

        const providers = screen.getAllByTestId("sidebar-provider")
        expect(providers[0]).toHaveAttribute("data-open", "false")
    })

    it("passes false to gallery provider when gallery hidden", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                gallery={mockGallery}
                showGallery={false}
            />
        )

        const providers = screen.getAllByTestId("sidebar-provider")
        expect(providers[1]).toHaveAttribute("data-open", "false")
    })

    it("does not render gallery sidebar if gallery prop is missing", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                // No gallery prop
            />
        )

        expect(screen.queryByTestId("gallery-content")).not.toBeInTheDocument()
        expect(screen.queryByTestId("studio-gallery-panel")).not.toBeInTheDocument()
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
})
