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
        expect(screen.getByTestId("options-trigger")).toBeInTheDocument()
    })

    it("is collapsed by default", () => {
        render(<OptionsPanel {...defaultProps} />)

        expect(screen.queryByTestId("option-enhance")).not.toBeInTheDocument()
    })

    it("expands when trigger is clicked", async () => {
        render(<OptionsPanel {...defaultProps} />)

        await userEvent.click(screen.getByTestId("options-trigger"))
        expect(screen.getByTestId("option-enhance")).toBeInTheDocument()
    })

    it("starts expanded when defaultExpanded is true", () => {
        render(<OptionsPanel {...defaultProps} defaultExpanded={true} />)

        expect(screen.getByTestId("option-enhance")).toBeInTheDocument()
        expect(screen.getByTestId("option-private")).toBeInTheDocument()
        expect(screen.getByTestId("option-safe")).toBeInTheDocument()
    })

    it("shows all option switches when expanded", async () => {
        render(<OptionsPanel {...defaultProps} defaultExpanded={true} />)

        expect(screen.getByTestId("switch-enhance")).toBeInTheDocument()
        expect(screen.getByTestId("switch-private")).toBeInTheDocument()
        expect(screen.getByTestId("switch-safe")).toBeInTheDocument()
    })

    it("calls onOptionsChange when enhance is toggled", async () => {
        const onOptionsChange = vi.fn()
        render(
            <OptionsPanel
                {...defaultProps}
                defaultExpanded={true}
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
                defaultExpanded={true}
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
                defaultExpanded={true}
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

    it("displays active count badge when options are enabled", () => {
        render(
            <OptionsPanel
                {...defaultProps}
                options={{ enhance: true, private: true, safe: false }}
            />
        )

        expect(screen.getByTestId("active-count")).toHaveTextContent("2")
    })

    it("does not show active count when no options are enabled", () => {
        render(<OptionsPanel {...defaultProps} />)

        expect(screen.queryByTestId("active-count")).not.toBeInTheDocument()
    })

    it("reflects current option states in switches", () => {
        render(
            <OptionsPanel
                {...defaultProps}
                defaultExpanded={true}
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
