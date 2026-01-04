/**
 * @vitest-environment jsdom
 * 
 * Tests for SubscriptionBadge Container Component
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SubscriptionBadge } from "./subscription-badge"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"

// Mock useSubscriptionStatus hook
vi.mock("@/hooks/use-subscription-status", () => ({
    useSubscriptionStatus: vi.fn(),
}))

// Mock UpgradeModal to simplify testing the container logic
vi.mock("@/components/studio/upgrade-modal", () => ({
    UpgradeModal: ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
        isOpen ? (
            <div data-testid="upgrade-modal">
                <span>Upgrade Modal Content</span>
                <button onClick={onClose}>Close</button>
            </div>
        ) : null
    ),
}))

describe("SubscriptionBadge", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const renderWithProviders = (ui: React.ReactElement) => {
        return render(<TooltipProvider>{ui}</TooltipProvider>)
    }

    it("renders loading state when hook returns isLoading: true", () => {
        vi.mocked(useSubscriptionStatus).mockReturnValue({
            status: undefined,
            isLoading: true,
            timeLeft: undefined,
            canGenerate: false,
        })

        const { container } = renderWithProviders(<SubscriptionBadge />)
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
    })

    it("renders PRO badge when status is pro", () => {
        vi.mocked(useSubscriptionStatus).mockReturnValue({
            status: "pro",
            isLoading: false,
            timeLeft: undefined,
            canGenerate: true,
        })

        renderWithProviders(<SubscriptionBadge />)
        expect(screen.getByText("PRO")).toBeInTheDocument()
    })

    it("renders TRIAL badge when status is trial", () => {
        vi.mocked(useSubscriptionStatus).mockReturnValue({
            status: "trial",
            isLoading: false,
            timeLeft: "2h 30m",
            canGenerate: true,
        })

        renderWithProviders(<SubscriptionBadge />)
        expect(screen.getByText(/TRIAL/)).toBeInTheDocument()
        expect(screen.getByText(/: 2h 30m/)).toBeInTheDocument()
    })

    it("opens upgrade modal when trial badge is clicked", async () => {
        vi.mocked(useSubscriptionStatus).mockReturnValue({
            status: "trial",
            isLoading: false,
            timeLeft: "1h",
            canGenerate: true,
        })

        renderWithProviders(<SubscriptionBadge />)

        const badge = screen.getByText(/TRIAL/)
        await userEvent.click(badge)

        expect(screen.getByTestId("upgrade-modal")).toBeInTheDocument()
    })

    it("renders UPGRADE badge when status is expired", () => {
        vi.mocked(useSubscriptionStatus).mockReturnValue({
            status: "expired",
            isLoading: false,
            timeLeft: undefined,
            canGenerate: false,
        })

        renderWithProviders(<SubscriptionBadge />)
        expect(screen.getByText("UPGRADE")).toBeInTheDocument()
    })

    it("opens upgrade modal when upgrade badge is clicked", async () => {
        vi.mocked(useSubscriptionStatus).mockReturnValue({
            status: "expired",
            isLoading: false,
            timeLeft: undefined,
            canGenerate: false,
        })

        renderWithProviders(<SubscriptionBadge />)

        const badge = screen.getByText("UPGRADE")
        await userEvent.click(badge)

        expect(screen.getByTestId("upgrade-modal")).toBeInTheDocument()
    })

    it("closes upgrade modal when onClose is called", async () => {
        vi.mocked(useSubscriptionStatus).mockReturnValue({
            status: "expired",
            isLoading: false,
            timeLeft: undefined,
            canGenerate: false,
        })

        renderWithProviders(<SubscriptionBadge />)

        // Open modal
        await userEvent.click(screen.getByText("UPGRADE"))
        expect(screen.getByTestId("upgrade-modal")).toBeInTheDocument()

        // Close modal
        await userEvent.click(screen.getByText("Close"))
        expect(screen.queryByTestId("upgrade-modal")).not.toBeInTheDocument()
    })
})
