/**
 * @vitest-environment jsdom
 * 
 * Tests for DimensionHeaderControls Component
 */
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DimensionHeaderControls } from "./dimension-header-controls"
import { TooltipProvider } from "@/components/ui/tooltip"

describe("DimensionHeaderControls", () => {
    const defaultProps = {
        megapixels: "1.05",
        isOverLimit: false,
        percentOfLimit: 52.5,
        hasPixelLimit: true,
        linked: false,
        onLinkedChange: vi.fn(),
    }

    const renderWithTooltip = (ui: React.ReactElement) => {
        return render(<TooltipProvider>{ui}</TooltipProvider>)
    }

    it("renders megapixels and link toggle", () => {
        renderWithTooltip(<DimensionHeaderControls {...defaultProps} />)

        expect(screen.getByTestId("dimension-header-megapixels")).toBeInTheDocument()
        expect(screen.getByTestId("dimension-header-link-toggle")).toBeInTheDocument()
        expect(screen.getByTestId("dimension-header-megapixels")).toHaveTextContent("1.05 MP")
    })

    it("displays percentage of limit when hasPixelLimit is true", () => {
        renderWithTooltip(<DimensionHeaderControls {...defaultProps} />)

        expect(screen.getByTestId("dimension-header-megapixels")).toHaveTextContent("(53%)")
    })

    it("does not display percentage when hasPixelLimit is false", () => {
        renderWithTooltip(<DimensionHeaderControls {...defaultProps} hasPixelLimit={false} percentOfLimit={null} />)

        expect(screen.getByTestId("dimension-header-megapixels")).toHaveTextContent("1.05 MP")
        expect(screen.getByTestId("dimension-header-megapixels")).not.toHaveTextContent("%")
    })

    it("calls onLinkedChange when link toggle is clicked", async () => {
        const onLinkedChange = vi.fn()
        renderWithTooltip(<DimensionHeaderControls {...defaultProps} onLinkedChange={onLinkedChange} />)

        const toggle = screen.getByTestId("dimension-header-link-toggle")
        await userEvent.click(toggle)

        expect(onLinkedChange).toHaveBeenCalledWith(true)
    })

    it("displays warning icon when over limit", () => {
        renderWithTooltip(<DimensionHeaderControls {...defaultProps} isOverLimit={true} />)

        expect(screen.getByTestId("dimension-header-warning")).toBeInTheDocument()
        expect(screen.getByTestId("dimension-header-megapixels")).toHaveClass("text-destructive")
    })

    it("disables link toggle when disabled prop is true", () => {
        renderWithTooltip(<DimensionHeaderControls {...defaultProps} disabled={true} />)

        expect(screen.getByTestId("dimension-header-link-toggle")).toBeDisabled()
    })
})

