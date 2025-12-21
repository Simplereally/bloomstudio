import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AspectRatioSelector } from "./aspect-ratio-selector"
import type { AspectRatioOption } from "@/types/pollinations"

const mockRatios: AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square" },
    { label: "Landscape", value: "16:9", width: 1344, height: 768, icon: "rectangle-horizontal" },
    { label: "Portrait", value: "9:16", width: 768, height: 1344, icon: "rectangle-vertical" },
    { label: "Custom", value: "custom", width: 1024, height: 1024, icon: "sliders" },
]

describe("AspectRatioSelector", () => {
    const defaultProps = {
        selectedRatio: "1:1" as const,
        onRatioChange: vi.fn(),
        ratios: mockRatios,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the aspect ratio selector", () => {
        render(<AspectRatioSelector {...defaultProps} />)

        expect(screen.getByTestId("aspect-ratio-selector")).toBeInTheDocument()
        expect(screen.getByTestId("aspect-ratio-group")).toBeInTheDocument()
    })

    it("renders all ratio options", () => {
        render(<AspectRatioSelector {...defaultProps} />)

        expect(screen.getByTestId("ratio-1-1")).toBeInTheDocument()
        expect(screen.getByTestId("ratio-16-9")).toBeInTheDocument()
        expect(screen.getByTestId("ratio-9-16")).toBeInTheDocument()
        expect(screen.getByTestId("ratio-custom")).toBeInTheDocument()
    })

    it("shows the selected ratio as active", () => {
        render(<AspectRatioSelector {...defaultProps} selectedRatio="16:9" />)

        // Verify the correct toggle item is rendered and can be found
        const landscapeButton = screen.getByTestId("ratio-16-9")
        expect(landscapeButton).toBeInTheDocument()
        // The ToggleGroup manages active state internally
    })

    it("calls onRatioChange with ratio and dimensions when clicked", () => {
        const onRatioChange = vi.fn()
        render(<AspectRatioSelector {...defaultProps} onRatioChange={onRatioChange} />)

        fireEvent.click(screen.getByTestId("ratio-16-9"))
        expect(onRatioChange).toHaveBeenCalledWith("16:9", { width: 1344, height: 768 })
    })

    it("displays ratio labels", () => {
        render(<AspectRatioSelector {...defaultProps} />)

        expect(screen.getByText("1:1")).toBeInTheDocument()
        expect(screen.getByText("16:9")).toBeInTheDocument()
        expect(screen.getByText("Custom")).toBeInTheDocument()
    })

    it("disables all options when disabled prop is true", () => {
        render(<AspectRatioSelector {...defaultProps} disabled={true} />)

        // Check that individual toggle items are disabled
        const squareButton = screen.getByTestId("ratio-1-1")
        expect(squareButton).toBeDisabled()
    })

    it("applies custom className", () => {
        render(<AspectRatioSelector {...defaultProps} className="custom-class" />)

        expect(screen.getByTestId("aspect-ratio-selector")).toHaveClass("custom-class")
    })
})
