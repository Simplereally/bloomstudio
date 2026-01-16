import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Sparkles } from "lucide-react"
import * as React from "react"
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

        // Content should not be in the document (Radix default without forceMount)
        expect(screen.queryByTestId("test-content")).not.toBeInTheDocument()
    })

    it("collapses when trigger is clicked", async () => {
        render(<CollapsibleSection {...defaultProps} />)

        // Initially expanded
        expect(screen.getByTestId("test-content")).toBeVisible()

        // Click to collapse
        await userEvent.click(screen.getByTestId("test-section-trigger"))

        // Content should be removed from DOM
        expect(screen.queryByTestId("test-content")).not.toBeInTheDocument()
    })

    it("expands when trigger is clicked on collapsed section", async () => {
        render(<CollapsibleSection {...defaultProps} defaultExpanded={false} />)

        // Initially collapsed (not in DOM)
        expect(screen.queryByTestId("test-content")).not.toBeInTheDocument()

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

        const chevron = screen.getByTestId("test-section-chevron")

        // Initially expanded - chevron should be rotated
        expect(chevron).toHaveClass("rotate-90")

        // Click to collapse
        await userEvent.click(screen.getByTestId("test-section-trigger"))

        const collapsedChevron = screen.getByTestId("test-section-chevron")
        // Chevron should not be rotated
        expect(collapsedChevron).not.toHaveClass("rotate-90")
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
            expect(screen.queryByTestId("test-content")).not.toBeInTheDocument()

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

    describe("forceMount", () => {
        it("keeps content in DOM when collapsed with forceMount", async () => {
            render(<CollapsibleSection {...defaultProps} forceMount />)

            // Initially expanded
            expect(screen.getByTestId("test-content")).toBeInTheDocument()
            expect(screen.getByTestId("test-content")).toBeVisible()

            // Click to collapse
            await userEvent.click(screen.getByTestId("test-section-trigger"))

            // Content should still be in DOM (unlike without forceMount)
            expect(screen.getByTestId("test-content")).toBeInTheDocument()
        })

        it("hides content visually when collapsed with forceMount", async () => {
            render(<CollapsibleSection {...defaultProps} forceMount />)

            // Click to collapse
            await userEvent.click(screen.getByTestId("test-section-trigger"))

            // Content container should have closed state and pointer-events-none for forceMount
            const contentWrapper = screen.getByTestId("test-section-content")
            expect(contentWrapper).toHaveAttribute("data-state", "closed")
            expect(contentWrapper).toHaveClass("data-[state=closed]:pointer-events-none")
        })

        it("shows content visually when expanded with forceMount", async () => {
            render(<CollapsibleSection {...defaultProps} forceMount defaultExpanded={false} />)

            // Initially collapsed but in DOM (with closed data-state)
            expect(screen.getByTestId("test-content")).toBeInTheDocument()
            const contentWrapper = screen.getByTestId("test-section-content")
            expect(contentWrapper).toHaveAttribute("data-state", "closed")

            // Click to expand
            await userEvent.click(screen.getByTestId("test-section-trigger"))

            // Should have open data-state now
            expect(screen.getByTestId("test-content")).toBeInTheDocument()
            expect(contentWrapper).toHaveAttribute("data-state", "open")
        })

        it("preserves child state across collapse/expand with forceMount", async () => {
            // Use a stateful child component
            const StatefulChild = () => {
                const [value, setValue] = React.useState("")
                return (
                    <input
                        data-testid="stateful-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                )
            }

            render(
                <CollapsibleSection {...defaultProps} forceMount>
                    <StatefulChild />
                </CollapsibleSection>
            )

            // Type something in the input
            const input = screen.getByTestId("stateful-input")
            await userEvent.type(input, "test value")
            expect(input).toHaveValue("test value")

            // Collapse
            await userEvent.click(screen.getByTestId("test-section-trigger"))

            // Expand again
            await userEvent.click(screen.getByTestId("test-section-trigger"))

            // Value should be preserved
            expect(screen.getByTestId("stateful-input")).toHaveValue("test value")
        })
    })
})

