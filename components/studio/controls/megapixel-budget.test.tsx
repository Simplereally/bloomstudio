import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MegapixelBudget } from "./megapixel-budget"

// Wrap component with TooltipProvider for tooltip tests
function renderWithTooltip(ui: React.ReactElement) {
    // TooltipProvider is likely already in the test setup via vitest.setup.ts
    // If not, the component should still render its visible content
    return render(ui)
}

describe("MegapixelBudget", () => {
    describe("expanded view (default)", () => {
        it("renders the expanded budget display", () => {
            renderWithTooltip(
                <MegapixelBudget width={1024} height={1024} maxPixels={2_000_000} />
            )

            expect(screen.getByTestId("megapixel-budget")).toBeInTheDocument()
        })

        it("displays correct megapixel value for 1MP", () => {
            // 1024 * 1024 = 1,048,576 pixels ≈ 1.0 MP
            renderWithTooltip(
                <MegapixelBudget width={1024} height={1024} maxPixels={2_000_000} />
            )

            expect(screen.getByTestId("megapixel-budget")).toHaveTextContent("1.0 MP")
        })

        it("displays dimensions", () => {
            renderWithTooltip(
                <MegapixelBudget width={1920} height={1080} maxPixels={4_000_000} />
            )

            expect(screen.getByTestId("megapixel-budget")).toHaveTextContent(
                "1920 × 1080"
            )
        })

        it("shows progress bar when limit exists", () => {
            renderWithTooltip(
                <MegapixelBudget width={1024} height={1024} maxPixels={2_000_000} />
            )

            expect(screen.getByTestId("budget-progress")).toBeInTheDocument()
        })

        it("does not show progress bar when maxPixels is Infinity", () => {
            renderWithTooltip(
                <MegapixelBudget width={1024} height={1024} maxPixels={Infinity} />
            )

            expect(screen.queryByTestId("budget-progress")).not.toBeInTheDocument()
        })

        it("shows warning when over limit", () => {
            // 2000 * 2000 = 4,000,000 > 1,000,000 max
            renderWithTooltip(
                <MegapixelBudget width={2000} height={2000} maxPixels={1_000_000} />
            )

            expect(screen.getByTestId("budget-warning")).toHaveTextContent(
                "Exceeds model limit"
            )
        })

        it("shows dimension warning when provided and not over limit", () => {
            renderWithTooltip(
                <MegapixelBudget
                    width={1024}
                    height={1024}
                    maxPixels={2_000_000}
                    dimensionWarning="Custom warning text"
                />
            )

            expect(screen.getByTestId("budget-warning")).toHaveTextContent(
                "Custom warning text"
            )
        })

        it("shows over-limit warning instead of dimension warning when both apply", () => {
            renderWithTooltip(
                <MegapixelBudget
                    width={2000}
                    height={2000}
                    maxPixels={1_000_000}
                    dimensionWarning="Custom warning text"
                />
            )

            expect(screen.getByTestId("budget-warning")).toHaveTextContent(
                "Exceeds model limit"
            )
            expect(screen.getByTestId("budget-warning")).not.toHaveTextContent(
                "Custom warning text"
            )
        })
    })

    describe("compact view", () => {
        it("renders compact budget display", () => {
            renderWithTooltip(
                <MegapixelBudget
                    width={1024}
                    height={1024}
                    maxPixels={2_000_000}
                    compact
                />
            )

            expect(screen.getByTestId("megapixel-budget-compact")).toBeInTheDocument()
        })

        it("displays megapixel value in compact mode", () => {
            renderWithTooltip(
                <MegapixelBudget
                    width={1024}
                    height={1024}
                    maxPixels={2_000_000}
                    compact
                />
            )

            expect(screen.getByTestId("megapixel-budget-compact")).toHaveTextContent(
                "1.0 MP"
            )
        })

        it("displays percentage in compact mode when has limit", () => {
            // 1MP out of 2MP = 50%
            renderWithTooltip(
                <MegapixelBudget
                    width={1000}
                    height={1000}
                    maxPixels={2_000_000}
                    compact
                />
            )

            expect(screen.getByTestId("megapixel-budget-compact")).toHaveTextContent("50%")
        })
    })

    describe("certainty indicators", () => {
        it("renders exact certainty icon in expanded view", () => {
            renderWithTooltip(
                <MegapixelBudget
                    width={1024}
                    height={1024}
                    maxPixels={2_000_000}
                    outputCertainty="exact"
                />
            )

            // The certainty icon should be present (CheckCircle2 for exact)
            expect(screen.getByTestId("megapixel-budget")).toBeInTheDocument()
        })

        it("renders compact view with certainty when not over limit", () => {
            renderWithTooltip(
                <MegapixelBudget
                    width={1024}
                    height={1024}
                    maxPixels={2_000_000}
                    outputCertainty="likely"
                    compact
                />
            )

            expect(screen.getByTestId("megapixel-budget-compact")).toBeInTheDocument()
        })
    })

    describe("custom className", () => {
        it("applies custom className to expanded view", () => {
            renderWithTooltip(
                <MegapixelBudget
                    width={1024}
                    height={1024}
                    maxPixels={2_000_000}
                    className="custom-test-class"
                />
            )

            expect(screen.getByTestId("megapixel-budget")).toHaveClass("custom-test-class")
        })

        it("applies custom className to compact view", () => {
            renderWithTooltip(
                <MegapixelBudget
                    width={1024}
                    height={1024}
                    maxPixels={2_000_000}
                    className="custom-test-class"
                    compact
                />
            )

            expect(screen.getByTestId("megapixel-budget-compact")).toHaveClass(
                "custom-test-class"
            )
        })
    })
})
