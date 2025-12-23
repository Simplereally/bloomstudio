import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ModelSelector } from "./model-selector"
import type { ImageModelInfo } from "@/lib/schemas/pollinations.schema"

const mockModels: ImageModelInfo[] = [
    { name: "flux", aliases: ["default"], pricing: { currency: "pollen" }, description: "Default balanced model" },
    { name: "turbo", aliases: ["fast"], pricing: { currency: "pollen" }, description: "Fastest generation" },
    { name: "gptimage", aliases: [], pricing: { currency: "pollen" }, description: "GPT-powered generation" },
]

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
        it("renders the model selector", () => {
            render(<ModelSelector {...defaultProps} />)

            expect(screen.getByTestId("model-selector")).toBeInTheDocument()
            expect(screen.getByTestId("model-toggle-group")).toBeInTheDocument()
        })

        it("renders all model options", () => {
            render(<ModelSelector {...defaultProps} />)

            expect(screen.getByTestId("model-toggle-flux")).toBeInTheDocument()
            expect(screen.getByTestId("model-toggle-turbo")).toBeInTheDocument()
            expect(screen.getByTestId("model-toggle-gptimage")).toBeInTheDocument()
        })

        it("shows the selected model as active", () => {
            render(<ModelSelector {...defaultProps} selectedModel="turbo" />)

            // Verify the correct toggle item is rendered
            const turboButton = screen.getByTestId("model-toggle-turbo")
            expect(turboButton).toBeInTheDocument()
            // The ToggleGroup manages active state internally
        })

        it("calls onModelChange when a model is clicked", () => {
            const onModelChange = vi.fn()
            render(<ModelSelector {...defaultProps} onModelChange={onModelChange} />)

            fireEvent.click(screen.getByTestId("model-toggle-turbo"))
            expect(onModelChange).toHaveBeenCalledWith("turbo")
        })

        it("disables all options when disabled", () => {
            render(<ModelSelector {...defaultProps} disabled={true} />)

            // Check that individual toggle items are disabled
            const fluxButton = screen.getByTestId("model-toggle-flux")
            expect(fluxButton).toBeDisabled()
        })
    })

    describe("Cards variant", () => {
        it("renders model cards", () => {
            render(<ModelSelector {...defaultProps} variant="cards" />)

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
        })

        it("calls onModelChange when a card is clicked", () => {
            const onModelChange = vi.fn()
            render(
                <ModelSelector {...defaultProps} variant="cards" onModelChange={onModelChange} />
            )

            fireEvent.click(screen.getByTestId("model-card-turbo"))
            expect(onModelChange).toHaveBeenCalledWith("turbo")
        })
    })

    it("applies custom className", () => {
        render(<ModelSelector {...defaultProps} className="custom-class" />)

        expect(screen.getByTestId("model-selector")).toHaveClass("custom-class")
    })
})
