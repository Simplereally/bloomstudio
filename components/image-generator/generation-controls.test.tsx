import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GenerationControls } from "./generation-controls"

// Mock the hook
const mockHandleGenerate = vi.fn()
const mockSetPrompt = vi.fn()
const mockHandleAspectRatioChange = vi.fn()
const mockHandleWidthChange = vi.fn()
const mockHandleHeightChange = vi.fn()
const mockHandleRandomSeed = vi.fn()
const mockSetSeed = vi.fn()
const mockSetModel = vi.fn()
const mockSetEnhance = vi.fn()
const mockSetPrivateGen = vi.fn()
const mockSetSafe = vi.fn()

vi.mock("@/hooks/use-generation-controls", () => ({
    useGenerationControls: () => ({
        prompt: "Test Prompt",
        setPrompt: mockSetPrompt,
        model: "flux",
        setModel: mockSetModel,
        aspectRatio: "1:1",
        handleAspectRatioChange: mockHandleAspectRatioChange,
        width: 1024,
        handleWidthChange: mockHandleWidthChange,
        height: 1024,
        handleHeightChange: mockHandleHeightChange,
        seed: -1,
        setSeed: mockSetSeed,
        handleRandomSeed: mockHandleRandomSeed,
        enhance: false,
        setEnhance: mockSetEnhance,
        privateGen: false,
        setPrivateGen: mockSetPrivateGen,
        safe: false,
        setSafe: mockSetSafe,
        handleGenerate: mockHandleGenerate,
        currentModel: { id: "flux", name: "Flux", description: "Default" },
    }),
}))

describe("GenerationControls", () => {
    const defaultProps = {
        onGenerate: vi.fn(),
        isGenerating: false,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders all control elements", () => {
        render(<GenerationControls {...defaultProps} />)

        expect(screen.getByTestId("generation-controls")).toBeInTheDocument()
        expect(screen.getByTestId("prompt-input")).toBeInTheDocument()
        expect(screen.getByTestId("model-select")).toBeInTheDocument()
        expect(screen.getByTestId("aspect-ratio-select")).toBeInTheDocument()
        expect(screen.getByTestId("width-slider")).toBeInTheDocument()
        expect(screen.getByTestId("height-slider")).toBeInTheDocument()
        expect(screen.getByTestId("seed-input")).toBeInTheDocument()
        expect(screen.getByTestId("random-seed-button")).toBeInTheDocument()
        expect(screen.getByTestId("enhance-switch")).toBeInTheDocument()
        expect(screen.getByTestId("private-switch")).toBeInTheDocument()
        expect(screen.getByTestId("safe-switch")).toBeInTheDocument()
        expect(screen.getByTestId("generate-button")).toBeInTheDocument()
    })

    it("displays the prompt from the hook", () => {
        render(<GenerationControls {...defaultProps} />)
        expect(screen.getByTestId("prompt-input")).toHaveValue("Test Prompt")
    })

    it("calls setPrompt when prompt input changes", async () => {
        render(<GenerationControls {...defaultProps} />)
        const input = screen.getByTestId("prompt-input")
        await userEvent.type(input, "New prompt")
        expect(mockSetPrompt).toHaveBeenCalled()
    })

    it("calls handleGenerate when generate button is clicked", async () => {
        render(<GenerationControls {...defaultProps} />)
        await userEvent.click(screen.getByTestId("generate-button"))
        expect(mockHandleGenerate).toHaveBeenCalled()
    })

    it("disables inputs when isGenerating is true", () => {
        render(<GenerationControls {...defaultProps} isGenerating={true} />)

        expect(screen.getByTestId("prompt-input")).toBeDisabled()
        expect(screen.getByTestId("model-select")).toBeDisabled()
        expect(screen.getByTestId("aspect-ratio-select")).toBeDisabled()
        expect(screen.getByTestId("width-slider")).toHaveAttribute("aria-disabled", "true")
        expect(screen.getByTestId("height-slider")).toHaveAttribute("aria-disabled", "true")
        expect(screen.getByTestId("seed-input")).toBeDisabled()
        expect(screen.getByTestId("random-seed-button")).toBeDisabled()
        expect(screen.getByTestId("enhance-switch")).toBeDisabled()
        expect(screen.getByTestId("private-switch")).toBeDisabled()
        expect(screen.getByTestId("safe-switch")).toBeDisabled()
        expect(screen.getByTestId("generate-button")).toBeDisabled()
    })

    it("shows loading state on generate button", () => {
        render(<GenerationControls {...defaultProps} isGenerating={true} />)
        expect(screen.getByText("Crafting...")).toBeInTheDocument()
    })

    it("calls handleRandomSeed when dice button is clicked", async () => {
        render(<GenerationControls {...defaultProps} />)
        await userEvent.click(screen.getByTestId("random-seed-button"))
        expect(mockHandleRandomSeed).toHaveBeenCalled()
    })

    it("calls setSeed when seed input changes", async () => {
        render(<GenerationControls {...defaultProps} />)
        const input = screen.getByTestId("seed-input")
        await userEvent.type(input, "123")
        expect(mockSetSeed).toHaveBeenCalled()
    })

    it("calls setEnhance when enhance switch is clicked", async () => {
        render(<GenerationControls {...defaultProps} />)
        await userEvent.click(screen.getByTestId("enhance-switch"))
        expect(mockSetEnhance).toHaveBeenCalled()
    })
})
