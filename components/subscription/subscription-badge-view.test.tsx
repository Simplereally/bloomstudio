/**
 * @vitest-environment jsdom
 * 
 * Tests for SubscriptionBadgeView Component
 */
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SubscriptionBadgeView } from "./subscription-badge-view"
import { TooltipProvider } from "@/components/ui/tooltip"

describe("SubscriptionBadgeView", () => {
    const defaultProps = {
        status: "pro" as const,
        isLoading: false,
        isUpgradeModalOpen: false,
        onUpgradeClick: vi.fn(),
        onCloseUpgradeModal: vi.fn(),
    }

    const renderWithProviders = (ui: React.ReactElement) => {
        return render(<TooltipProvider>{ui}</TooltipProvider>)
    }

    it("renders loading state", () => {
        const { container } = renderWithProviders(<SubscriptionBadgeView {...defaultProps} isLoading={true} />)
        // Pulse background is present in loading state
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
    })

    it("renders PRO badge for pro status", () => {
        renderWithProviders(<SubscriptionBadgeView {...defaultProps} status="pro" />)
        expect(screen.getByText("PRO")).toBeInTheDocument()
    })

    it("renders TRIAL badge for trial status", () => {
        renderWithProviders(
            <SubscriptionBadgeView
                {...defaultProps}
                status="trial"
                timeLeft="2h 30m"
            />
        )
        expect(screen.getByText(/TRIAL/)).toBeInTheDocument()
        expect(screen.getByText(/: 2h 30m/)).toBeInTheDocument()
    })

    it("calls onUpgradeClick when status is trial and badge is clicked", async () => {
        const onUpgradeClick = vi.fn()
        renderWithProviders(
            <SubscriptionBadgeView
                {...defaultProps}
                status="trial"
                onUpgradeClick={onUpgradeClick}
            />
        )

        const badge = screen.getByText(/TRIAL/)
        await userEvent.click(badge)
        expect(onUpgradeClick).toHaveBeenCalled()
    })

    it("renders UPGRADE badge for expired status", async () => {
        const onUpgradeClick = vi.fn()
        renderWithProviders(
            <SubscriptionBadgeView
                {...defaultProps}
                status="expired"
                onUpgradeClick={onUpgradeClick}
            />
        )

        const badge = screen.getByText("UPGRADE")
        expect(badge).toBeInTheDocument()

        await userEvent.click(badge)
        expect(onUpgradeClick).toHaveBeenCalled()
    })

    it("returns null when no status and not loading", () => {
        const { container } = renderWithProviders(<SubscriptionBadgeView {...defaultProps} status={undefined} />)
        expect(container.firstChild).toBeNull()
    })
})
