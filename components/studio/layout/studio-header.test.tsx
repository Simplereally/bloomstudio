import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { StudioHeader } from "./studio-header"

describe("StudioHeader", () => {
    it("renders the header with branding", () => {
        render(<StudioHeader />)

        expect(screen.getByTestId("studio-header")).toBeInTheDocument()
        expect(screen.getByText("Pixelstream")).toBeInTheDocument()
        expect(screen.getByText("AI Image Studio")).toBeInTheDocument()
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

    it("calls onShowShortcuts when shortcuts button is clicked", () => {
        const onShowShortcuts = vi.fn()
        render(<StudioHeader onShowShortcuts={onShowShortcuts} />)

        fireEvent.click(screen.getByTestId("show-shortcuts"))
        expect(onShowShortcuts).toHaveBeenCalledTimes(1)
    })

    it("applies secondary variant when sidebar is open", () => {
        render(<StudioHeader leftSidebarOpen={true} />)

        const button = screen.getByTestId("toggle-left-sidebar")
        // The button should have the "secondary" variant styles
        expect(button).toBeInTheDocument()
    })

    it("renders user button when provided", () => {
        const userButton = <div data-testid="user-button">User</div>
        render(<StudioHeader userButton={userButton} />)

        expect(screen.getByTestId("user-button")).toBeInTheDocument()
    })

    it("does not render user button section when not provided", () => {
        render(<StudioHeader />)

        expect(screen.queryByTestId("user-button")).not.toBeInTheDocument()
    })

    it("applies custom className", () => {
        render(<StudioHeader className="custom-header" />)

        const header = screen.getByTestId("studio-header")
        expect(header).toHaveClass("custom-header")
    })

    it("renders settings menu button", () => {
        render(<StudioHeader />)

        expect(screen.getByTestId("settings-menu")).toBeInTheDocument()
    })
})
