import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GenerationControls } from "./generation-controls"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ImageModelInfo } from "@/lib/schemas/pollinations.schema"

// Mock the hook
const mockHandleGenerate = vi.fn()
const mockSetPrompt = vi.fn()
const mockSetNegativePrompt = vi.fn()
const mockHandleAspectRatioChange = vi.fn()
const mockHandleWidthChange = vi.fn()
const mockHandleHeightChange = vi.fn()
const mockHandleRandomSeed = vi.fn()
const mockSetSeed = vi.fn()
const mockSetModel = vi.fn()
const mockSetQuality = vi.fn()
const mockSetEnhance = vi.fn()
const mockSetTransparent = vi.fn()
const mockHandleGuidanceScaleChange = vi.fn()
const mockSetNologo = vi.fn()
const mockSetPrivateGen = vi.fn()
const mockSetSafe = vi.fn()
const mockSetShowAdvanced = vi.fn()
const mockResetToDefaults = vi.fn()

vi.mock("@/hooks/use-generation-controls", () => ({
    useGenerationControls: () => ({
        prompt: "Test Prompt",
        setPrompt: mockSetPrompt,
        negativePrompt: "",
        setNegativePrompt: mockSetNegativePrompt,
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
        quality: "medium",
        setQuality: mockSetQuality,
        enhance: false,
        setEnhance: mockSetEnhance,
        transparent: false,
        setTransparent: mockSetTransparent,
        guidanceScale: undefined,
        handleGuidanceScaleChange: mockHandleGuidanceScaleChange,
        nologo: false,
        setNologo: mockSetNologo,
        privateGen: false,
        setPrivateGen: mockSetPrivateGen,
        safe: false,
        setSafe: mockSetSafe,
        showAdvanced: false,
        setShowAdvanced: mockSetShowAdvanced,
        handleGenerate: mockHandleGenerate,
        resetToDefaults: mockResetToDefaults,
    }),
}))

// Mock the useImageModels hook for ModelSelector
const mockModels: ImageModelInfo[] = [
    {
        name: "flux",
        aliases: ["default"],
        pricing: { currency: "pollen" },
        description: "Default model",
    },
]

vi.mock("@/hooks/queries", () => ({
    useImageModels: () => ({
        models: mockModels,
        isLoading: false,
        isError: false,
        getModel: (name: string) => mockModels.find((m) => m.name === name),
    }),
}))

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    })
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
    Wrapper.displayName = "TestQueryWrapper"
    return Wrapper
}

describe("GenerationControls", () => {
    const defaultProps = {
        onGenerate: vi.fn(),
        isGenerating: false,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders all core control elements", () => {
        render(<GenerationControls {...defaultProps} />, { wrapper: createWrapper() })

        expect(screen.getByTestId("generation-controls")).toBeInTheDocument()
        expect(screen.getByTestId("prompt-input")).toBeInTheDocument()
        expect(screen.getByTestId("model-selector")).toBeInTheDocument()
        expect(screen.getByTestId("quality-select")).toBeInTheDocument()
        expect(screen.getByTestId("aspect-ratio-select")).toBeInTheDocument()
        expect(screen.getByTestId("width-slider")).toBeInTheDocument()
        expect(screen.getByTestId("height-slider")).toBeInTheDocument()
        expect(screen.getByTestId("seed-input")).toBeInTheDocument()
        expect(screen.getByTestId("random-seed-button")).toBeInTheDocument()
        expect(screen.getByTestId("generate-button")).toBeInTheDocument()
        expect(screen.getByTestId("reset-button")).toBeInTheDocument()
    })

    it("renders advanced settings trigger", () => {
        render(<GenerationControls {...defaultProps} />, { wrapper: createWrapper() })
        
        expect(screen.getByTestId("advanced-settings-trigger")).toBeInTheDocument()
    })

    it("displays the prompt from the hook", () => {
        render(<GenerationControls {...defaultProps} />, { wrapper: createWrapper() })
        expect(screen.getByTestId("prompt-input")).toHaveValue("Test Prompt")
    })

    it("calls setPrompt when prompt input changes", async () => {
        const user = userEvent.setup()
        render(<GenerationControls {...defaultProps} />, { wrapper: createWrapper() })
        const input = screen.getByTestId("prompt-input")
        await user.type(input, "New prompt")
        expect(mockSetPrompt).toHaveBeenCalled()
    })

    it("calls handleGenerate when generate button is clicked", async () => {
        const user = userEvent.setup()
        render(<GenerationControls {...defaultProps} />, { wrapper: createWrapper() })
        await user.click(screen.getByTestId("generate-button"))
        expect(mockHandleGenerate).toHaveBeenCalled()
    })

    it("calls resetToDefaults when reset button is clicked", async () => {
        const user = userEvent.setup()
        render(<GenerationControls {...defaultProps} />, { wrapper: createWrapper() })
        await user.click(screen.getByTestId("reset-button"))
        expect(mockResetToDefaults).toHaveBeenCalled()
    })

    it("disables inputs when isGenerating is true", () => {
        render(<GenerationControls {...defaultProps} isGenerating />, {
            wrapper: createWrapper(),
        })

        expect(screen.getByTestId("prompt-input")).toBeDisabled()
        expect(screen.getByTestId("model-selector")).toBeDisabled()
        expect(screen.getByTestId("quality-select")).toBeDisabled()
        expect(screen.getByTestId("aspect-ratio-select")).toBeDisabled()
        expect(screen.getByTestId("width-slider")).toHaveAttribute("aria-disabled", "true")
        expect(screen.getByTestId("height-slider")).toHaveAttribute("aria-disabled", "true")
        expect(screen.getByTestId("seed-input")).toBeDisabled()
        expect(screen.getByTestId("random-seed-button")).toBeDisabled()
        expect(screen.getByTestId("generate-button")).toBeDisabled()
        expect(screen.getByTestId("reset-button")).toBeDisabled()
    })

    it("shows loading state on generate button", () => {
        render(<GenerationControls {...defaultProps} isGenerating />, {
            wrapper: createWrapper(),
        })
        expect(screen.getByText("Crafting...")).toBeInTheDocument()
    })

    it("calls handleRandomSeed when dice button is clicked", async () => {
        const user = userEvent.setup()
        render(<GenerationControls {...defaultProps} />, { wrapper: createWrapper() })
        await user.click(screen.getByTestId("random-seed-button"))
        expect(mockHandleRandomSeed).toHaveBeenCalled()
    })

    it("calls setSeed when seed input changes", async () => {
        const user = userEvent.setup()
        render(<GenerationControls {...defaultProps} />, { wrapper: createWrapper() })
        const input = screen.getByTestId("seed-input")
        await user.type(input, "123")
        expect(mockSetSeed).toHaveBeenCalled()
    })

    it("opens advanced settings when trigger is clicked", async () => {
        const user = userEvent.setup()
        render(<GenerationControls {...defaultProps} />, { wrapper: createWrapper() })
        await user.click(screen.getByTestId("advanced-settings-trigger"))
        expect(mockSetShowAdvanced).toHaveBeenCalledWith(true)
    })
})
