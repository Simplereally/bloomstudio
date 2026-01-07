// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import {
    ControlsFeature,
    GenerationSettingsContext,
    BatchModeContext,
    useGenerationSettingsContext,
    useBatchModeContext,
} from "./controls-feature"
import * as React from "react"

// Mock ControlsView
vi.mock("./controls-view", () => ({
    ControlsView: ({
        model,
        width,
        height,
        seed,
        isGenerating,
    }: {
        model: string
        width: number
        height: number
        seed: number
        isGenerating: boolean
    }) => (
        <div data-testid="controls-view">
            <span data-testid="model">{model}</span>
            <span data-testid="dimensions">{width}x{height}</span>
            <span data-testid="seed">{seed}</span>
            <span data-testid="is-generating">{String(isGenerating)}</span>
        </div>
    ),
}))

// Mock hooks
const mockGenerationSettings = {
    model: "flux" as const,
    setModel: vi.fn(),
    handleModelChange: vi.fn(),
    aspectRatios: [],
    aspectRatio: "1:1" as const,
    setAspectRatio: vi.fn(),
    width: 1024,
    setWidth: vi.fn(),
    height: 1024,
    setHeight: vi.fn(),
    handleAspectRatioChange: vi.fn(),
    handleWidthChange: vi.fn(),
    handleHeightChange: vi.fn(),
    dimensionsLinked: false,
    setDimensionsLinked: vi.fn(),
    seed: -1,
    setSeed: vi.fn(),
    seedLocked: false,
    setSeedLocked: vi.fn(),
    generateSeed: vi.fn(() => 12345),
    isRandomMode: vi.fn(() => true),
    refreshSeedIfNeeded: vi.fn(),
    options: { enhance: false, private: false, safe: false },
    setOptions: vi.fn(),
    referenceImage: undefined,
    setReferenceImage: vi.fn(),
    // Video-specific settings
    isVideoModel: false,
    videoSettings: { duration: 5, audio: false },
    setVideoSettings: vi.fn(),
    videoReferenceImages: { firstFrame: undefined, lastFrame: undefined },
    setVideoReferenceImages: vi.fn(),
}

const mockBatchMode = {
    batchSettings: { enabled: false, count: 10 },
    setBatchSettings: vi.fn(),
    activeBatchId: null,
    setActiveBatchId: vi.fn(),
    isBatchActive: false,
    isBatchPaused: false,
    batchStatus: undefined,
    batchProgress: { currentIndex: 0, totalCount: 0, completedCount: 0 },
    startBatchGeneration: vi.fn(),
    pauseBatchGeneration: vi.fn(),
    resumeBatchGeneration: vi.fn(),
    cancelBatchGeneration: vi.fn(),
    handleBatchGenerateItem: vi.fn(),
}

vi.mock("@/hooks/use-generation-settings", () => ({
    useGenerationSettings: () => mockGenerationSettings,
}))

vi.mock("@/hooks/use-batch-mode", () => ({
    useBatchMode: () => mockBatchMode,
}))

vi.mock("@/hooks/queries", () => ({
    useImageModels: () => ({
        models: [{ id: "flux", displayName: "FLUX" }],
        isLoading: false,
    }),
}))

vi.mock("@/hooks/use-dimension-info", () => ({
    useDimensionInfo: () => ({
        megapixels: "1.05",
        isOverLimit: false,
        percentOfLimit: 50,
        hasPixelLimit: true,
        isEnabled: true,
    }),
}))

vi.mock("@/hooks/use-image-gallery-state", () => ({
    useImageGalleryState: () => ({
        addImage: vi.fn(),
    }),
}))

describe("ControlsFeature", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("standalone mode (no context provided)", () => {
        it("renders ControlsView", () => {
            render(<ControlsFeature />)

            expect(screen.getByTestId("controls-view")).toBeInTheDocument()
        })

        it("passes isGenerating prop to ControlsView", () => {
            render(<ControlsFeature isGenerating={true} />)

            expect(screen.getByTestId("is-generating")).toHaveTextContent("true")
        })

        it("defaults isGenerating to false", () => {
            render(<ControlsFeature />)

            expect(screen.getByTestId("is-generating")).toHaveTextContent("false")
        })

        it("passes model from hook to ControlsView", () => {
            render(<ControlsFeature />)

            expect(screen.getByTestId("model")).toHaveTextContent("flux")
        })

        it("passes dimensions from hook to ControlsView", () => {
            render(<ControlsFeature />)

            expect(screen.getByTestId("dimensions")).toHaveTextContent("1024x1024")
        })

        it("passes seed from hook to ControlsView", () => {
            render(<ControlsFeature />)

            expect(screen.getByTestId("seed")).toHaveTextContent("-1")
        })
    })

    describe("integrated mode (context provided)", () => {
        const customGenerationSettings = {
            ...mockGenerationSettings,
            model: "turbo" as const,
            width: 512,
            height: 768,
            seed: 42,
        }

        const customBatchMode = {
            ...mockBatchMode,
            batchSettings: { enabled: true, count: 5 },
        }

        it("uses provided context instead of creating own state", () => {
            render(
                <GenerationSettingsContext.Provider value={customGenerationSettings}>
                    <BatchModeContext.Provider value={customBatchMode}>
                        <ControlsFeature />
                    </BatchModeContext.Provider>
                </GenerationSettingsContext.Provider>
            )

            // Should use context values, not hook defaults
            expect(screen.getByTestId("model")).toHaveTextContent("turbo")
            expect(screen.getByTestId("dimensions")).toHaveTextContent("512x768")
            expect(screen.getByTestId("seed")).toHaveTextContent("42")
        })

        it("passes props correctly in integrated mode", () => {
            render(
                <GenerationSettingsContext.Provider value={customGenerationSettings}>
                    <BatchModeContext.Provider value={customBatchMode}>
                        <ControlsFeature isGenerating={true} />
                    </BatchModeContext.Provider>
                </GenerationSettingsContext.Provider>
            )

            expect(screen.getByTestId("is-generating")).toHaveTextContent("true")
        })

        it("falls back to standalone when only one context is provided", () => {
            // Only GenerationSettingsContext provided, not BatchModeContext
            render(
                <GenerationSettingsContext.Provider value={customGenerationSettings}>
                    <ControlsFeature />
                </GenerationSettingsContext.Provider>
            )

            // Should use hook defaults since both contexts are required for integrated mode
            expect(screen.getByTestId("model")).toHaveTextContent("flux")
        })
    })
})

describe("useGenerationSettingsContext", () => {
    it("throws error when used outside provider", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => { })

        const TestComponent = () => {
            useGenerationSettingsContext()
            return null
        }

        expect(() => render(<TestComponent />)).toThrow(
            "useGenerationSettingsContext must be used within ControlsFeature"
        )

        consoleError.mockRestore()
    })

    it("returns context value when used within provider", () => {
        let contextValue: ReturnType<typeof useGenerationSettingsContext> | null = null

        const ConsumerComponent = () => {
            contextValue = useGenerationSettingsContext()
            return <div>consumed</div>
        }

        render(
            <GenerationSettingsContext.Provider value={mockGenerationSettings}>
                <ConsumerComponent />
            </GenerationSettingsContext.Provider>
        )

        expect(contextValue).toBe(mockGenerationSettings)
    })
})

describe("useBatchModeContext", () => {
    it("throws error when used outside provider", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => { })

        const TestComponent = () => {
            useBatchModeContext()
            return null
        }

        expect(() => render(<TestComponent />)).toThrow(
            "useBatchModeContext must be used within ControlsFeature"
        )

        consoleError.mockRestore()
    })

    it("returns context value when used within provider", () => {
        let contextValue: ReturnType<typeof useBatchModeContext> | null = null

        const ConsumerComponent = () => {
            contextValue = useBatchModeContext()
            return <div>consumed</div>
        }

        render(
            <BatchModeContext.Provider value={mockBatchMode}>
                <ConsumerComponent />
            </BatchModeContext.Provider>
        )

        expect(contextValue).toBe(mockBatchMode)
    })
})
