/**
 * @vitest-environment jsdom
 *
 * Tests for PollenBalanceDisplay Container Component
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { PollenBalanceDisplay } from "./pollen-balance-display"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePollenAuth } from "@/lib/pollen-auth"
import { usePollenBalance } from "@/hooks/use-pollen-balance"

// Mock usePollenAuth hook
vi.mock("@/lib/pollen-auth", () => ({
  usePollenAuth: vi.fn(),
}))

// Mock usePollenBalance hook
vi.mock("@/hooks/use-pollen-balance", () => ({
  usePollenBalance: vi.fn(),
}))

describe("PollenBalanceDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<TooltipProvider>{ui}</TooltipProvider>)
  }

  const mockPollenBalance = {
    balance: 100,
    formattedBalance: "100.00",
    isLoading: false,
    isError: false,
    error: null,
    isLowBalance: false,
    refetch: vi.fn(),
    invalidateBalance: vi.fn(),
    isRefreshing: false,
  }

  it("renders when authorized", () => {
    vi.mocked(usePollenAuth).mockReturnValue({
      apiKey: "test-api-key",
      isAuthorized: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      daysUntilExpiry: 30,
      isExpiringSoon: false,
      isExpired: false,
      isLoading: false,
      authorize: vi.fn(),
      deauthorize: vi.fn(),
      refreshAuthState: vi.fn(),
      _fromProvider: true,
    })

    vi.mocked(usePollenBalance).mockReturnValue(mockPollenBalance)

    renderWithProviders(<PollenBalanceDisplay />)
    expect(screen.getByTestId("balance-display")).toBeInTheDocument()
    expect(screen.getByText("100.00")).toBeInTheDocument()
  })

  it("does not render when not authorized", () => {
    vi.mocked(usePollenAuth).mockReturnValue({
      apiKey: null,
      isAuthorized: false,
      expiresAt: null,
      daysUntilExpiry: null,
      isExpiringSoon: false,
      isExpired: false,
      isLoading: false,
      authorize: vi.fn(),
      deauthorize: vi.fn(),
      refreshAuthState: vi.fn(),
      _fromProvider: true,
    })

    vi.mocked(usePollenBalance).mockReturnValue(mockPollenBalance)

    const { container } = renderWithProviders(<PollenBalanceDisplay />)
    expect(container.firstChild).toBeNull()
  })

  it("does not render while auth is loading", () => {
    vi.mocked(usePollenAuth).mockReturnValue({
      apiKey: null,
      isAuthorized: false,
      expiresAt: null,
      daysUntilExpiry: null,
      isExpiringSoon: false,
      isExpired: false,
      isLoading: true,
      authorize: vi.fn(),
      deauthorize: vi.fn(),
      refreshAuthState: vi.fn(),
      _fromProvider: true,
    })

    vi.mocked(usePollenBalance).mockReturnValue(mockPollenBalance)

    const { container } = renderWithProviders(<PollenBalanceDisplay />)
    expect(container.firstChild).toBeNull()
  })

  it("shows loading skeleton when balance is loading", () => {
    vi.mocked(usePollenAuth).mockReturnValue({
      apiKey: "test-api-key",
      isAuthorized: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      daysUntilExpiry: 30,
      isExpiringSoon: false,
      isExpired: false,
      isLoading: false,
      authorize: vi.fn(),
      deauthorize: vi.fn(),
      refreshAuthState: vi.fn(),
      _fromProvider: true,
    })

    vi.mocked(usePollenBalance).mockReturnValue({
      ...mockPollenBalance,
      isLoading: true,
      formattedBalance: null,
    })

    renderWithProviders(<PollenBalanceDisplay />)
    expect(screen.getByTestId("balance-skeleton")).toBeInTheDocument()
  })

  it("shows error state when balance fetch fails", () => {
    vi.mocked(usePollenAuth).mockReturnValue({
      apiKey: "test-api-key",
      isAuthorized: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      daysUntilExpiry: 30,
      isExpiringSoon: false,
      isExpired: false,
      isLoading: false,
      authorize: vi.fn(),
      deauthorize: vi.fn(),
      refreshAuthState: vi.fn(),
      _fromProvider: true,
    })

    vi.mocked(usePollenBalance).mockReturnValue({
      ...mockPollenBalance,
      isError: true,
      error: { code: "NETWORK_ERROR", message: "Network request failed" },
    })

    renderWithProviders(<PollenBalanceDisplay />)
    expect(screen.getByTestId("balance-error")).toBeInTheDocument()
  })
})
