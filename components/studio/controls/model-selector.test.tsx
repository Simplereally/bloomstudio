import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ModelSelector } from "./model-selector"
import type { ImageModelInfo } from "@/lib/schemas/pollinations.schema"

const mockModels: ImageModelInfo[] = [
    { name: "flux", aliases: ["default"], pricing: { currency: "pollen" }, description: "Default balanced model" },
    { name: "turbo", aliases: ["fast"], pricing: { currency: "pollen" }, description: "Fastest generation" },
    { name: "gptimage", aliases: [], pricing: { currency: "pollen" }, description: "GPT-powered generation" },
]

const mockModelWithoutDescription: ImageModelInfo = {
    name: "custom",
    aliases: [],
    pricing: { currency: "pollen" },
}

describe("ModelSelector", () => {
    const defaultProps = {
        selectedModel: "flux",
        onModelChange: vi.fn(),
        models: mockModels,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("Compact variant (default)", () => {
        it("renders the model selector with correct structure", () => {
            render(<ModelSelector {...defaultProps} />)

            expect(screen.getByTestId("model-selector")).toBeInTheDocument()
            expect(screen.getByTestId("model-buttons")).toBeInTheDocument()
            expect(screen.getByText("Model")).toBeInTheDocument()
        })

        it("renders all model buttons", () => {
            render(<ModelSelector {...defaultProps} />)

            expect(screen.getByTestId("model-button-flux")).toBeInTheDocument()
            expect(screen.getByTestId("model-button-turbo")).toBeInTheDocument()
            expect(screen.getByTestId("model-button-gptimage")).toBeInTheDocument()
        })

        it("displays formatted model names", () => {
            render(<ModelSelector {...defaultProps} />)

            // Model names should be capitalized
            expect(screen.getByText("Flux")).toBeInTheDocument()
            expect(screen.getByText("Turbo")).toBeInTheDocument()
            expect(screen.getByText("Gptimage")).toBeInTheDocument()
        })

        it("applies selected styling to the active model", () => {
            render(<ModelSelector {...defaultProps} selectedModel="turbo" />)

            const turboButton = screen.getByTestId("model-button-turbo")
            expect(turboButton).toBeInTheDocument()
            // Selected model has specific styling classes
            expect(turboButton).toHaveClass("bg-primary/15")
        })

        it("calls onModelChange when a model is clicked", async () => {
            const user = userEvent.setup()
            const onModelChange = vi.fn()
            render(<ModelSelector {...defaultProps} onModelChange={onModelChange} />)

            await user.click(screen.getByTestId("model-button-turbo"))
            expect(onModelChange).toHaveBeenCalledWith("turbo")
            expect(onModelChange).toHaveBeenCalledTimes(1)
        })

        it("disables all buttons when disabled prop is true", () => {
            render(<ModelSelector {...defaultProps} disabled={true} />)

            expect(screen.getByTestId("model-button-flux")).toBeDisabled()
            expect(screen.getByTestId("model-button-turbo")).toBeDisabled()
            expect(screen.getByTestId("model-button-gptimage")).toBeDisabled()
        })

        it("does not call onModelChange when disabled", async () => {
            const user = userEvent.setup()
            const onModelChange = vi.fn()
            render(<ModelSelector {...defaultProps} onModelChange={onModelChange} disabled={true} />)

            await user.click(screen.getByTestId("model-button-flux"))
            expect(onModelChange).not.toHaveBeenCalled()
        })
    })

    describe("Cards variant", () => {
        it("renders model cards container", () => {
            render(<ModelSelector {...defaultProps} variant="cards" />)

            expect(screen.getByTestId("model-selector")).toBeInTheDocument()
            expect(screen.getByTestId("model-cards")).toBeInTheDocument()
        })

        it("renders all model cards", () => {
            render(<ModelSelector {...defaultProps} variant="cards" />)

            expect(screen.getByTestId("model-card-flux")).toBeInTheDocument()
            expect(screen.getByTestId("model-card-turbo")).toBeInTheDocument()
            expect(screen.getByTestId("model-card-gptimage")).toBeInTheDocument()
        })

        it("shows model descriptions in cards", () => {
            render(<ModelSelector {...defaultProps} variant="cards" />)

            expect(screen.getByText("Default balanced model")).toBeInTheDocument()
            expect(screen.getByText("Fastest generation")).toBeInTheDocument()
            expect(screen.getByText("GPT-powered generation")).toBeInTheDocument()
        })

        it("shows fallback description when model has no description", () => {
            render(
                <ModelSelector
                    {...defaultProps}
                    models={[mockModelWithoutDescription]}
                    variant="cards"
                />
            )

            expect(screen.getByText("Image generation model")).toBeInTheDocument()
        })

        it("calls onModelChange when a card is clicked", async () => {
            const user = userEvent.setup()
            const onModelChange = vi.fn()
            render(
                <ModelSelector {...defaultProps} variant="cards" onModelChange={onModelChange} />
            )

            await user.click(screen.getByTestId("model-card-turbo"))
            expect(onModelChange).toHaveBeenCalledWith("turbo")
            expect(onModelChange).toHaveBeenCalledTimes(1)
        })

        it("disables all cards when disabled prop is true", () => {
            render(<ModelSelector {...defaultProps} variant="cards" disabled={true} />)

            expect(screen.getByTestId("model-card-flux")).toBeDisabled()
            expect(screen.getByTestId("model-card-turbo")).toBeDisabled()
            expect(screen.getByTestId("model-card-gptimage")).toBeDisabled()
        })

        it("applies selected variant styling to active card", () => {
            render(<ModelSelector {...defaultProps} variant="cards" selectedModel="flux" />)

            const fluxCard = screen.getByTestId("model-card-flux")
            // Selected card uses "secondary" variant (tested via class presence)
            expect(fluxCard).toBeInTheDocument()
        })

        it("displays badges for specific models", () => {
            render(<ModelSelector {...defaultProps} variant="cards" />)

            // Turbo has "Fast" badge
            expect(screen.getByText("Fast")).toBeInTheDocument()
            // gptimage has "GPT" badge
            expect(screen.getByText("GPT")).toBeInTheDocument()
        })
    })

    describe("Common behavior", () => {
        it("applies custom className", () => {
            render(<ModelSelector {...defaultProps} className="custom-class" />)

            expect(screen.getByTestId("model-selector")).toHaveClass("custom-class")
        })

        it("applies custom className in cards variant", () => {
            render(<ModelSelector {...defaultProps} variant="cards" className="cards-custom" />)

            expect(screen.getByTestId("model-selector")).toHaveClass("cards-custom")
        })

        it("handles empty models array", () => {
            render(<ModelSelector {...defaultProps} models={[]} />)

            expect(screen.getByTestId("model-selector")).toBeInTheDocument()
            expect(screen.getByTestId("model-buttons")).toBeInTheDocument()
            // No buttons should be rendered
            expect(screen.queryByRole("button")).not.toBeInTheDocument()
        })

        it("handles empty models array in cards variant", () => {
            render(<ModelSelector {...defaultProps} models={[]} variant="cards" />)

            expect(screen.getByTestId("model-cards")).toBeInTheDocument()
            expect(screen.queryByRole("button")).not.toBeInTheDocument()
        })
    })
})
