import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OptionsPanel, GenerationOptions } from "./options-panel"

describe("OptionsPanel", () => {
    const defaultOptions: GenerationOptions = {
        enhance: false,
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
        expect(screen.getByTestId("option-enhance")).toBeInTheDocument()
        expect(screen.getByTestId("option-private")).toBeInTheDocument()
        expect(screen.getByTestId("option-safe")).toBeInTheDocument()
    })

    it("calls onOptionsChange when enhance is toggled", async () => {
        const onOptionsChange = vi.fn()
        render(
            <OptionsPanel
                {...defaultProps}
                onOptionsChange={onOptionsChange}
            />
        )

        await userEvent.click(screen.getByTestId("switch-enhance"))
        expect(onOptionsChange).toHaveBeenCalledWith({
            enhance: true,
            private: false,
            safe: false,
        })
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
            enhance: false,
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
            enhance: false,
            private: false,
            safe: true,
        })
    })

    it("reflects current option states in switches", () => {
        render(
            <OptionsPanel
                {...defaultProps}
                options={{ enhance: true, private: false, safe: true }}
            />
        )

        expect(screen.getByTestId("switch-enhance")).toHaveAttribute("data-state", "checked")
        expect(screen.getByTestId("switch-private")).toHaveAttribute("data-state", "unchecked")
        expect(screen.getByTestId("switch-safe")).toHaveAttribute("data-state", "checked")
    })

    it("applies custom className", () => {
        render(<OptionsPanel {...defaultProps} className="custom-class" />)

        expect(screen.getByTestId("options-panel")).toHaveClass("custom-class")
    })
})
