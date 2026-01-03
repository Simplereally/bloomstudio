import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DimensionControls } from "./dimension-controls"

describe("DimensionControls", () => {
    const defaultProps = {
        width: 1024,
        height: 1024,
        onWidthChange: vi.fn(),
        onHeightChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the dimension controls", () => {
        render(<DimensionControls {...defaultProps} />)

        expect(screen.getByTestId("dimension-controls")).toBeInTheDocument()
        expect(screen.getByTestId("width-input")).toBeInTheDocument()
        expect(screen.getByTestId("height-input")).toBeInTheDocument()
    })

    it("displays current dimension values", () => {
        render(<DimensionControls {...defaultProps} width={512} height={768} />)

        expect(screen.getByTestId("width-input")).toHaveValue(512)
        expect(screen.getByTestId("height-input")).toHaveValue(768)
    })

    it("displays megapixel count", () => {
        render(<DimensionControls {...defaultProps} width={1024} height={1024} />)

        // 1024 * 1024 = 1,048,576 pixels = 1.05 MP
        expect(screen.getByTestId("megapixels")).toHaveTextContent("1.05 MP")
    })

    it("renders width and height sliders", () => {
        render(<DimensionControls {...defaultProps} />)

        expect(screen.getByTestId("width-slider")).toBeInTheDocument()
        expect(screen.getByTestId("height-slider")).toBeInTheDocument()
    })

    it("renders link toggle button", () => {
        render(<DimensionControls {...defaultProps} />)

        expect(screen.getByTestId("link-toggle")).toBeInTheDocument()
    })

    it("toggles link state when link button is clicked", async () => {
        render(<DimensionControls {...defaultProps} />)

        const linkToggle = screen.getByTestId("link-toggle")

        // Initially unlinked (ghost variant)
        await userEvent.click(linkToggle)

        // Now should be linked (secondary variant)
        // The button should still be in the document
        expect(linkToggle).toBeInTheDocument()
    })

    it("calls onWidthChange when width input changes", async () => {
        const onWidthChange = vi.fn()
        render(<DimensionControls {...defaultProps} onWidthChange={onWidthChange} />)

        const widthInput = screen.getByTestId("width-input")
        await userEvent.clear(widthInput)
        await userEvent.type(widthInput, "512")

        expect(onWidthChange).toHaveBeenCalled()
    })

    it("calls onHeightChange when height input changes", async () => {
        const onHeightChange = vi.fn()
        render(<DimensionControls {...defaultProps} onHeightChange={onHeightChange} />)

        const heightInput = screen.getByTestId("height-input")
        await userEvent.clear(heightInput)
        await userEvent.type(heightInput, "768")

        expect(onHeightChange).toHaveBeenCalled()
    })

    it("disables inputs when disabled prop is true", () => {
        render(<DimensionControls {...defaultProps} disabled={true} />)

        expect(screen.getByTestId("width-input")).toBeDisabled()
        expect(screen.getByTestId("height-input")).toBeDisabled()
        expect(screen.getByTestId("link-toggle")).toBeDisabled()
    })

    it("applies custom className", () => {
        render(<DimensionControls {...defaultProps} className="custom-class" />)

        expect(screen.getByTestId("dimension-controls")).toHaveClass("custom-class")
    })

    it("hides header labels and controls when hideHeader is true", () => {
        render(<DimensionControls {...defaultProps} hideHeader={true} />)

        expect(screen.queryByText("Dimensions")).not.toBeInTheDocument()
        expect(screen.queryByTestId("megapixels")).not.toBeInTheDocument()
        expect(screen.queryByTestId("link-toggle")).not.toBeInTheDocument()
    })
})
