// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { StudioShell, type StudioShellProps } from "./studio-shell"
import { useQuery } from "convex/react"
import type { GeneratedImage } from "@/types/pollinations"
import { toast } from "sonner"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
        info: vi.fn(),
    },
}))

// Mock API
vi.mock("@/convex/_generated/api", () => ({
    api: {
        stripe: {
            getUserSubscriptionStatus: "getUserSubscriptionStatus",
        },
    },
}))

// Mock all feature components
vi.mock("@/components/studio/features/prompt", () => ({
    PromptFeature: ({ isGenerating, showNegativePrompt }: { isGenerating: boolean; showNegativePrompt: boolean }) => (
        <div data-testid="prompt-feature">
            <span data-testid="prompt-is-generating">{String(isGenerating)}</span>
            <span data-testid="prompt-show-negative">{String(showNegativePrompt)}</span>
        </div>
    ),
    PromptManagerContext: {
        Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    },
}))

vi.mock("@/components/studio/features/generation", () => ({
    ControlsFeature: ({ isGenerating }: { isGenerating: boolean }) => (
        <div data-testid="controls-feature">
            <span data-testid="controls-is-generating">{String(isGenerating)}</span>
        </div>
    ),
    GenerationSettingsContext: {
        Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    },
    BatchModeContext: {
        Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    },
}))

vi.mock("@/components/studio/features/canvas", () => ({
    CanvasFeature: ({ currentImage, isGenerating }: { currentImage: GeneratedImage | null; isGenerating: boolean }) => (
        <div data-testid="canvas-feature">
            <span data-testid="canvas-has-image">{String(!!currentImage)}</span>
            <span data-testid="canvas-is-generating">{String(isGenerating)}</span>
        </div>
    ),
}))

vi.mock("@/components/studio/features/history", () => ({
    GalleryFeature: ({ activeImageId, thumbnailSize }: { activeImageId?: string; thumbnailSize?: string }) => (
        <div data-testid="gallery-feature">
            <span data-testid="gallery-active-id">{activeImageId || "none"}</span>
            <span data-testid="gallery-thumbnail-size">{thumbnailSize}</span>
        </div>
    ),
}))

// Mock studio layout components
vi.mock("@/components/studio", () => ({
    ApiKeyOnboardingModal: () => <div data-testid="api-key-modal" />,
    UpgradeModal: () => <div data-testid="upgrade-modal" />,
    StudioHeader: ({
        leftSidebarOpen,
        onToggleLeftSidebar,
        rightPanelOpen,
        onToggleRightPanel,
    }: {
        leftSidebarOpen: boolean
        onToggleLeftSidebar: () => void
        rightPanelOpen: boolean
        onToggleRightPanel: () => void
    }) => (
        <div data-testid="studio-header">
            <span data-testid="left-sidebar-open">{String(leftSidebarOpen)}</span>
            <span data-testid="right-panel-open">{String(rightPanelOpen)}</span>
            <button data-testid="toggle-left" onClick={onToggleLeftSidebar}>Toggle Left</button>
            <button data-testid="toggle-right" onClick={onToggleRightPanel}>Toggle Right</button>
        </div>
    ),
    StudioLayout: ({
        sidebar,
        canvas,
        gallery,
        showSidebar,
        showGallery,
    }: {
        sidebar: React.ReactNode
        canvas: React.ReactNode
        gallery: React.ReactNode
        showSidebar: boolean
        showGallery: boolean
    }) => (
        <div data-testid="studio-layout">
            <span data-testid="show-sidebar">{String(showSidebar)}</span>
            <span data-testid="show-gallery">{String(showGallery)}</span>
            <div data-testid="sidebar-content">{sidebar}</div>
            <div data-testid="canvas-content">{canvas}</div>
            <div data-testid="gallery-content">{gallery}</div>
        </div>
    ),
}))

vi.mock("@/components/images/image-lightbox", () => ({
    ImageLightbox: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
        <div data-testid="image-lightbox">
            <span data-testid="lightbox-open">{String(isOpen)}</span>
            <button data-testid="lightbox-close" onClick={onClose}>Close</button>
        </div>
    ),
}))

// Mock hooks
const mockPromptManager = {
    promptSectionRef: { current: null },
    promptHistory: [],
    addToPromptHistory: vi.fn(),
    suggestions: [],
    isLoadingSuggestions: false,
    fetchSuggestions: vi.fn(),
    isEnhancingPrompt: false,
    enhancePrompt: vi.fn(),
    cancelEnhancePrompt: vi.fn(),
    isEnhancingNegativePrompt: false,
    enhanceNegativePrompt: vi.fn(),
    cancelEnhanceNegativePrompt: vi.fn(),
    handlePromptContentChange: vi.fn(),
    handleSelectHistory: vi.fn(),
    hasPromptContent: true, // Set to true so generate button is enabled
    setHasPromptContent: vi.fn(),
    getPromptValues: vi.fn(() => ({ prompt: "Test prompt", negativePrompt: "" })),
}

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
    cancelBatchGeneration: vi.fn(),
    pauseBatchGeneration: vi.fn(),
    resumeBatchGeneration: vi.fn(),
    handleBatchGenerateItem: vi.fn(),
}

const mockStudioUI = {
    showLeftSidebar: true,
    setShowLeftSidebar: vi.fn(),
    toggleLeftSidebar: vi.fn(),
    showGallery: true,
    setShowGallery: vi.fn(),
    toggleGallery: vi.fn(),
    isFullscreen: false,
    setIsFullscreen: vi.fn(),
    lightboxImage: null,
    setLightboxImage: vi.fn(),
    openLightbox: vi.fn(),
    closeLightbox: vi.fn(),
}

const mockGalleryState = {
    images: [],
    currentImage: null,
    addImage: vi.fn(),
    handleRemoveImage: vi.fn(),
    setCurrentImage: vi.fn(),
}

const mockGenerate = vi.fn()

vi.mock("@/hooks/use-prompt-manager", () => ({
    usePromptManager: () => mockPromptManager,
}))

vi.mock("@/hooks/use-generation-settings", () => ({
    useGenerationSettings: () => mockGenerationSettings,
}))

vi.mock("@/hooks/use-batch-mode", () => ({
    useBatchMode: () => mockBatchMode,
}))

vi.mock("@/hooks/use-studio-ui", () => ({
    useStudioUI: () => mockStudioUI,
}))

vi.mock("@/hooks/use-image-gallery-state", () => ({
    useImageGalleryState: () => mockGalleryState,
}))

vi.mock("@/hooks/queries", () => ({
    useGenerateImage: () => ({
        generate: mockGenerate,
        isGenerating: false,
    }),
}))

vi.mock("@/hooks/use-subscription-status", () => ({
    useSubscriptionStatus: vi.fn(() => ({
        status: "pro",
        isLoading: false,
        canGenerate: true,
    })),
}))

vi.mock("@/lib/config/models", () => ({
    getModelSupportsNegativePrompt: vi.fn(() => true),
}))

vi.mock("@/lib/errors", () => ({
    showAuthRequiredToast: vi.fn(),
    showErrorToast: vi.fn(),
}))

vi.mock("convex/react", () => ({
    useConvexAuth: vi.fn(() => ({
        isAuthenticated: true,
        isLoading: false,
    })),
    useMutation: vi.fn(() => vi.fn()),
    useQuery: vi.fn(() => ({ status: "pro" })), // Default to pro for existing tests
}))

// Mock UI components
vi.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
        <button onClick={onClick} disabled={disabled} data-testid="generate-button">
            {children}
        </button>
    ),
}))

vi.mock("@/components/ui/scroll-area", () => ({
    ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock utils - isLocalhost returns false by default so dev-only modals don't render in tests
vi.mock("@/lib/utils", () => ({
    isLocalhost: vi.fn(() => false),
    cn: (...inputs: string[]) => inputs.filter(Boolean).join(" "),
}))

// Mock next/navigation with mutable search params
const mockSearchParams = new URLSearchParams()
vi.mock("next/navigation", () => ({
    useSearchParams: vi.fn(() => mockSearchParams),
}))

describe("StudioShell", () => {
    const defaultProps: StudioShellProps = {}

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders all main components", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("studio-header")).toBeInTheDocument()
        expect(screen.getByTestId("studio-layout")).toBeInTheDocument()
        expect(screen.getByTestId("image-lightbox")).toBeInTheDocument()
        // Note: api-key-modal and upgrade-modal are gated behind isLocalhost which is mocked to return false
    })

    it("renders prompt feature in sidebar", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("prompt-feature")).toBeInTheDocument()
    })

    it("renders controls feature in sidebar", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("controls-feature")).toBeInTheDocument()
    })

    it("renders canvas feature", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("canvas-feature")).toBeInTheDocument()
    })

    it("renders gallery feature", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("gallery-feature")).toBeInTheDocument()
    })

    it("renders generate button", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("generate-button")).toBeInTheDocument()
    })

    it("passes sidebar visibility state to layout", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("show-sidebar")).toHaveTextContent("true")
    })

    it("passes gallery visibility state to layout", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("show-gallery")).toHaveTextContent("true")
    })

    it("passes sidebar open state to header", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("left-sidebar-open")).toHaveTextContent("true")
    })

    it("passes right panel open state to header", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("right-panel-open")).toHaveTextContent("true")
    })

    it("calls toggleLeftSidebar when header toggle clicked", () => {
        render(<StudioShell {...defaultProps} />)

        fireEvent.click(screen.getByTestId("toggle-left"))

        expect(mockStudioUI.toggleLeftSidebar).toHaveBeenCalledTimes(1)
    })

    it("calls toggleGallery when header toggle clicked", () => {
        render(<StudioShell {...defaultProps} />)

        fireEvent.click(screen.getByTestId("toggle-right"))

        expect(mockStudioUI.toggleGallery).toHaveBeenCalledTimes(1)
    })

    it("lightbox is initially closed", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("lightbox-open")).toHaveTextContent("false")
    })

    it("calls closeLightbox when lightbox close button clicked", () => {
        render(<StudioShell {...defaultProps} />)

        fireEvent.click(screen.getByTestId("lightbox-close"))

        expect(mockStudioUI.closeLightbox).toHaveBeenCalledTimes(1)
    })

    it("passes gallery thumbnail size", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("gallery-thumbnail-size")).toHaveTextContent("md")
    })

    it("triggers generation when generate button is clicked", async () => {
        render(<StudioShell {...defaultProps} />)

        fireEvent.click(screen.getByTestId("generate-button"))

        // Wait for the async operations
        await waitFor(() => {
            expect(mockPromptManager.addToPromptHistory).toHaveBeenCalledWith("Test prompt")
        })
    })

    it("shows Generate Image text on button by default", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("generate-button")).toHaveTextContent("Generate Image")
    })

    describe("Upgrade Verification Flow", () => {


        beforeEach(() => {
            mockSearchParams.delete("upgraded")
        })

        it("shows success toast when upgraded=true and status is pro", () => {
            mockSearchParams.set("upgraded", "true")
            vi.mocked(useSubscriptionStatus).mockReturnValueOnce({
                status: "pro",
                isLoading: false,
                canGenerate: true,
            })

            render(<StudioShell {...defaultProps} />)

            expect(toast.success).toHaveBeenCalledWith("Welcome to Pro!", expect.any(Object))
            expect(toast.dismiss).toHaveBeenCalledWith("upgrade-loading")
        })

        it("shows loading toast when upgraded=true but status is still syncing", () => {
            mockSearchParams.set("upgraded", "true")
            vi.mocked(useSubscriptionStatus).mockReturnValueOnce({
                status: "expired",
                isLoading: false,
                canGenerate: false,
            })

            render(<StudioShell {...defaultProps} />)

            expect(toast.loading).toHaveBeenCalledWith("Finalizing your upgrade...", expect.any(Object))
        })

        it("blocks generation and shows info toast when status is syncing", () => {
            mockSearchParams.set("upgraded", "true")
            vi.mocked(useSubscriptionStatus).mockReturnValueOnce({
                status: "expired",
                isLoading: false,
                canGenerate: false,
            })

            render(<StudioShell {...defaultProps} />)

            fireEvent.click(screen.getByTestId("generate-button"))

            expect(toast.info).toHaveBeenCalledWith(
                "Please wait while we confirm your subscription...",
                expect.any(Object)
            )
            // Should NOT trigger generation
            expect(mockPromptManager.addToPromptHistory).not.toHaveBeenCalled()
        })

        it("allows generation when status becomes pro", async () => {
            mockSearchParams.set("upgraded", "true")
            vi.mocked(useSubscriptionStatus).mockReturnValueOnce({
                status: "pro",
                isLoading: false,
                canGenerate: true,
            })

            render(<StudioShell {...defaultProps} />)

            fireEvent.click(screen.getByTestId("generate-button"))

            await waitFor(() => {
                expect(mockPromptManager.addToPromptHistory).toHaveBeenCalledWith("Test prompt")
            })
        })
    })
})
