/**
 * @vitest-environment jsdom
 *
 * Tests for PollenBalanceDisplayView Component
 */
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PollenBalanceDisplayView } from "./pollen-balance-display-view"
import { TooltipProvider } from "@/components/ui/tooltip"

describe("PollenBalanceDisplayView", () => {
  const defaultProps = {
    formattedBalance: "100.00",
    isLoading: false,
    isError: false,
    isLowBalance: false,
  }

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<TooltipProvider>{ui}</TooltipProvider>)
  }

  it("renders balance when provided", () => {
    renderWithProviders(
      <PollenBalanceDisplayView {...defaultProps} formattedBalance="123.45" />
    )
    expect(screen.getByText("123.45")).toBeInTheDocument()
    expect(screen.getByTestId("balance-display")).toBeInTheDocument()
  })

  it("shows skeleton during loading", () => {
    renderWithProviders(
      <PollenBalanceDisplayView {...defaultProps} isLoading={true} />
    )
    expect(screen.getByTestId("balance-skeleton")).toBeInTheDocument()
    expect(screen.queryByTestId("balance-display")).not.toBeInTheDocument()
  })

  it("shows error state when isError is true", () => {
    renderWithProviders(
      <PollenBalanceDisplayView
        {...defaultProps}
        isError={true}
        errorMessage="Unable to fetch balance"
      />
    )
    expect(screen.getByTestId("balance-error")).toBeInTheDocument()
    expect(screen.getByText("Error")).toBeInTheDocument()
  })

  it("shows low balance warning styling", () => {
    renderWithProviders(
      <PollenBalanceDisplayView {...defaultProps} isLowBalance={true} />
    )
    const badge = screen.getByTestId("balance-display")
    // Low balance uses amber styling
    expect(badge.className).toContain("amber")
  })

  it("shows normal styling when balance is not low", () => {
    renderWithProviders(
      <PollenBalanceDisplayView {...defaultProps} isLowBalance={false} />
    )
    const badge = screen.getByTestId("balance-display")
    // Normal balance uses emerald styling
    expect(badge.className).toContain("emerald")
  })
})
