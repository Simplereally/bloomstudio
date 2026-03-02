import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OptionsPanel, GenerationOptions } from "./options-panel"

describe("OptionsPanel", () => {
    const defaultOptions: GenerationOptions = {
        private: false,
        safe: false,
    }

    const defaultProps = {
        options: defaultOptions,
        onOptionsChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the options panel", () => {
        render(<OptionsPanel {...defaultProps} />)

        expect(screen.getByTestId("options-panel")).toBeInTheDocument()
    })

    it("renders options instantly", () => {
        render(<OptionsPanel {...defaultProps} />)
        expect(screen.getByTestId("option-private")).toBeInTheDocument()
        expect(screen.getByTestId("option-safe")).toBeInTheDocument()
    })

    it("calls onOptionsChange when private is toggled", async () => {
        const onOptionsChange = vi.fn()
        render(
            <OptionsPanel
                {...defaultProps}
                onOptionsChange={onOptionsChange}
            />
        )

        await userEvent.click(screen.getByTestId("switch-private"))
        expect(onOptionsChange).toHaveBeenCalledWith({
            private: true,
            safe: false,
        })
    })

    it("calls onOptionsChange when safe is toggled", async () => {
        const onOptionsChange = vi.fn()
        render(
            <OptionsPanel
                {...defaultProps}
                onOptionsChange={onOptionsChange}
            />
        )

        await userEvent.click(screen.getByTestId("switch-safe"))
        expect(onOptionsChange).toHaveBeenCalledWith({
            private: false,
            safe: true,
        })
    })

    it("reflects current option states in switches", () => {
        render(
            <OptionsPanel
                {...defaultProps}
                options={{ private: false, safe: true }}
            />
        )

        expect(screen.getByTestId("switch-private")).toHaveAttribute("data-state", "unchecked")
        expect(screen.getByTestId("switch-safe")).toHaveAttribute("data-state", "checked")
    })

    it("applies custom className", () => {
        render(<OptionsPanel {...defaultProps} className="custom-class" />)

        expect(screen.getByTestId("options-panel")).toHaveClass("custom-class")
    })

    it("disables switches when disabled is true", () => {
        render(<OptionsPanel {...defaultProps} disabled={true} />)

        expect(screen.getByTestId("switch-private")).toBeDisabled()
        expect(screen.getByTestId("switch-safe")).toBeDisabled()
    })

    it("does not fire onOptionsChange when disabled switch is clicked", async () => {
        const onOptionsChange = vi.fn()
        render(
            <OptionsPanel
                {...defaultProps}
                onOptionsChange={onOptionsChange}
                disabled={true}
            />
        )

        await userEvent.click(screen.getByTestId("switch-private"))
        expect(onOptionsChange).not.toHaveBeenCalled()
    })
})
