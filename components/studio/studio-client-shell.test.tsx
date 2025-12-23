// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { StudioClientShell } from "./studio-client-shell"
import { useStudioClientShell } from "@/hooks/use-studio-client-shell"

// Mock the hook
vi.mock("@/hooks/use-studio-client-shell", () => ({
    useStudioClientShell: vi.fn()
}))

// Mock ClerkUserButton
vi.mock("@/components/clerk-user-button", () => ({
    ClerkUserButton: () => <div data-testid="clerk-user-button" />
}))

// Mock ClerkUserButton
vi.mock("@/components/clerk-user-button", () => ({
    ClerkUserButton: () => <div data-testid="clerk-user-button" />
}))

// Mock Dialog
vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ open, children }: { open?: boolean; children?: React.ReactNode }) => open ? <div data-testid="fullscreen-dialog">{children}</div> : null,
    DialogContent: ({ children }: { children?: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
    DialogOverlay: () => <div data-testid="dialog-overlay" />,
    DialogPortal: ({ children }: { children?: React.ReactNode }) => <div data-testid="dialog-portal">{children}</div>,
    DialogTitle: ({ children }: { children?: React.ReactNode }) => <div data-testid="dialog-title">{children}</div>,
    DialogDescription: ({ children }: { children?: React.ReactNode }) => <div data-testid="dialog-description">{children}</div>,
}))

// Mock Resizable components
vi.mock("@/components/ui/resizable", () => ({
    ResizablePanelGroup: ({ children }: { children?: React.ReactNode }) => <div data-testid="resizable-group">{children}</div>,
    ResizablePanel: ({ children, id }: { children?: React.ReactNode; id?: string }) => <div data-testid={`resizable-panel-${id}`}>{children}</div>,
    ResizableHandle: () => <div data-testid="resizable-handle" />,
}))

// Mock Tooltip components to avoid portal issues in tests
vi.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    TooltipProvider: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

// Mock hooks/queries to avoid actual react-query usage in tests
vi.mock("@/hooks/queries", () => ({
    useImageModels: () => ({ models: [], isLoading: false }),
}))

// Mock ImageCanvas to avoid styled-jsx warnings in tests
vi.mock("@/components/studio/canvas/image-canvas", () => ({
     
    ImageCanvas: ({ image, isGenerating, className }: { image?: { url: string; prompt: string } | null; isGenerating?: boolean; className?: string }) => (
        <div data-testid="image-canvas" className={className}>
            {isGenerating && <div data-testid="loading-state">Loading...</div>}
            {/* eslint-disable-next-line @next/next/no-img-element -- Test mock */}
            {image && <img src={image.url} alt={image.prompt} data-testid="generated-image" />}
        </div>
    ),
}))
describe("StudioClientShell", () => {
    const mockHookReturn = {
        prompt: "",
        setPrompt: vi.fn(),
        negativePrompt: "",
        setNegativePrompt: vi.fn(),
        model: "flux",
        setModel: vi.fn(),
        aspectRatio: "1:1",
        width: 1024,
        height: 1024,
        seed: -1,
        setSeed: vi.fn(),
        seedLocked: false,
        setSeedLocked: vi.fn(),
        options: { enhance: false, private: false, safe: false },
        setOptions: vi.fn(),
        isGenerating: false,
        showLeftSidebar: true,
        setShowLeftSidebar: vi.fn(),
        showGallery: true,
        setShowGallery: vi.fn(),
        selectionMode: false,
        setSelectionMode: vi.fn(),
        selectedIds: new Set(),
        setSelectedIds: vi.fn(),
        images: [],
        currentImage: null,
        setCurrentImage: vi.fn(),
        promptHistory: [],
        handleAspectRatioChange: vi.fn(),
        handleWidthChange: vi.fn(),
        handleHeightChange: vi.fn(),
        handleGenerate: vi.fn(),
        handleRemoveImage: vi.fn(),
        handleDeleteSelected: vi.fn(),
        handleDownload: vi.fn(),
        handleCopyUrl: vi.fn(),
        handleRegenerate: vi.fn(),
        handleOpenInNewTab: vi.fn(),
        isFullscreen: false,
        setIsFullscreen: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Default mock implementation
        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue(mockHookReturn)
    })

    it("renders the studio components", () => {
        render(<StudioClientShell />)

        expect(screen.getByTestId("studio-header")).toBeInTheDocument()
        expect(screen.getByTestId("clerk-user-button")).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/describe the image you want to create/i)).toBeInTheDocument()
        expect(screen.getByText("Generate Image")).toBeInTheDocument()
    })

    it("triggers generation when generate button is clicked", () => {
        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue({
            ...mockHookReturn,
            prompt: "A test prompt",
        })

        render(<StudioClientShell />)

        const generateButton = screen.getByText("Generate Image")
        fireEvent.click(generateButton)

        expect(mockHookReturn.handleGenerate).toHaveBeenCalled()
    })

    it("shows loading state during generation", () => {
        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue({
            ...mockHookReturn,
            isGenerating: true,
            prompt: "A test prompt",
        })

        render(<StudioClientShell />)

        expect(screen.getByText("Generating...")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /generating/i })).toBeDisabled()
    })

    it("toggles sidebar visibility", () => {
        render(<StudioClientShell />)

        const toggleSidebarButton = screen.getByTestId("toggle-left-sidebar")
        fireEvent.click(toggleSidebarButton)

        expect(mockHookReturn.setShowLeftSidebar).toHaveBeenCalled()
    })

    it("toggles gallery visibility", () => {
        render(<StudioClientShell />)

        const toggleGalleryButton = screen.getByTestId("toggle-right-panel")
        fireEvent.click(toggleGalleryButton)

        expect(mockHookReturn.setShowGallery).toHaveBeenCalled()
    })

    it("renders fullscreen dialog when isFullscreen is true", () => {
        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue({
            ...mockHookReturn,
            isFullscreen: true,
            currentImage: {
                id: "1",
                url: "test.jpg",
                prompt: "test",
                params: { width: 1024, height: 1024 }
            }
        })

        render(<StudioClientShell />)

        expect(screen.getByTestId("fullscreen-dialog")).toBeInTheDocument()

        // Should have 2 images: one in canvas, one in fullscreen
        const images = screen.getAllByRole("img", { name: "test" })
        expect(images).toHaveLength(2)
    })
})
