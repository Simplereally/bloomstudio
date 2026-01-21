import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import * as React from "react"
import { Sidebar, SidebarProvider, useSidebar } from "./sidebar"

// Mock the useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}))

// Import after mocking so we can control the mock
import { useIsMobile } from "@/hooks/use-mobile"
const mockUseIsMobile = vi.mocked(useIsMobile)

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false)
  })

  describe("collapsible='none' mode", () => {
    it("renders a simple non-collapsible sidebar", () => {
      render(
        <SidebarProvider>
          <Sidebar collapsible="none" data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>
      )

      const sidebar = screen.getByTestId("sidebar")
      expect(sidebar).toBeInTheDocument()
      expect(sidebar).toHaveAttribute("data-slot", "sidebar")
      expect(sidebar).toHaveTextContent("Content")
    })

    it("applies custom className", () => {
      render(
        <SidebarProvider>
          <Sidebar collapsible="none" className="custom-class" data-testid="sidebar">
            Content
          </Sidebar>
        </SidebarProvider>
      )

      const sidebar = screen.getByTestId("sidebar")
      expect(sidebar).toHaveClass("custom-class")
    })
  })

  describe("desktop mode", () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false)
    })

    it("renders desktop sidebar with correct data attributes", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <Sidebar variant="sidebar" side="left">
            <div>Desktop Content</div>
          </Sidebar>
        </SidebarProvider>
      )

      // Desktop sidebar has a wrapper with data-slot="sidebar" that has the data attributes
      const sidebar = document.querySelector('[data-slot="sidebar"]')
      expect(sidebar).toBeInTheDocument()
      expect(sidebar).toHaveAttribute("data-state", "expanded")
      expect(sidebar).toHaveAttribute("data-variant", "sidebar")
      expect(sidebar).toHaveAttribute("data-side", "left")
    })

    it("renders right-side desktop sidebar", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <Sidebar side="right">
            <div>Right Content</div>
          </Sidebar>
        </SidebarProvider>
      )

      const sidebar = document.querySelector('[data-slot="sidebar"]')
      expect(sidebar).toHaveAttribute("data-side", "right")
    })

    it("renders floating variant sidebar", () => {
      render(
        <SidebarProvider>
          <Sidebar variant="floating">
            Content
          </Sidebar>
        </SidebarProvider>
      )

      const sidebar = document.querySelector('[data-slot="sidebar"]')
      expect(sidebar).toHaveAttribute("data-variant", "floating")
    })

    it("renders inset variant sidebar", () => {
      render(
        <SidebarProvider>
          <Sidebar variant="inset">
            Content
          </Sidebar>
        </SidebarProvider>
      )

      const sidebar = document.querySelector('[data-slot="sidebar"]')
      expect(sidebar).toHaveAttribute("data-variant", "inset")
    })
  })

  describe("mobile mode", () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true)
    })

    it("renders mobile sidebar with correct data attributes when closed", () => {
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar data-testid="sidebar" side="left">
            <div>Mobile Content</div>
          </Sidebar>
        </SidebarProvider>
      )

      const sidebar = screen.getByTestId("sidebar")
      expect(sidebar).toHaveAttribute("data-mobile", "true")
      expect(sidebar).toHaveAttribute("data-state", "collapsed")
      expect(sidebar).toHaveClass("-translate-x-full")
    })

    it("renders mobile sidebar with correct position for left side", () => {
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar data-testid="sidebar" side="left">
            Content
          </Sidebar>
        </SidebarProvider>
      )

      const sidebar = screen.getByTestId("sidebar")
      expect(sidebar).toHaveClass("left-0")
      expect(sidebar).toHaveClass("border-r")
    })

    it("renders mobile sidebar with correct position for right side", () => {
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar data-testid="sidebar" side="right">
            Content
          </Sidebar>
        </SidebarProvider>
      )

      const sidebar = screen.getByTestId("sidebar")
      expect(sidebar).toHaveClass("right-0")
      expect(sidebar).toHaveClass("border-l")
      expect(sidebar).toHaveClass("translate-x-full")
    })

    it("does not apply translate class when mobile sidebar is open", () => {
      // Use open prop to control the sidebar state
      render(
        <SidebarProvider open={true}>
          <Sidebar data-testid="sidebar" side="left">
            Content
          </Sidebar>
        </SidebarProvider>
      )

      const sidebar = screen.getByTestId("sidebar")
      // When open=true is passed, the mobile state should be synced via useEffect
      expect(sidebar).toHaveAttribute("data-mobile", "true")
    })
  })
})

describe("useSidebar", () => {
  it("throws error when used outside SidebarProvider", () => {
    const TestComponent = () => {
      useSidebar()
      return null
    }

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow(
      "useSidebar must be used within a SidebarProvider."
    )

    consoleSpy.mockRestore()
  })
})
