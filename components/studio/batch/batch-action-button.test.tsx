import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { BatchActionButton } from "./batch-action-button"

describe("BatchActionButton", () => {
    const defaultProps = {
        isPaused: false,
        completedCount: 3,
        totalCount: 10,
        inFlightCount: 0,
        onPause: vi.fn(),
        onResume: vi.fn(),
        onCancel: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders with progress counter", () => {
        render(<BatchActionButton {...defaultProps} />)
        
        expect(screen.getByText("3/10")).toBeInTheDocument()
    })

    it("shows pause button when not paused", () => {
        render(<BatchActionButton {...defaultProps} isPaused={false} />)
        
        expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument()
    })

    it("shows resume button when paused", () => {
        render(<BatchActionButton {...defaultProps} isPaused={true} />)
        
        expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument()
    })

    it("calls onPause when pause button is clicked", () => {
        const onPause = vi.fn()
        render(<BatchActionButton {...defaultProps} onPause={onPause} isPaused={false} />)
        
        fireEvent.click(screen.getByRole("button", { name: /pause/i }))
        
        expect(onPause).toHaveBeenCalledTimes(1)
    })

    it("calls onResume when resume button is clicked", () => {
        const onResume = vi.fn()
        render(<BatchActionButton {...defaultProps} onResume={onResume} isPaused={true} />)
        
        fireEvent.click(screen.getByRole("button", { name: /resume/i }))
        
        expect(onResume).toHaveBeenCalledTimes(1)
    })

    it("calls onCancel when cancel button is clicked", () => {
        const onCancel = vi.fn()
        render(<BatchActionButton {...defaultProps} onCancel={onCancel} />)
        
        fireEvent.click(screen.getByTitle("Cancel batch generation"))
        
        expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it("displays correct progress percentage visually", () => {
        const { container } = render(
            <BatchActionButton {...defaultProps} completedCount={5} totalCount={10} />
        )
        
        // Progress bar should be at 50%
        const progressFill = container.querySelector('[style*="width: 50%"]')
        expect(progressFill).toBeInTheDocument()
    })

    it("applies custom className", () => {
        const { container } = render(
            <BatchActionButton {...defaultProps} className="custom-class" />
        )
        
        expect(container.firstChild).toHaveClass("custom-class")
    })

    it("shows different colors when paused vs active", () => {
        const { rerender } = render(<BatchActionButton {...defaultProps} isPaused={false} />)
        
        const pauseButton = screen.getByRole("button", { name: /pause/i })
        expect(pauseButton).toHaveClass("text-emerald-700")
        
        rerender(<BatchActionButton {...defaultProps} isPaused={true} />)
        
        const resumeButton = screen.getByRole("button", { name: /resume/i })
        expect(resumeButton).toHaveClass("text-amber-600")
    })

    it("does not show in-flight indicator when not paused", () => {
        render(<BatchActionButton {...defaultProps} isPaused={false} inFlightCount={2} />)
        
        expect(screen.queryByText(/finishing/i)).not.toBeInTheDocument()
    })

    it("shows in-flight indicator when paused and items are in flight", () => {
        render(<BatchActionButton {...defaultProps} isPaused={true} inFlightCount={2} />)
        
        expect(screen.getByText("2 images finishing...")).toBeInTheDocument()
    })

    it("shows singular text for single in-flight item", () => {
        render(<BatchActionButton {...defaultProps} isPaused={true} inFlightCount={1} />)
        
        expect(screen.getByText("1 image finishing...")).toBeInTheDocument()
    })
})
