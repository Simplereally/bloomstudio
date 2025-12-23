import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SeedControl } from "./seed-control"

describe("SeedControl", () => {
    const defaultProps = {
        seed: -1,
        onSeedChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the seed control", () => {
        render(<SeedControl {...defaultProps} />)

        expect(screen.getByTestId("seed-control")).toBeInTheDocument()
        expect(screen.getByTestId("seed-input")).toBeInTheDocument()
    })

    it("shows empty input for random seed (-1)", () => {
        render(<SeedControl {...defaultProps} seed={-1} />)

        expect(screen.getByTestId("seed-input")).toHaveValue(null)
    })

    it("displays the current seed value", () => {
        render(<SeedControl {...defaultProps} seed={12345} />)

        expect(screen.getByTestId("seed-input")).toHaveValue(12345)
    })

    it("calls onSeedChange when input changes", async () => {
        const onSeedChange = vi.fn()
        render(<SeedControl {...defaultProps} onSeedChange={onSeedChange} />)

        const input = screen.getByTestId("seed-input")
        await userEvent.type(input, "42")

        expect(onSeedChange).toHaveBeenCalled()
    })

    it("generates random seed when random button is clicked", async () => {
        const onSeedChange = vi.fn()
        render(<SeedControl {...defaultProps} onSeedChange={onSeedChange} />)

        await userEvent.click(screen.getByTestId("random-seed"))

        expect(onSeedChange).toHaveBeenCalledTimes(1)
        const calledWith = onSeedChange.mock.calls[0][0]
        expect(calledWith).toBeGreaterThanOrEqual(0)
        expect(calledWith).toBeLessThanOrEqual(2147483647)
    })

    it("shows copy button when seed is set", () => {
        render(<SeedControl {...defaultProps} seed={12345} />)

        expect(screen.getByTestId("copy-seed")).toBeInTheDocument()
    })

    it("hides copy button when seed is random", () => {
        render(<SeedControl {...defaultProps} seed={-1} />)

        expect(screen.queryByTestId("copy-seed")).not.toBeInTheDocument()
    })

    it("shows lock toggle when onLockChange is provided", () => {
        render(<SeedControl {...defaultProps} onLockChange={vi.fn()} />)

        expect(screen.getByTestId("lock-seed")).toBeInTheDocument()
    })

    it("hides lock toggle when onLockChange is not provided", () => {
        render(<SeedControl {...defaultProps} />)

        expect(screen.queryByTestId("lock-seed")).not.toBeInTheDocument()
    })

    it("calls onLockChange when lock button is clicked", async () => {
        const onLockChange = vi.fn()
        render(
            <SeedControl
                {...defaultProps}
                seed={12345}
                onLockChange={onLockChange}
            />
        )

        await userEvent.click(screen.getByTestId("lock-seed"))
        expect(onLockChange).toHaveBeenCalledWith(true)
    })

    it("disables lock button when seed is random", () => {
        render(
            <SeedControl
                {...defaultProps}
                seed={-1}
                onLockChange={vi.fn()}
            />
        )

        expect(screen.getByTestId("lock-seed")).toBeDisabled()
    })

    it("shows helpful text for random seed", () => {
        render(<SeedControl {...defaultProps} seed={-1} />)

        expect(
            screen.getByText("A random seed will be used for each generation")
        ).toBeInTheDocument()
    })

    it("disables input when disabled prop is true", () => {
        render(<SeedControl {...defaultProps} disabled={true} />)

        expect(screen.getByTestId("seed-input")).toBeDisabled()
        expect(screen.getByTestId("random-seed")).toBeDisabled()
    })

    it("applies custom className", () => {
        render(<SeedControl {...defaultProps} className="custom-class" />)

        expect(screen.getByTestId("seed-control")).toHaveClass("custom-class")
    })
})
