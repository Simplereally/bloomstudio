// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within, act } from "@testing-library/react"
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

// Mock Radix UI Portal and Dialog to work in JSDOM
vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ open, children, onOpenChange }: { open?: boolean; children?: React.ReactNode; onOpenChange?: (open: boolean) => void }) =>
        open ? <div data-testid="fullscreen-dialog" onClick={() => onOpenChange?.(false)}>{children}</div> : null,
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

// Mock hooks/queries
vi.mock("@/hooks/queries", () => ({
    useImageModels: () => ({ models: [], isLoading: false }),
    useEnhancePrompt: ({ onSuccess }: { onSuccess?: (text: string) => void } = {}) => ({
        enhance: vi.fn(({ prompt }) => onSuccess?.(prompt + " enhanced")),
        cancel: vi.fn(),
        isEnhancing: false,
    }),
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
        handleModelChange: vi.fn(),
        handleGenerate: vi.fn(),
        handleRemoveImage: vi.fn(),
        handleDeleteSelected: vi.fn(),
        handleDownload: vi.fn(),
        handleCopyUrl: vi.fn(),
        handleRegenerate: vi.fn(),
        handleOpenInNewTab: vi.fn(),
        isFullscreen: false,
        setIsFullscreen: vi.fn(),
        aspectRatios: [
            { label: "Square", value: "1:1", width: 1000, height: 1000, icon: "square", category: "square" },
            { label: "Custom", value: "custom", width: 1000, height: 1000, icon: "sliders", category: "square" },
        ],
    }

    beforeEach(() => {
        vi.clearAllMocks()
        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue(mockHookReturn)

        // Mock document.execCommand to avoid JSDOM warnings
        if (typeof document !== 'undefined') {
            document.execCommand = vi.fn().mockReturnValue(true)
        }
    })

    it("renders core layout components", () => {
        render(<StudioClientShell />)

        expect(screen.getByTestId("studio-header")).toBeInTheDocument()
        expect(screen.getByTestId("clerk-user-button")).toBeInTheDocument()
        expect(screen.getByTestId("prompt-composer")).toBeInTheDocument()
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

    it("shows generating state", () => {
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

    it("toggles sidebars via header controls", () => {
        render(<StudioClientShell />)

        fireEvent.click(screen.getByTestId("toggle-left-sidebar"))
        expect(mockHookReturn.setShowLeftSidebar).toHaveBeenCalled()

        fireEvent.click(screen.getByTestId("toggle-right-panel"))
        expect(mockHookReturn.setShowGallery).toHaveBeenCalled()
    })

    it("handles prompt enhancement", () => {
        const setPrompt = vi.fn()
        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue({
            ...mockHookReturn,
            prompt: "forest",
            setPrompt,
        })

        render(<StudioClientShell />)

        const enhanceButtons = screen.getAllByTestId("enhance-button-wand")
        // The first one is for the main prompt
        fireEvent.click(enhanceButtons[0])

        expect(setPrompt).toHaveBeenCalledWith("forest enhanced")
    })

    it("handles negative prompt enhancement", () => {
        const setNegativePrompt = vi.fn()
        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue({
            ...mockHookReturn,
            prompt: "forest",
            negativePrompt: "buildings",
            setNegativePrompt,
        })

        render(<StudioClientShell />)

        // Toggle negative prompt area
        fireEvent.click(screen.getByTestId("negative-prompt-toggle"))

        const enhanceButtons = screen.getAllByTestId("enhance-button-wand")
        // The second one is for the negative prompt
        fireEvent.click(enhanceButtons[1])

        expect(setNegativePrompt).toHaveBeenCalledWith("forest enhanced")
    })

    it("adds suggestions to prompt", () => {
        const setPrompt = vi.fn()
        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue({
            ...mockHookReturn,
            prompt: "forest",
            setPrompt,
        })

        render(<StudioClientShell />)

        const suggestion = screen.getByText("+ cinematic lighting")
        fireEvent.click(suggestion)

        expect(setPrompt).toHaveBeenCalledWith("forest cinematic lighting")
    })

    it("selects from prompt history", () => {
        const setPrompt = vi.fn()
        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue({
            ...mockHookReturn,
            promptHistory: ["previous prompt"],
            setPrompt,
        })

        render(<StudioClientShell />)

        fireEvent.click(screen.getByTestId("history-toggle"))
        fireEvent.click(screen.getByText("previous prompt"))

        expect(setPrompt).toHaveBeenCalledWith("previous prompt")
    })

    it("handles image actions in toolbar", async () => {
        const currentImage = {
            id: "1",
            url: "test.jpg",
            prompt: "test image",
            params: { width: 1024, height: 1024, model: "flux" }
        }

        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue({
            ...mockHookReturn,
            currentImage,
        })

        render(<StudioClientShell />)

        fireEvent.click(screen.getByTestId("download-button"))
        expect(mockHookReturn.handleDownload).toHaveBeenCalledWith(currentImage)

        // Wrap in act because toolbar update its internal 'copied' state
        await act(async () => {
            fireEvent.click(screen.getByTestId("copy-button"))
        })
        expect(mockHookReturn.handleCopyUrl).toHaveBeenCalledWith(currentImage)

        fireEvent.click(screen.getByTestId("fullscreen-button"))
        expect(mockHookReturn.setIsFullscreen).toHaveBeenCalledWith(true)
    })

    it("renders fullscreen dialog with image and metadata", () => {
        const currentImage = {
            id: "1",
            url: "test.jpg",
            prompt: "test image",
            params: { width: 1024, height: 1024, model: "flux" }
        }

        const useStudioClientShellMock = useStudioClientShell as unknown as ReturnType<typeof vi.fn>
        useStudioClientShellMock.mockReturnValue({
            ...mockHookReturn,
            isFullscreen: true,
            currentImage,
        })

        render(<StudioClientShell />)

        const dialog = screen.getByTestId("fullscreen-dialog")
        expect(dialog).toBeInTheDocument()

        const dialogScoped = within(dialog)

        const images = dialogScoped.getAllByRole("img", { name: "test image" })
        expect(images.length).toBeGreaterThan(0)

        expect(dialogScoped.getByText("1024x1024")).toBeInTheDocument()
        expect(dialogScoped.getByText("flux")).toBeInTheDocument()
    })
})
