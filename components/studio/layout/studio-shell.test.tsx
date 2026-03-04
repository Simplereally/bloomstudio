// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { StudioShell, type StudioShellProps } from "./studio-shell"
import type { GeneratedImage } from "@/types/pollinations"
import { toast } from "sonner"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"

// Mock server actions to avoid server-only import error
vi.mock("@/app/_server/actions/invalidation", () => ({
    invalidateUserFavoritesCache: vi.fn(),
    invalidateUserHistoryCache: vi.fn(),
    invalidatePublicFeedCache: vi.fn(),
    invalidateVisibilityChange: vi.fn(),
    invalidateImageDeletion: vi.fn(),
    invalidateFollowChange: vi.fn(),
    invalidateUserFollowingFeedCache: vi.fn(),
}))

vi.mock("@/app/_server/actions/history", () => ({
    loadMyHistoryPage: vi.fn(),
    loadMyHistoryWithDisplayPage: vi.fn(),
}))

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
        singleGeneration: {
            getActiveGenerations: "getActiveGenerations",
            cancelGeneration: "cancelGeneration",
        },
        generatedImages: {
            getMyImages: "getMyImages",
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
    ControlsFeature: ({ isGenerating, historyImages }: { isGenerating: boolean; historyImages?: unknown[] }) => (
        <div data-testid="controls-feature">
            <span data-testid="controls-is-generating">{String(isGenerating)}</span>
            <span data-testid="controls-history-images-count">{historyImages?.length ?? "none"}</span>
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
    CanvasFeature: ({ currentImage, isGenerating, queueItems, onCancelItem }: { currentImage: GeneratedImage | null; isGenerating: boolean; queueItems?: Array<{ id: string; aspectRatio: number }>; onCancelItem?: (id: string) => void }) => (
        <div data-testid="canvas-feature">
            <span data-testid="canvas-has-image">{String(!!currentImage)}</span>
            <span data-testid="canvas-is-generating">{String(isGenerating)}</span>
            <span data-testid="canvas-queue-count">{queueItems?.length ?? 0}</span>
            <span data-testid="canvas-has-cancel">{String(typeof onCancelItem === "function")}</span>
            <span data-testid="canvas-queue-ratios">{JSON.stringify(queueItems?.map(q => q.aspectRatio) ?? [])}</span>
            {queueItems?.map((item) => (
                <button
                    key={item.id}
                    data-testid={`queue-cancel-${item.id}`}
                    onClick={() => onCancelItem?.(item.id)}
                >
                    Cancel {item.id}
                </button>
            ))}
        </div>
    ),
}))

vi.mock("@/components/studio/features/history", () => ({
    GalleryFeature: ({ activeImageId, thumbnailSize, onImagesLoaded }: { activeImageId?: string; thumbnailSize?: string; onImagesLoaded?: (images: unknown[]) => void }) => (
        <div data-testid="gallery-feature">
            <span data-testid="gallery-active-id">{activeImageId || "none"}</span>
            <span data-testid="gallery-thumbnail-size">{thumbnailSize}</span>
            <span data-testid="gallery-has-onimagesloaded">{String(typeof onImagesLoaded === "function")}</span>
        </div>
    ),
}))

// Mock studio layout components
vi.mock("@/components/studio", () => ({
    ApiKeyOnboardingModal: () => <div data-testid="api-key-modal" />,
    UpgradeModal: () => <div data-testid="upgrade-modal" />,
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
    BatchConfigButton: () => <div data-testid="batch-config-button" />,
}))

vi.mock("@/components/images/image-lightbox", () => ({
    ImageLightbox: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
        <div data-testid="image-lightbox">
            <span data-testid="lightbox-open">{String(isOpen)}</span>
            <button data-testid="lightbox-close" onClick={onClose}>Close</button>
        </div>
    ),
}))

vi.mock("@/components/pollen-balance/low-balance-warning-dialog", () => ({
    LowBalanceWarningDialog: () => <div data-testid="low-balance-warning-dialog" />,
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
    supportsSeed: true,
    options: { private: false, safe: false },
    setOptions: vi.fn(),
    referenceImage: undefined,
    setReferenceImage: vi.fn(),
    isVideoModel: false,
    videoSettings: { duration: 5, audio: false },
    setVideoSettings: vi.fn(),
    videoReferenceImages: [],
    setVideoReferenceImages: vi.fn(),
    resolutionTier: "hd" as const,
    setResolutionTier: vi.fn(),
    handleResolutionTierChange: vi.fn(),
    supportedTiers: ["hd"] as const,
    constraints: undefined,
}

const mockBatchMode = {
    batchSettings: { enabled: false, count: 10 },
    setBatchSettings: vi.fn(),
    activeBatchId: null,
    setActiveBatchId: vi.fn(),
    isBatchActive: false,
    isBatchPaused: false,
    batchStatus: undefined,
    batchProgress: { currentIndex: 0, totalCount: 0, completedCount: 0, inFlightCount: 0 },
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

const mockCancelGenerationById = vi.fn()
vi.mock("@/hooks/queries", () => ({
    useGenerateImage: () => ({
        generate: mockGenerate,
        cancelGenerationById: mockCancelGenerationById,
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

vi.mock("@/hooks/use-pollen-balance", () => ({
    usePollenBalance: vi.fn(() => ({
        balance: 10.00,
        formattedBalance: "10.00",
        isLoading: false,
        isError: false,
        error: null,
        isLowBalance: false,
        refetch: vi.fn(),
        invalidateBalance: vi.fn(),
        isRefreshing: false,
    })),
}))

vi.mock("@/hooks/use-estimated-cost", () => ({
    useEstimatedCost: vi.fn(() => ({
        estimatedCost: 0.15,
        canAfford: true,
        willDepleteBalance: false,
        remainingAfter: 9.85,
        formattedCost: "0.15",
    })),
    formatRemainingBalance: vi.fn((value: number) => value.toFixed(2)),
    LOW_BALANCE_AFTER_GENERATION_THRESHOLD: 0.5,
}))

vi.mock("@/lib/config/models", () => ({
    getModelSupportsNegativePrompt: vi.fn(() => true),
    getModel: vi.fn(() => ({ displayName: "Flux" })),
}))

vi.mock("@/lib/errors", () => ({
    showAuthRequiredToast: vi.fn(),
    showErrorToast: vi.fn(),
}))

// Mutable mock for active generations query (used by useQuery mock)
let mockActiveGenerations: unknown[] = []

vi.mock("convex/react", () => ({
    useConvexAuth: vi.fn(() => ({
        isAuthenticated: true,
        isLoading: false,
    })),
    useMutation: vi.fn(() => vi.fn()),
    useQuery: vi.fn((apiRef: unknown, args: unknown) => {
        if (args === "skip") return undefined
        if (apiRef === "getActiveGenerations") return mockActiveGenerations
        return { status: "pro" }
    }),
    usePaginatedQuery: vi.fn(() => ({
        results: [],
        status: "Exhausted",
        loadMore: vi.fn(),
    })),
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

vi.mock("@/components/studio/batch/batch-action-button", () => ({
    BatchActionButton: ({ onPause, onResume, onCancel, isPaused, completedCount, totalCount, inFlightCount }: {
        isPaused: boolean
        completedCount: number
        totalCount: number
        inFlightCount?: number
        onPause: () => void
        onResume: () => void
        onCancel: () => void
    }) => (
        <div data-testid="batch-action-button">
            <button onClick={isPaused ? onResume : onPause} data-testid="batch-toggle">
                {isPaused ? "Resume" : "Pause"} ({completedCount}/{totalCount})
                {isPaused && inFlightCount && inFlightCount > 0 ? ` + ${inFlightCount} finishing` : ""}
            </button>
            <button onClick={onCancel} data-testid="batch-cancel">Cancel</button>
        </div>
    ),
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
        mockActiveGenerations = []
    })

    it("renders all main components", () => {
        render(<StudioShell {...defaultProps} />)

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

    // Note: Header toggle tests removed - sidebar rails now handle toggles natively via SidebarProvider

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

    it("passes onImagesLoaded callback to GalleryFeature", () => {
        render(<StudioShell {...defaultProps} />)

        expect(screen.getByTestId("gallery-has-onimagesloaded")).toHaveTextContent("true")
    })

    it("passes historyImages to ControlsFeature (initially empty)", () => {
        render(<StudioShell {...defaultProps} />)

        // Before any gallery callback fires, historyImages is an empty array (initial useState)
        expect(screen.getByTestId("controls-history-images-count")).toHaveTextContent("0")
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

    it("calls cancelGenerationById when queue-item cancel is clicked", async () => {
        mockActiveGenerations = [
            {
                _id: "gen_abc",
                status: "processing",
                createdAt: 1000,
                generationParams: { width: 1024, height: 1024 },
            },
        ]
        mockCancelGenerationById.mockResolvedValueOnce({ success: true })

        render(<StudioShell {...defaultProps} />)

        fireEvent.click(screen.getByTestId("queue-cancel-gen_abc"))

        await waitFor(() => {
            expect(mockCancelGenerationById).toHaveBeenCalledTimes(1)
            expect(mockCancelGenerationById).toHaveBeenCalledWith("gen_abc")
        })
    })

    describe("Aspect Ratio Guard", () => {
        it("clamps aspectRatio to 1 when height is 0 or missing", () => {
            mockActiveGenerations = [
                {
                    _id: "gen_zero_h",
                    status: "pending",
                    createdAt: 1000,
                    generationParams: { width: 1024, height: 0 },
                },
                {
                    _id: "gen_missing_h",
                    status: "processing",
                    createdAt: 2000,
                    generationParams: { width: 512 },
                },
                {
                    _id: "gen_normal",
                    status: "pending",
                    createdAt: 3000,
                    generationParams: { width: 1920, height: 1080 },
                },
            ]

            render(<StudioShell {...defaultProps} />)

            expect(screen.getByTestId("canvas-queue-count")).toHaveTextContent("3")

            // Parse the rendered aspect ratios
            const ratiosText = screen.getByTestId("canvas-queue-ratios").textContent
            const ratios = JSON.parse(ratiosText!)

            // height=0 → fallback to 1
            expect(ratios[0]).toBe(1)
            // missing height → defaults to 1024, so 512/1024 = 0.5
            expect(ratios[1]).toBe(0.5)
            // normal: 1920/1080 ≈ 1.778
            expect(ratios[2]).toBeCloseTo(1920 / 1080, 5)
        })

        it("filters out non-pending/processing statuses from queue items", () => {
            mockActiveGenerations = [
                {
                    _id: "gen_completed",
                    status: "completed",
                    createdAt: 1000,
                    generationParams: { width: 1024, height: 1024 },
                },
                {
                    _id: "gen_pending",
                    status: "pending",
                    createdAt: 2000,
                    generationParams: { width: 1024, height: 1024 },
                },
            ]

            render(<StudioShell {...defaultProps} />)

            // Only the pending one should appear
            expect(screen.getByTestId("canvas-queue-count")).toHaveTextContent("1")
        })
    })
})
