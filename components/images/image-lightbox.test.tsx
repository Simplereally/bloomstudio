// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ButtonHTMLAttributes, ReactEventHandler, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageLightbox } from "./image-lightbox";

// Mock Clerk auth
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: true }),
}));

// Mock react-zoom-pan-pinch
interface TransformWrapperChildrenArgs {
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: () => void;
  state: { scale: number };
}

vi.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({ children }: { children: (args: TransformWrapperChildrenArgs) => ReactNode }) => {
    // Simulate zoom callback availability if needed
    return <div>{children({ zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn(), state: { scale: 1 } })}</div>;
  },
  TransformComponent: ({ children }: { children?: ReactNode }) => <div data-testid="transform-component">{children}</div>,
}));

// Mock React hooks that the component uses
const mockHandleInsert = vi.fn();

// Mock the usePromptLibrary hook to capture the onInsertComplete callback
let capturedOnInsertComplete: (() => void) | undefined;

interface UsePromptLibraryMockProps {
  onInsertComplete?: () => void;
  onInsert: (content: string) => void;
  onClose: () => void;
}

interface PromptMock {
  _id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
}

vi.mock("@/hooks/use-prompt-library", () => ({
  usePromptLibrary: (props: UsePromptLibraryMockProps) => {
    capturedOnInsertComplete = props.onInsertComplete;
    return {
      searchQuery: "",
      setSearchQuery: vi.fn(),
      searchInputRef: { current: null },
      viewState: "list",
      setViewState: vi.fn(),
      selectedPrompt: null,
      selectPrompt: vi.fn(),
      typeFilter: "all",
      setTypeFilter: vi.fn(),
      prompts: [{ _id: "1", title: "Test Prompt", content: "Test Content", type: "positive", tags: [] } satisfies PromptMock],
      isLoading: false,
      handleCopy: vi.fn(),
      handleInsert: (content: string) => {
        mockHandleInsert(content);
        props.onInsert(content);
        props.onClose();
        props.onInsertComplete?.();
      },
      handleRemove: vi.fn(),
      showSaveForm: vi.fn(),
      goBackToList: vi.fn(),
    };
  },
}));

// Mock the useImageLightbox hook
vi.mock("@/hooks/use-image-lightbox", () => ({
  useImageLightbox: () => ({
    copied: false,
    isZoomed: false,
    toggleZoom: vi.fn(),
    handleCopyPrompt: vi.fn(),
    handleImageLoad: vi.fn(),
    canZoom: true,
    isHovering: true,
    setIsHovering: vi.fn(),
    // Legacy/unused props that might be destructured
    naturalSize: { width: 1000, height: 1000 },
    isDragging: false,
    scrollContainerRef: { current: null },
    handleMouseDown: vi.fn(),
    handleMouseMove: vi.fn(),
    handleMouseUp: vi.fn(),
    handleMouseLeave: vi.fn(),
  }),
}));

// Mock the image details query
interface ImageDetailsMock {
  url: string;
  prompt: string;
  model: string;
  width?: number;
  height?: number;
  contentType?: string;
  _id?: string;
}

// Use vi.hoisted() to ensure the mock is available before the hoisted vi.mock runs
const useImageDetailsMock = vi.hoisted(() => vi.fn<(imageId: string | null) => ImageDetailsMock | null | undefined>(() => null));

vi.mock("@/hooks/queries/use-image-history", () => ({
  useImageDetails: useImageDetailsMock,
}));

// Mock MediaPlayer
vi.mock("@/components/ui/media-player", () => ({
  MediaPlayer: ({
    url,
    alt,
    contentType,
    onLoadedMetadata,
    onLoad,
  }: {
    url: string;
    alt: string;
    contentType?: string;
    onLoadedMetadata?: ReactEventHandler<HTMLVideoElement>;
    onLoad?: ReactEventHandler<HTMLImageElement>;
  }) => {
    const isVideo = contentType?.startsWith("video/") || url?.match(/\.(mp4|webm|mov)$/i);
    if (isVideo) {
      return <video src={url} aria-label={alt} data-testid="video-player" onLoadedMetadata={onLoadedMetadata} />;
    }
    return <img src={url} alt={alt} onLoad={onLoad} data-testid="image-player" />;
  },
  isVideoContent: (contentType: string | undefined, url: string) => contentType?.startsWith("video/") || url?.match(/\.(mp4|webm|mov)$/i),
}));

// Mock Next.js Image - not used anymore but keep for compatibility if needed
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => <img src={src} alt={alt} {...props} />,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
}));

// Mock Dialog components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: ReactNode; open?: boolean }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  DialogDescription: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  DialogOverlay: () => <div data-testid="dialog-overlay" />,
  DialogPortal: ({ children }: { children: ReactNode }) => <div data-testid="dialog-portal">{children}</div>,
}));

// Mock Radix Dialog Primitives for PromptLibrary
vi.mock("@radix-ui/react-dialog", () => ({
  Content: ({ children }: { children: ReactNode }) => <div data-testid="radix-content">{children}</div>,
  Close: ({ children }: { children: ReactNode }) => <button data-testid="radix-close">{children}</button>,
  Root: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Portal: ({ children }: { children: ReactNode }) => <div data-testid="radix-portal">{children}</div>,
  Overlay: () => <div data-testid="radix-overlay" />,
}));

// Mock VisuallyHidden
vi.mock("@radix-ui/react-visually-hidden", () => ({
  VisuallyHidden: ({ children }: { children: ReactNode }) => <span className="sr-only">{children}</span>,
}));

// Mock Tooltip components
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

// Mock Button
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

// Mock the PromptLibrary's child components
vi.mock("@/components/studio/features/prompt-library/prompt-list-view", () => ({
  PromptListView: ({ onInsertPrompt, prompts }: { onInsertPrompt: (content: string) => void; prompts?: readonly PromptMock[] }) => (
    <div data-testid="prompt-list-view">
      {prompts?.map((p) => (
        <button key={p._id} data-testid="insert-prompt-btn" onClick={() => onInsertPrompt(p.content)}>
          Insert: {p.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/components/studio/features/prompt-library/save-prompt-form", () => ({
  SavePromptForm: () => <div data-testid="save-prompt-form">Save Form</div>,
}));

vi.mock("@/components/studio/features/prompt-library/prompt-detail", () => ({
  PromptDetail: () => <div data-testid="prompt-detail">Detail</div>,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  BookmarkPlus: () => <span data-testid="bookmark-icon">📥</span>,
  Check: () => <span>✓</span>,
  Copy: () => <span>📋</span>,
  Loader2: () => <span>⏳</span>,
  LogIn: () => <span>🔑</span>,
  ZoomIn: () => <span>🔍</span>,
  X: () => <span>✕</span>,
}));

// Mock model config
vi.mock("@/lib/config/models", () => ({
  getModelDisplayName: (model: string) => model,
}));

describe("ImageLightbox - Prompt Library Integration", () => {
  const mockImage = {
    url: "https://example.com/test-image.jpg",
    prompt: "A beautiful landscape",
    model: "test-model",
    width: 1024,
    height: 1024,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnInsertComplete = undefined;
  });

  it("renders the lightbox with the image when open", () => {
    render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });

  it("shows the save to library button when prompt is available", () => {
    render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId("bookmark-icon")).toBeInTheDocument();
  });

  it("opens the prompt library when save to library button is clicked", async () => {
    const user = userEvent.setup();
    render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

    // Find and click the save to library button
    const saveButton = screen.getByTestId("bookmark-icon").closest("button");
    await user.click(saveButton!);

    // The prompt library should be open (showing prompt list view)
    await waitFor(() => {
      expect(screen.getByTestId("prompt-list-view")).toBeInTheDocument();
    });
  });

  it("closes the lightbox when insert prompt is clicked from the library", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ImageLightbox image={mockImage} isOpen={true} onClose={onClose} />);

    // Open the library
    const saveButton = screen.getByTestId("bookmark-icon").closest("button");
    await user.click(saveButton!);

    // Wait for library to open
    await waitFor(() => {
      expect(screen.getByTestId("prompt-list-view")).toBeInTheDocument();
    });

    // Click insert on a prompt
    const insertButton = screen.getByTestId("insert-prompt-btn");
    await user.click(insertButton);

    // The lightbox's onClose should have been called (via onInsertComplete)
    expect(onClose).toHaveBeenCalled();
  });

  it("passes onClose as onInsertComplete to PromptLibrary", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ImageLightbox image={mockImage} isOpen={true} onClose={onClose} />);

    // Open the library
    const saveButton = screen.getByTestId("bookmark-icon").closest("button");
    await user.click(saveButton!);

    // Verify the onInsertComplete callback was captured and is the onClose function
    // This tests that the prop is correctly wired
    await waitFor(() => {
      expect(capturedOnInsertComplete).toBeDefined();
    });

    // Invoking onInsertComplete should call onClose
    capturedOnInsertComplete?.();
    expect(onClose).toHaveBeenCalled();
  });

  describe("prompt insertion from lightbox", () => {
    it("should call onInsertPrompt with prompt content when insert is triggered", async () => {
      const user = userEvent.setup();
      const onInsertPrompt = vi.fn();

      render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} onInsertPrompt={onInsertPrompt} />);

      // Open the library by clicking the save to library button
      const saveButton = screen.getByTestId("bookmark-icon").closest("button");
      await user.click(saveButton!);

      // Wait for library to open
      await waitFor(() => {
        expect(screen.getByTestId("prompt-list-view")).toBeInTheDocument();
      });

      // Click insert on a prompt
      const insertButton = screen.getByTestId("insert-prompt-btn");
      await user.click(insertButton);

      // The onInsertPrompt callback should be called with the inserted content
      expect(onInsertPrompt).toHaveBeenCalledWith("Test Content");
    });

    it("does not fail if onInsertPrompt is not provided", async () => {
      const user = userEvent.setup();

      // Render without onInsertPrompt - should not throw
      render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

      // Open the library
      const saveButton = screen.getByTestId("bookmark-icon").closest("button");
      await user.click(saveButton!);

      // Wait for library to open
      await waitFor(() => {
        expect(screen.getByTestId("prompt-list-view")).toBeInTheDocument();
      });

      // Click insert - should not throw even without the callback
      const insertButton = screen.getByTestId("insert-prompt-btn");
      await expect(user.click(insertButton)).resolves.not.toThrow();
    });
  });

  describe("video support", () => {
    const mockVideo = {
      url: "https://example.com/test-video.mp4",
      prompt: "A beautiful video",
      model: "veo",
      contentType: "video/mp4",
    };

    it("renders a video player when content is video", () => {
      render(<ImageLightbox image={mockVideo} isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByTestId("video-player")).toBeInTheDocument();
      expect(screen.getByTestId("video-player")).toHaveAttribute("src", mockVideo.url);
      expect(screen.queryByTestId("image-player")).not.toBeInTheDocument();
    });

    it("does not show zoom indicator for video content", () => {
      render(<ImageLightbox image={mockVideo} isOpen={true} onClose={vi.fn()} />);

      expect(screen.queryByTestId("zoom-indicator")).not.toBeInTheDocument();
      expect(screen.queryByText("🔍")).not.toBeInTheDocument();
    });

    it("prioritizes full video URL from details over thumbnail URL", async () => {
      // Setup useImageDetails to return a different URL (the original video)
      const mockFullDetails = {
        ...mockVideo,
        url: "https://example.com/original-full-video.mp4",
      };
      useImageDetailsMock.mockReturnValue(mockFullDetails);

      const thumbnailVideo = {
        ...mockVideo,
        url: "https://example.com/thumbnail.jpg", // Thumbnail passed in props
        _id: "test-id",
      };

      render(<ImageLightbox image={thumbnailVideo} isOpen={true} onClose={vi.fn()} />);

      // Should render video player with the FULL URL, not the thumbnail URL
      expect(screen.getByTestId("video-player")).toBeInTheDocument();
      expect(screen.getByTestId("video-player")).toHaveAttribute("src", mockFullDetails.url);

      // Clean up mock
      useImageDetailsMock.mockReturnValue(null);
    });
  });

  describe("copy prompt auth-gating", () => {
    const mockImage = {
      url: "https://example.com/test-image.jpg",
      prompt: "A beautiful landscape",
      model: "test-model",
      width: 1024,
      height: 1024,
    };

    it("shows copy prompt button when authenticated", async () => {
      // Default mock already has isSignedIn: true
      render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

      // Copy button should be present (not a link)
      const copyButton = screen.getAllByRole("button")[1]; // Second button after save to library
      expect(copyButton).toBeInTheDocument();
    });

    it("shows sign-in link for copy prompt when not authenticated", async () => {
      // Reset modules to clear cache
      vi.resetModules();

      // Set up mocks before importing the component
      vi.doMock("@clerk/nextjs", () => ({
        useAuth: () => ({ isSignedIn: false }),
      }));

      // Re-mock all the dependencies that the component needs
      vi.doMock("@/hooks/use-image-lightbox", () => ({
        useImageLightbox: () => ({
          copied: false,
          isZoomed: false,
          toggleZoom: vi.fn(),
          handleCopyPrompt: vi.fn(),
          handleImageLoad: vi.fn(),
          canZoom: true,
          isHovering: true,
          setIsHovering: vi.fn(),
          naturalSize: { width: 1000, height: 1000 },
          isDragging: false,
          scrollContainerRef: { current: null },
          handleMouseDown: vi.fn(),
          handleMouseMove: vi.fn(),
          handleMouseUp: vi.fn(),
          handleMouseLeave: vi.fn(),
          hasDragged: { current: false },
        }),
      }));

      vi.doMock("@/hooks/queries/use-image-history", () => ({
        useImageDetails: vi.fn(() => null),
      }));

      // Import fresh module with new mocks
      const { ImageLightbox: UnauthLightbox } = await import("./image-lightbox");

      const { container } = render(<UnauthLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

      // Should have links to sign-in for both the save to library and copy prompt buttons
      const signInLinks = container.querySelectorAll('a[href="/sign-in"]');
      // There should be 2 sign-in links now - one for save to library and one for copy prompt
      expect(signInLinks.length).toBe(2);
    });
  });
});
