// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QualitySelector } from "./quality-selector"

describe("QualitySelector", () => {
    const defaultProps = {
        value: "medium" as const,
        onChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders with current value", () => {
        render(<QualitySelector {...defaultProps} />)
        
        expect(screen.getByTestId("quality-select")).toBeInTheDocument()
        expect(screen.getByRole("combobox")).toHaveTextContent("Medium")
    })

    it("disables select when disabled prop is true", () => {
        render(<QualitySelector {...defaultProps} disabled />)
        
        expect(screen.getByRole("combobox")).toBeDisabled()
    })

    it("renders label with correct text", () => {
        render(<QualitySelector {...defaultProps} />)
        
        expect(screen.getByText("Quality")).toBeInTheDocument()
    })

    it("renders with different quality values", () => {
        const { rerender } = render(<QualitySelector {...defaultProps} value="low" />)
        expect(screen.getByRole("combobox")).toHaveTextContent("Low")
        
        rerender(<QualitySelector {...defaultProps} value="high" />)
        expect(screen.getByRole("combobox")).toHaveTextContent("High")
        
        rerender(<QualitySelector {...defaultProps} value="hd" />)
        expect(screen.getByRole("combobox")).toHaveTextContent("HD")
    })

    // Note: Tests that interact with Radix Select dropdown items are skipped
    // due to jsdom limitations with hasPointerCapture. Use e2e tests for full interaction testing.
})
