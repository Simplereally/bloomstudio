// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LowBalanceWarningDialog } from "./low-balance-warning-dialog"

describe("LowBalanceWarningDialog", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        currentBalance: "1.50",
        estimatedCost: "0.75",
        remainingBalance: "0.75",
        cannotAfford: false,
        modelName: "Veo 3.1",
        isBatch: false,
        batchCount: 1,
    }

    it("renders when open", () => {
        render(<LowBalanceWarningDialog {...defaultProps} />)

        expect(screen.getByRole("alertdialog")).toBeInTheDocument()
        expect(screen.getByText("Low Balance Warning")).toBeInTheDocument()
    })

    it("does not render when closed", () => {
        render(<LowBalanceWarningDialog {...defaultProps} isOpen={false} />)

        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    })

    it("displays balance information", () => {
        render(<LowBalanceWarningDialog {...defaultProps} />)

        expect(screen.getByText(/You have/)).toBeInTheDocument()
        expect(screen.getByText(/1\.50/)).toBeInTheDocument()
        expect(screen.getByText(/But this costs/)).toBeInTheDocument()
        expect(screen.getAllByText(/0\.75/)).toHaveLength(2)
    })

    it("displays model name", () => {
        render(<LowBalanceWarningDialog {...defaultProps} />)

        expect(screen.getByText("Veo 3.1")).toBeInTheDocument()
    })

    it("shows insufficient pollen title when cannotAfford is true", () => {
        render(<LowBalanceWarningDialog {...defaultProps} cannotAfford={true} />)

        expect(screen.getByText("Insufficient Pollen")).toBeInTheDocument()
        expect(screen.queryByText("Low Balance Warning")).not.toBeInTheDocument()
    })

    it("shows 'Try Anyway' button when cannotAfford is true", () => {
        render(<LowBalanceWarningDialog {...defaultProps} cannotAfford={true} />)

        expect(screen.getByRole("button", { name: "Try Anyway" })).toBeInTheDocument()
    })

    it("shows 'Proceed' button when cannotAfford is false", () => {
        render(<LowBalanceWarningDialog {...defaultProps} cannotAfford={false} />)

        expect(screen.getByRole("button", { name: "Proceed" })).toBeInTheDocument()
    })

    it("calls onConfirm when proceed button is clicked", () => {
        const onConfirm = vi.fn()
        render(<LowBalanceWarningDialog {...defaultProps} onConfirm={onConfirm} />)

        fireEvent.click(screen.getByRole("button", { name: "Proceed" }))

        expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it("calls onClose when cancel button is clicked", () => {
        const onClose = vi.fn()
        render(<LowBalanceWarningDialog {...defaultProps} onClose={onClose} />)

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("displays batch count when isBatch is true", () => {
        render(<LowBalanceWarningDialog {...defaultProps} isBatch={true} batchCount={10} />)

        expect(screen.getByText(/10 images/)).toBeInTheDocument()
    })

    it("displays 'generation' when not in batch mode", () => {
        render(<LowBalanceWarningDialog {...defaultProps} isBatch={false} />)

        expect(screen.getByText(/This generation will/)).toBeInTheDocument()
    })

    it("handles null balance values gracefully", () => {
        render(
            <LowBalanceWarningDialog
                {...defaultProps}
                currentBalance={null}
                estimatedCost={null}
                remainingBalance={null}
            />
        )

        // Should render without crashing and still show the dialog
        expect(screen.getByRole("alertdialog")).toBeInTheDocument()
        // Should show placeholder dashes for null values (2 now: current balance + cost)
        expect(screen.getAllByText(/—/)).toHaveLength(2)
    })
})
