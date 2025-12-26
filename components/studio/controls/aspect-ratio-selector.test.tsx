import { describe, it, expect, vi, beforeEach } from "vitest"
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

    describe("rendering", () => {
        it("renders the aspect ratio selector container", () => {
            render(<AspectRatioSelector {...defaultProps} />)

            expect(screen.getByTestId("aspect-ratio-selector")).toBeInTheDocument()
            expect(screen.getByTestId("aspect-ratio-buttons")).toBeInTheDocument()
        })

        it("renders the label with icon", () => {
            render(<AspectRatioSelector {...defaultProps} />)

            expect(screen.getByText("Aspect Ratio")).toBeInTheDocument()
        })

        it("renders all ratio options as buttons", () => {
            render(<AspectRatioSelector {...defaultProps} />)

            expect(screen.getByTestId("ratio-1-1")).toBeInTheDocument()
            expect(screen.getByTestId("ratio-16-9")).toBeInTheDocument()
            expect(screen.getByTestId("ratio-9-16")).toBeInTheDocument()
            expect(screen.getByTestId("ratio-custom")).toBeInTheDocument()
        })

        it("displays ratio labels for standard ratios", () => {
            render(<AspectRatioSelector {...defaultProps} />)

            expect(screen.getByText("1:1")).toBeInTheDocument()
            expect(screen.getByText("16:9")).toBeInTheDocument()
            expect(screen.getByText("9:16")).toBeInTheDocument()
        })

        it("displays 'Custom' text for custom ratio option", () => {
            render(<AspectRatioSelector {...defaultProps} />)

            expect(screen.getByText("Custom")).toBeInTheDocument()
        })
    })

    describe("selection state", () => {
        it("applies selected styling to the currently selected ratio", () => {
            render(<AspectRatioSelector {...defaultProps} selectedRatio="16:9" />)

            const landscapeButton = screen.getByTestId("ratio-16-9")
            // Selected buttons have the ring-1 class for visual indication
            expect(landscapeButton).toHaveClass("ring-1")
        })

        it("does not apply selected styling to non-selected ratios", () => {
            render(<AspectRatioSelector {...defaultProps} selectedRatio="1:1" />)

            const landscapeButton = screen.getByTestId("ratio-16-9")
            expect(landscapeButton).not.toHaveClass("ring-1")
        })
    })

    describe("user interactions", () => {
        it("calls onRatioChange with ratio and dimensions when button is clicked", () => {
            const onRatioChange = vi.fn()
            render(<AspectRatioSelector {...defaultProps} onRatioChange={onRatioChange} />)

            fireEvent.click(screen.getByTestId("ratio-16-9"))

            expect(onRatioChange).toHaveBeenCalledTimes(1)
            expect(onRatioChange).toHaveBeenCalledWith("16:9", { width: 1344, height: 768 })
        })

        it("calls onRatioChange with correct dimensions for portrait ratio", () => {
            const onRatioChange = vi.fn()
            render(<AspectRatioSelector {...defaultProps} onRatioChange={onRatioChange} />)

            fireEvent.click(screen.getByTestId("ratio-9-16"))

            expect(onRatioChange).toHaveBeenCalledWith("9:16", { width: 768, height: 1344 })
        })

        it("calls onRatioChange when custom ratio is selected", () => {
            const onRatioChange = vi.fn()
            render(<AspectRatioSelector {...defaultProps} onRatioChange={onRatioChange} />)

            fireEvent.click(screen.getByTestId("ratio-custom"))

            expect(onRatioChange).toHaveBeenCalledWith("custom", { width: 1024, height: 1024 })
        })
    })

    describe("disabled state", () => {
        it("disables all buttons when disabled prop is true", () => {
            render(<AspectRatioSelector {...defaultProps} disabled={true} />)

            expect(screen.getByTestId("ratio-1-1")).toBeDisabled()
            expect(screen.getByTestId("ratio-16-9")).toBeDisabled()
            expect(screen.getByTestId("ratio-9-16")).toBeDisabled()
            expect(screen.getByTestId("ratio-custom")).toBeDisabled()
        })

        it("does not call onRatioChange when disabled button is clicked", () => {
            const onRatioChange = vi.fn()
            render(<AspectRatioSelector {...defaultProps} onRatioChange={onRatioChange} disabled={true} />)

            fireEvent.click(screen.getByTestId("ratio-16-9"))

            expect(onRatioChange).not.toHaveBeenCalled()
        })
    })

    describe("styling", () => {
        it("applies custom className to the container", () => {
            render(<AspectRatioSelector {...defaultProps} className="custom-class" />)

            expect(screen.getByTestId("aspect-ratio-selector")).toHaveClass("custom-class")
        })

        it("applies space-y-2 class to the container", () => {
            render(<AspectRatioSelector {...defaultProps} />)

            expect(screen.getByTestId("aspect-ratio-selector")).toHaveClass("space-y-2")
        })

        it("renders buttons in a 6-column grid", () => {
            render(<AspectRatioSelector {...defaultProps} />)

            const buttonContainer = screen.getByTestId("aspect-ratio-buttons")
            expect(buttonContainer).toHaveClass("grid", "grid-cols-6")
        })
    })

    describe("edge cases", () => {
        it("handles empty ratios array gracefully", () => {
            render(<AspectRatioSelector {...defaultProps} ratios={[]} />)

            expect(screen.getByTestId("aspect-ratio-selector")).toBeInTheDocument()
            expect(screen.getByTestId("aspect-ratio-buttons")).toBeEmptyDOMElement()
        })

        it("handles undefined className gracefully", () => {
            render(<AspectRatioSelector {...defaultProps} className={undefined} />)

            expect(screen.getByTestId("aspect-ratio-selector")).toBeInTheDocument()
        })
    })
})
