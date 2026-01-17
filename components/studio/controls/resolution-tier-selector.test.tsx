
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { ResolutionTierSelector } from "./resolution-tier-selector"
import { RESOLUTION_TIERS, RESOLUTION_TIER_ORDER } from "@/lib/config/resolution-tiers"
import type { ModelConstraints, ResolutionTier } from "@/types/pollinations"

// Mock ResizeObserver for Radix UI Tooltips
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

const mockConstraints: ModelConstraints = {
    maxPixels: 1000000, // 1MP
    maxDimension: 1024,
    minDimension: 64,
    step: 8,
    // Explicitly allowing only specific tiers for control in tests
    supportedTiers: ["sd", "hd"],
    // Other fields required by type but not used in logic under test
    maxDuration: 10,
    maxParallel: 1,
} as unknown as ModelConstraints

describe("ResolutionTierSelector", () => {
    const defaultProps = {
        selectedTier: "sd" as ResolutionTier,
        onTierChange: vi.fn(),
        constraints: mockConstraints,
    }

    it("renders all resolution tiers", () => {
        render(<ResolutionTierSelector {...defaultProps} />)

        // Check for main container
        expect(screen.getByTestId("resolution-tier-selector")).toBeInTheDocument()

        // Check for each tier button using data-testid
        RESOLUTION_TIER_ORDER.forEach((tier) => {
            expect(screen.getByTestId(`tier-${tier}`)).toBeInTheDocument()
            // Check for label content
            expect(screen.getByText(RESOLUTION_TIERS[tier].shortLabel)).toBeInTheDocument()
        })
    })

    it("highlights the selected tier", () => {
        render(<ResolutionTierSelector {...defaultProps} selectedTier="hd" />)

        // HD should be selected (secondary variant usually implies expected active functionality here, 
        // but specific styles are applied in component: bg-emerald-500/15 etc)
        const activeBtn = screen.getByTestId("tier-hd")
        const inactiveBtn = screen.getByTestId("tier-sd")

        // The component applies specific active classes
        expect(activeBtn.className).toContain("bg-emerald-500/15")
        expect(inactiveBtn.className).not.toContain("bg-emerald-500/15")
    })

    it("calls onTierChange when a supported tier is clicked", async () => {
        const onTierChange = vi.fn()
        const user = userEvent.setup()

        render(
            <ResolutionTierSelector
                {...defaultProps}
                onTierChange={onTierChange}
            // SD is selected, click HD
            />
        )

        const hdBtn = screen.getByTestId("tier-hd")
        await user.click(hdBtn)

        expect(onTierChange).toHaveBeenCalledTimes(1)
        expect(onTierChange).toHaveBeenCalledWith("hd")
    })

    it("disables buttons for unsupported tiers", async () => {
        // 4k is not in our mockConstraints supportedTiers ["sd", "hd"]
        const onTierChange = vi.fn()
        const user = userEvent.setup()

        render(
            <ResolutionTierSelector
                {...defaultProps}
                onTierChange={onTierChange}
            />
        )

        const tier4kBtn = screen.getByTestId("tier-4k")

        // Check disabled attribute
        expect(tier4kBtn).toBeDisabled()

        // Check visual disabled state classes
        expect(tier4kBtn.className).toContain("opacity-40")

        // Try clicking
        await user.click(tier4kBtn) // userEvent.click respects disabled state and shouldn't trigger, but also check handler
        expect(onTierChange).not.toHaveBeenCalled()
    })

    it("handles global disabled state", async () => {
        const onTierChange = vi.fn()
        const user = userEvent.setup()

        render(
            <ResolutionTierSelector
                {...defaultProps}
                disabled={true}
                onTierChange={onTierChange}
            />
        )

        // Even supported tiers should be disabled
        const sdBtn = screen.getByTestId("tier-sd")
        expect(sdBtn).toBeDisabled()

        await user.click(sdBtn)
        expect(onTierChange).not.toHaveBeenCalled()
    })

    it("renders in compact mode", () => {
        render(<ResolutionTierSelector {...defaultProps} compact={true} />)

        const btn = screen.getByTestId("tier-sd")
        // Compact mode adds "h-7 text-xs"
        expect(btn.className).toContain("h-7")
        expect(btn.className).toContain("text-xs")
    })

    it("updates supported tiers when constraints change", () => {
        // Case 1: Only SD supported
        const { rerender } = render(
            <ResolutionTierSelector
                {...defaultProps}
                constraints={{ ...mockConstraints, supportedTiers: ["sd"] } as unknown as ModelConstraints}
            />
        )

        expect(screen.getByTestId("tier-hd")).toBeDisabled()

        // Case 2: SD and HD supported
        rerender(
            <ResolutionTierSelector
                {...defaultProps}
                constraints={{ ...mockConstraints, supportedTiers: ["sd", "hd"] } as unknown as ModelConstraints}
            />
        )

        expect(screen.getByTestId("tier-hd")).not.toBeDisabled()
    })

    // Tooltip test - verifying content appears
    // Note: Radix Tooltip content requires user interaction (hover/focus) and can be async
    it("shows tooltip with correct content", async () => {
        const user = userEvent.setup()
        render(<ResolutionTierSelector {...defaultProps} />)

        const sdBtn = screen.getByTestId("tier-sd")

        // Hover to trigger tooltip
        await user.hover(sdBtn)

        // "Standard" label check
        // Using findAllByText to handle potential duplication by Radix UI (accessibility portals)
        const labels = await screen.findAllByText("Standard")
        expect(labels.length).toBeGreaterThan(0)

        // Description check
        const descriptions = await screen.findAllByText(RESOLUTION_TIERS.sd.description)
        expect(descriptions.length).toBeGreaterThan(0)
    })

    it("shows 'Not supported' in tooltip for unsupported tiers", async () => {
        const user = userEvent.setup()
        render(<ResolutionTierSelector {...defaultProps} />)

        // 4K is unsupported and disabled
        const tier4kBtn = screen.getByTestId("tier-4k")

        // Even if disabled, we attempt hover to check if tooltip content is rendered.
        // Note: In some environments disabled buttons don't fire events, but JSDOM/userEvent 
        // might allow it depending on style parsing. We rely on the fact that if it *does* open,
        // we want to verify the content.
        await user.hover(tier4kBtn)

        const messages = await screen.findAllByText("Not supported by this model")
        expect(messages.length).toBeGreaterThan(0)
    })
})
