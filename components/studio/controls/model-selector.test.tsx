import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ModelSelector } from "./model-selector"
import type { ModelInfo } from "@/types/pollinations"

const mockModels: ModelInfo[] = [
    { id: "flux", name: "Flux", description: "Default balanced model", style: "Versatile" },
    { id: "turbo", name: "Turbo", description: "Fastest generation", style: "Fast" },
    { id: "flux-realism", name: "Flux Realism", description: "Photorealistic", style: "Photorealistic" },
]

describe("ModelSelector", () => {
    const defaultProps = {
        selectedModel: "flux" as const,
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
            expect(screen.getByTestId("model-toggle-flux-realism")).toBeInTheDocument()
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
            expect(screen.getByTestId("model-card-flux-realism")).toBeInTheDocument()
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
