import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { StudioLayout } from "./studio-layout"
import type { CSSProperties, ReactNode } from "react"

// Mock the Sidebar components
const mockToggleSidebar = vi.fn()

vi.mock("@/components/ui/sidebar", () => ({
    SidebarProvider: ({
        children,
        open,
        "data-testid": testId,
        style,
    }: {
        children: ReactNode
        open?: boolean
        "data-testid"?: string
        style?: CSSProperties
    }) => (
        <div data-testid={testId || "sidebar-provider"} data-open={String(open)} style={style}>
            {children}
        </div>
    ),
    Sidebar: ({
        children,
        side,
        "data-testid": testId,
    }: {
        children: ReactNode
        side?: string
        "data-testid"?: string
    }) => (
        <div data-testid={testId || "sidebar"} data-side={side}>
            {children}
        </div>
    ),
    SidebarContent: ({ children }: { children: ReactNode }) => (
        <div data-testid="sidebar-content-wrapper">
            {children}
        </div>
    ),
    SidebarInset: ({ children }: { children: ReactNode }) => (
        <div data-testid="sidebar-inset">
            {children}
        </div>
    ),
    SidebarRail: ({ className, children }: { className?: string, children?: ReactNode }) => (
        <button data-testid="sidebar-rail" className={className} aria-label="Toggle Sidebar">
            {children}
        </button>
    ),
    useSidebar: () => ({
        toggleSidebar: mockToggleSidebar,
        open: true,
        state: "expanded",
        isMobile: false
    })
}))

describe("StudioLayout", () => {
    const mockSidebar = <div data-testid="sidebar-content">Sidebar</div>
    const mockCanvas = <div data-testid="canvas-content">Canvas</div>
    const mockGallery = <div data-testid="gallery-content">Gallery</div>

    beforeEach(() => {
        mockToggleSidebar.mockClear()
    })

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
    })

    it("renders sidebar rail icon button", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                showSidebar={true}
            />
        )
        
        // Find the rail icon button (it has role="button" and hidden text "Expand Sidebar" or "Collapse Sidebar")
        // Since state is mocked as "expanded", text should be "Collapse Sidebar"
        const iconButton = screen.getByText("Collapse Sidebar").closest('div[role="button"]')
        expect(iconButton).toBeInTheDocument()
    })

    it("calls toggleSidebar when rail icon is clicked", () => {
        render(
            <StudioLayout
                sidebar={mockSidebar}
                canvas={mockCanvas}
                showSidebar={true}
            />
        )

        const iconButton = screen.getByText("Collapse Sidebar").closest('div[role="button"]')
        expect(iconButton).not.toBeNull()
        
        if (iconButton) {
            fireEvent.click(iconButton)
            expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
        }
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
        
        // Should have two toggle buttons (left and right)
        const toggleButtons = screen.getAllByText("Collapse Sidebar")
        expect(toggleButtons.length).toBeGreaterThanOrEqual(2)
    })
})
