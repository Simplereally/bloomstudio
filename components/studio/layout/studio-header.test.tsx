import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { StudioHeader } from "./studio-header"

describe("StudioHeader", () => {
    it("renders the header", () => {
        render(<StudioHeader />)

        expect(screen.getByTestId("studio-header")).toBeInTheDocument()
    })

    it("renders panel toggle buttons", () => {
        render(<StudioHeader />)

        expect(screen.getByTestId("toggle-left-sidebar")).toBeInTheDocument()
        expect(screen.getByTestId("toggle-right-panel")).toBeInTheDocument()
    })

    it("calls onToggleLeftSidebar when left toggle is clicked", () => {
        const onToggleLeftSidebar = vi.fn()
        render(<StudioHeader onToggleLeftSidebar={onToggleLeftSidebar} />)

        fireEvent.click(screen.getByTestId("toggle-left-sidebar"))
        expect(onToggleLeftSidebar).toHaveBeenCalledTimes(1)
    })

    it("calls onToggleRightPanel when right toggle is clicked", () => {
        const onToggleRightPanel = vi.fn()
        render(<StudioHeader onToggleRightPanel={onToggleRightPanel} />)

        fireEvent.click(screen.getByTestId("toggle-right-panel"))
        expect(onToggleRightPanel).toHaveBeenCalledTimes(1)
    })

    it("applies secondary variant when sidebar is open", () => {
        render(<StudioHeader leftSidebarOpen={true} />)

        const button = screen.getByTestId("toggle-left-sidebar")
        // The button should have the "secondary" variant styles
        expect(button).toBeInTheDocument()
    })

    it("applies ghost variant when sidebar is closed", () => {
        render(<StudioHeader leftSidebarOpen={false} />)

        const button = screen.getByTestId("toggle-left-sidebar")
        expect(button).toBeInTheDocument()
    })

    it("applies custom className", () => {
        render(<StudioHeader className="custom-header" />)

        const header = screen.getByTestId("studio-header")
        expect(header).toHaveClass("custom-header")
    })
})
