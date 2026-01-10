import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Sparkles } from "lucide-react"
import { describe, expect, it } from "vitest"
import { CollapsibleSection } from "./collapsible-section"

describe("CollapsibleSection", () => {
    const defaultProps = {
        title: "Test Section",
        testId: "test-section",
        children: <div data-testid="test-content">Test Content</div>,
    }

    it("renders the section with title", () => {
        render(<CollapsibleSection {...defaultProps} />)

        expect(screen.getByText("Test Section")).toBeInTheDocument()
    })

    it("renders the icon when provided", () => {
        render(
            <CollapsibleSection
                {...defaultProps}
                icon={<Sparkles data-testid="test-icon" className="h-4 w-4" />}
            />
        )

        expect(screen.getByTestId("test-icon")).toBeInTheDocument()
    })

    it("is expanded by default", () => {
        render(<CollapsibleSection {...defaultProps} />)

        expect(screen.getByTestId("test-content")).toBeInTheDocument()
        expect(screen.getByTestId("test-content")).toBeVisible()
    })

    it("starts collapsed when defaultExpanded is false", () => {
        render(<CollapsibleSection {...defaultProps} defaultExpanded={false} />)

        // Content is still in DOM (forceMount) but hidden
        expect(screen.getByTestId("test-content")).toBeInTheDocument()
        expect(screen.getByTestId("test-content")).not.toBeVisible()
    })

    it("collapses when trigger is clicked", async () => {
        render(<CollapsibleSection {...defaultProps} />)

        // Initially expanded
        expect(screen.getByTestId("test-content")).toBeVisible()

        // Click to collapse
        await userEvent.click(screen.getByTestId("test-section-trigger"))

        // Content should be hidden but still in DOM (forceMount)
        expect(screen.getByTestId("test-content")).toBeInTheDocument()
        expect(screen.getByTestId("test-content")).not.toBeVisible()
    })

    it("expands when trigger is clicked on collapsed section", async () => {
        render(<CollapsibleSection {...defaultProps} defaultExpanded={false} />)

        // Initially collapsed (hidden but in DOM)
        expect(screen.getByTestId("test-content")).not.toBeVisible()

        // Click to expand
        await userEvent.click(screen.getByTestId("test-section-trigger"))

        // Content should be visible
        expect(screen.getByTestId("test-content")).toBeVisible()
    })

    it("renders children content", () => {
        render(
            <CollapsibleSection {...defaultProps}>
                <span>Custom child content</span>
            </CollapsibleSection>
        )

        expect(screen.getByText("Custom child content")).toBeInTheDocument()
    })

    it("applies custom className", () => {
        render(
            <CollapsibleSection {...defaultProps} className="custom-class" />
        )

        expect(screen.getByTestId("test-section-container")).toHaveClass("custom-class")
    })

    it("toggles chevron rotation on expand/collapse", async () => {
        render(<CollapsibleSection {...defaultProps} />)

        const trigger = screen.getByTestId("test-section-trigger")
        const chevron = trigger.querySelector('svg')

        // Initially expanded - chevron should be rotated
        expect(chevron).toHaveClass("rotate-90")

        // Click to collapse
        await userEvent.click(trigger)

        // Chevron should not be rotated
        expect(chevron).not.toHaveClass("rotate-90")
    })

    it("renders rightContent when provided", () => {
        render(
            <CollapsibleSection
                {...defaultProps}
                rightContent={<button data-testid="right-button">Clear</button>}
            />
        )

        expect(screen.getByTestId("right-button")).toBeInTheDocument()
        expect(screen.getByText("Clear")).toBeInTheDocument()
    })

    it("does not render rightContent container when not provided", () => {
        const { container } = render(<CollapsibleSection {...defaultProps} />)

        // rightContent container should not exist when rightContent is not provided
        const rightContentContainer = container.querySelector('[class*="shrink-0 ml-2"]')
        expect(rightContentContainer).not.toBeInTheDocument()
    })

    it("shows collapsedContent when collapsed and rightContent when expanded", async () => {
        render(
            <CollapsibleSection
                {...defaultProps}
                rightContent={<span data-testid="right-content">Right Content</span>}
                collapsedContent={<span data-testid="collapsed-content">Collapsed Value</span>}
            />
        )

        // Initially expanded - should show rightContent
        expect(screen.getByTestId("right-content")).toBeInTheDocument()
        expect(screen.queryByTestId("collapsed-content")).not.toBeInTheDocument()

        // Click to collapse
        await userEvent.click(screen.getByTestId("test-section-trigger"))

        // Now collapsed - should show collapsedContent
        expect(screen.getByTestId("collapsed-content")).toBeInTheDocument()
        expect(screen.queryByTestId("right-content")).not.toBeInTheDocument()
    })

    it("falls back to rightContent when collapsed if no collapsedContent provided", async () => {
        render(
            <CollapsibleSection
                {...defaultProps}
                defaultExpanded={false}
                rightContent={<span data-testid="right-content">Right Content</span>}
            />
        )

        // Collapsed but no collapsedContent - should still show rightContent
        expect(screen.getByTestId("right-content")).toBeInTheDocument()
    })

    it("shows collapsedContent in collapsed state", async () => {
        render(
            <CollapsibleSection
                {...defaultProps}
                defaultExpanded={false}
                collapsedContent={<span data-testid="collapsed-content">Selected: Option 1</span>}
            />
        )

        // Starts collapsed - should show collapsedContent
        expect(screen.getByTestId("collapsed-content")).toBeInTheDocument()
        expect(screen.getByText("Selected: Option 1")).toBeInTheDocument()
    })

    it("applies disabled styling when disabled prop is true", () => {
        render(<CollapsibleSection {...defaultProps} disabled={true} />)

        const container = screen.getByTestId("test-section-container")
        expect(container).toHaveClass("opacity-50", "pointer-events-none")
        expect(container).toHaveAttribute("aria-disabled", "true")
    })

    it("disables the trigger when disabled prop is true", () => {
        render(<CollapsibleSection {...defaultProps} disabled={true} />)

        const trigger = screen.getByTestId("test-section-trigger")
        expect(trigger).toBeDisabled()
        expect(trigger).toHaveClass("cursor-not-allowed")
    })

    it("does not toggle on click when disabled", async () => {
        render(<CollapsibleSection {...defaultProps} disabled={true} />)

        // Initially expanded
        expect(screen.getByTestId("test-content")).toBeVisible()

        // Try to click the trigger
        await userEvent.click(screen.getByTestId("test-section-trigger"))

        // Should still be expanded
        expect(screen.getByTestId("test-content")).toBeVisible()
    })

    describe("Controlled mode", () => {
        it("uses the provided open prop", () => {
            const { rerender } = render(<CollapsibleSection {...defaultProps} open={false} />)
            expect(screen.getByTestId("test-content")).not.toBeVisible()

            rerender(<CollapsibleSection {...defaultProps} open={true} />)
            expect(screen.getByTestId("test-content")).toBeVisible()
        })

        it("calls onOpenChange when trigger is clicked", async () => {
            const onOpenChange = vi.fn()
            render(<CollapsibleSection {...defaultProps} open={true} onOpenChange={onOpenChange} />)

            await userEvent.click(screen.getByTestId("test-section-trigger"))

            expect(onOpenChange).toHaveBeenCalledWith(false)
        })

        it("does not change state internally when controlled", async () => {
            const onOpenChange = vi.fn()
            render(<CollapsibleSection {...defaultProps} open={true} onOpenChange={onOpenChange} />)

            // Initially open
            expect(screen.getByTestId("test-content")).toBeVisible()

            // Click trigger
            await userEvent.click(screen.getByTestId("test-section-trigger"))

            // onOpenChange called but state shouldn't change internally because it's controlled
            expect(onOpenChange).toHaveBeenCalledWith(false)
            expect(screen.getByTestId("test-content")).toBeVisible()
        })
    })

    it("does not apply disabled styling when disabled is false", () => {
        render(<CollapsibleSection {...defaultProps} disabled={false} />)

        const container = screen.getByTestId("test-section-container")
        expect(container).not.toHaveClass("opacity-50")
        expect(container).not.toHaveClass("pointer-events-none")
        expect(container).toHaveAttribute("aria-disabled", "false")
    })
})

