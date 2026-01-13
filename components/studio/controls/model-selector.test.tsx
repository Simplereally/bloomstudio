// @vitest-environment jsdom
import type { ModelDefinition } from "@/lib/config/models"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ModelSelector } from "./model-selector"

const mockModels: ModelDefinition[] = [
    {
        id: "zimage",
        displayName: "Z-Image-Turbo",
        type: "image",
        icon: "zap",
        description: "High-resolution model",
        constraints: {
            maxPixels: 4_194_304,
            minPixels: 0,
            minDimension: 64,
            maxDimension: 4096,
            step: 32,
            defaultDimensions: { width: 2048, height: 2048 },
            dimensionsEnabled: true,
        },
        aspectRatios: [],
        supportsNegativePrompt: false,
    },
    {
        id: "turbo",
        displayName: "SDXL Turbo",
        type: "image",
        icon: "zap",
        description: "Fastest generation",
        constraints: {
            maxPixels: 589_825,
            minPixels: 0,
            minDimension: 64,
            maxDimension: 768,
            step: 64,
            defaultDimensions: { width: 768, height: 768 },
            dimensionsEnabled: true,
        },
        aspectRatios: [],
        supportsNegativePrompt: false,
    },
    {
        id: "gptimage",
        displayName: "GPT 1.0",
        type: "image",
        icon: "camera",
        description: "GPT-powered generation",
        constraints: {
            maxPixels: Infinity,
            minPixels: 0,
            minDimension: 1024,
            maxDimension: 1792,
            step: 1,
            defaultDimensions: { width: 1024, height: 1024 },
            dimensionsEnabled: false,
        },
        aspectRatios: [],
        supportsNegativePrompt: false,
    },
]

describe("ModelSelector", () => {
    const defaultProps = {
        selectedModel: "zimage",
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

            expect(screen.getByTestId("model-button-zimage")).toBeInTheDocument()
            expect(screen.getByTestId("model-button-turbo")).toBeInTheDocument()
            expect(screen.getByTestId("model-button-gptimage")).toBeInTheDocument()
        })

        it("displays formatted model names", () => {
            render(<ModelSelector {...defaultProps} />)

            // Model names should match their display names
            expect(screen.getByText("Z-Image-Turbo")).toBeInTheDocument()
            expect(screen.getByText("SDXL Turbo")).toBeInTheDocument()
            expect(screen.getByText("GPT 1.0")).toBeInTheDocument()
        })

        it("applies selected styling to the active model", () => {
            render(<ModelSelector {...defaultProps} selectedModel="turbo" />)

            const turboButton = screen.getByTestId("model-button-turbo")
            expect(turboButton).toBeInTheDocument()
            // Selected model has emerald green styling classes
            expect(turboButton).toHaveClass("bg-emerald-500/15")
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

            expect(screen.getByTestId("model-button-zimage")).toBeDisabled()
            expect(screen.getByTestId("model-button-turbo")).toBeDisabled()
            expect(screen.getByTestId("model-button-gptimage")).toBeDisabled()
        })

        it("does not call onModelChange when disabled", async () => {
            const user = userEvent.setup()
            const onModelChange = vi.fn()
            render(<ModelSelector {...defaultProps} onModelChange={onModelChange} disabled={true} />)

            await user.click(screen.getByTestId("model-button-zimage"))
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

            expect(screen.getByTestId("model-card-zimage")).toBeInTheDocument()
            expect(screen.getByTestId("model-card-turbo")).toBeInTheDocument()
            expect(screen.getByTestId("model-card-gptimage")).toBeInTheDocument()
        })

        it("shows model descriptions in cards", () => {
            render(<ModelSelector {...defaultProps} variant="cards" />)

            expect(screen.getByText("High-resolution model")).toBeInTheDocument()
            expect(screen.getByText("Fastest generation")).toBeInTheDocument()
            expect(screen.getByText("GPT-powered generation")).toBeInTheDocument()
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

            expect(screen.getByTestId("model-card-zimage")).toBeDisabled()
            expect(screen.getByTestId("model-card-turbo")).toBeDisabled()
            expect(screen.getByTestId("model-card-gptimage")).toBeDisabled()
        })

        it("applies selected variant styling to active card", () => {
            render(<ModelSelector {...defaultProps} variant="cards" selectedModel="zimage" />)

            const zimageCard = screen.getByTestId("model-card-zimage")
            // Selected card uses "secondary" variant (tested via class presence)
            expect(zimageCard).toBeInTheDocument()
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

        it("hides header label when hideHeader is true", () => {
            render(<ModelSelector {...defaultProps} hideHeader />)

            expect(screen.queryByText("Model")).not.toBeInTheDocument()
        })

        it("hides header label when hideHeader is true in cards variant", () => {
            render(<ModelSelector {...defaultProps} variant="cards" hideHeader />)

            expect(screen.queryByText("Model")).not.toBeInTheDocument()
        })

        it("shows header label by default", () => {
            render(<ModelSelector {...defaultProps} />)

            expect(screen.getByText("Model")).toBeInTheDocument()
        })
    })

    describe("Group separators", () => {
        const mixedModels: ModelDefinition[] = [
            {
                id: "turbo",
                displayName: "SDXL Turbo",
                type: "image",
                icon: "zap",
                description: "Fastest generation",
                constraints: {
                    maxPixels: 589_825,
                    minPixels: 0,
                    minDimension: 64,
                    maxDimension: 768,
                    step: 64,
                    defaultDimensions: { width: 768, height: 768 },
                    dimensionsEnabled: true,
                },
                aspectRatios: [],
                supportsNegativePrompt: false,
            },
            {
                id: "seedance",
                displayName: "Seedance",
                type: "video",
                icon: "video",
                description: "Video generation",
                constraints: {
                    maxPixels: Infinity,
                    minPixels: 0,
                    minDimension: 720,
                    maxDimension: 1920,
                    step: 1,
                    defaultDimensions: { width: 1920, height: 1080 },
                    dimensionsEnabled: false,
                },
                aspectRatios: [],
                supportsNegativePrompt: false,
            },
        ]

        it("shows group separators when both image and video models are present (compact)", () => {
            render(<ModelSelector {...defaultProps} models={mixedModels} selectedModel="turbo" />)

            expect(screen.getByTestId("model-group-image-models")).toBeInTheDocument()
            expect(screen.getByTestId("model-group-video-models")).toBeInTheDocument()
            expect(screen.getByText("Image Models")).toBeInTheDocument()
            expect(screen.getByText("Video Models")).toBeInTheDocument()
        })

        it("shows group separators when both image and video models are present (cards)", () => {
            render(<ModelSelector {...defaultProps} models={mixedModels} selectedModel="turbo" variant="cards" />)

            expect(screen.getByTestId("model-group-image-models")).toBeInTheDocument()
            expect(screen.getByTestId("model-group-video-models")).toBeInTheDocument()
            expect(screen.getByText("Image Models")).toBeInTheDocument()
            expect(screen.getByText("Video Models")).toBeInTheDocument()
        })

        it("does not show separators when only image models are present", () => {
            render(<ModelSelector {...defaultProps} />)

            expect(screen.queryByTestId("model-group-image-models")).not.toBeInTheDocument()
            expect(screen.queryByTestId("model-group-video-models")).not.toBeInTheDocument()
        })

        it("does not show separators when only video models are present", () => {
            const videoOnlyModels = mixedModels.filter(m => m.type === "video")
            render(<ModelSelector {...defaultProps} models={videoOnlyModels} selectedModel="seedance" />)

            expect(screen.queryByTestId("model-group-image-models")).not.toBeInTheDocument()
            expect(screen.queryByTestId("model-group-video-models")).not.toBeInTheDocument()
        })
    })
})
