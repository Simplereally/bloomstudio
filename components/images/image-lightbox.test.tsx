// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ButtonHTMLAttributes, ReactEventHandler, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageLightbox } from "./image-lightbox";

// Mock Clerk auth
vi.mock("@clerk/nextjs", () => ({
	useAuth: () => ({ isSignedIn: true }),
}));

vi.mock("@/hooks/use-image-edit", () => ({
	useImageEdit: () => ({
		isEditPanelOpen: false,
		openEditPanel: vi.fn(),
		closeEditPanel: vi.fn(),
		editPrompt: "",
		setEditPrompt: vi.fn(),
		selectedModel: "kontext",
		setSelectedModel: vi.fn(),
		isGenerating: false,
		error: null,
		submitEdit: vi.fn(),
		cancelGeneration: vi.fn(),
		reset: vi.fn(),
		editModels: [],
		canSubmit: false,
		selectedAspectRatio: "1:1",
		setSelectedAspectRatio: vi.fn(),
		selectedResolutionTier: "hd",
		setSelectedResolutionTier: vi.fn(),
		outputWidth: 1024,
		outputHeight: 1024,
		sourceFormatInfo: null,
		availableAspectRatios: [],
		initializeFromSource: vi.fn(),
	}),
}));

// Mock react-zoom-pan-pinch
interface TransformWrapperChildrenArgs {
	zoomIn: () => void;
	zoomOut: () => void;
	resetTransform: () => void;
	state: { scale: number };
}

vi.mock("react-zoom-pan-pinch", () => ({
	TransformWrapper: ({
		children,
	}: {
		children: (args: TransformWrapperChildrenArgs) => ReactNode;
	}) => {
		// Simulate zoom callback availability if needed
		return (
			<div>
				{children({
					zoomIn: vi.fn(),
					zoomOut: vi.fn(),
					resetTransform: vi.fn(),
					state: { scale: 1 },
				})}
			</div>
		);
	},
	TransformComponent: ({ children }: { children?: ReactNode }) => (
		<div data-testid="transform-component">{children}</div>
	),
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
			prompts: [
				{
					_id: "1",
					title: "Test Prompt",
					content: "Test Content",
					type: "positive",
					tags: [],
				} satisfies PromptMock,
			],
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
const useImageDetailsMock = vi.hoisted(() =>
	vi.fn<(imageId: string | null) => ImageDetailsMock | null | undefined>(
		() => null,
	),
);

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
		const isVideo =
			contentType?.startsWith("video/") || url?.match(/\.(mp4|webm|mov)$/i);
		if (isVideo) {
			return (
				<video
					src={url}
					aria-label={alt}
					data-testid="video-player"
					onLoadedMetadata={onLoadedMetadata}
				/>
			);
		}

		return (
			<img src={url} alt={alt} onLoad={onLoad} data-testid="image-player" />
		);
	},
	isVideoContent: (contentType: string | undefined, url: string) =>
		contentType?.startsWith("video/") || url?.match(/\.(mp4|webm|mov)$/i),
}));

// Mock Next.js Image - not used anymore but keep for compatibility if needed
vi.mock("next/image", () => ({
	default: ({
		src,
		alt,
		priority: _priority,
		unoptimized: _unoptimized,
		fill: _fill,
		loader: _loader,
		placeholder: _placeholder,
		blurDataURL: _blurDataURL,
		sizes: _sizes,
		quality: _quality,
		...props
	}: {
		src: string;
		alt: string;
		priority?: boolean;
		unoptimized?: boolean;
		fill?: boolean;
		loader?: unknown;
		placeholder?: "blur" | "empty";
		blurDataURL?: string;
		sizes?: string;
		quality?: number;
		[key: string]: unknown;
	}) => <img src={src} alt={alt} {...props} />,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
	AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
	motion: {
		div: ({
			children,
			layout: _layout,
			...props
		}: {
			children?: ReactNode;
			layout?: boolean;
			[key: string]: unknown;
		}) => <div {...props}>{children}</div>,
	},
}));

// Mock Dialog components
vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children, open }: { children: ReactNode; open?: boolean }) =>
		open ? <div data-testid="dialog">{children}</div> : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div data-testid="dialog-content">{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => (
		<span>{children}</span>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<span>{children}</span>
	),
	DialogOverlay: () => <div data-testid="dialog-overlay" />,
	DialogPortal: ({ children }: { children: ReactNode }) => (
		<div data-testid="dialog-portal">{children}</div>
	),
}));

// Mock Radix Dialog Primitives for PromptLibrary
vi.mock("@radix-ui/react-dialog", () => ({
	Content: ({ children }: { children: ReactNode }) => (
		<div data-testid="radix-content">{children}</div>
	),
	Close: ({ children }: { children: ReactNode }) => (
		<button data-testid="radix-close">{children}</button>
	),
	Root: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	Portal: ({ children }: { children: ReactNode }) => (
		<div data-testid="radix-portal">{children}</div>
	),
	Overlay: () => <div data-testid="radix-overlay" />,
}));

// Mock VisuallyHidden
vi.mock("@radix-ui/react-visually-hidden", () => ({
	VisuallyHidden: ({ children }: { children: ReactNode }) => (
		<span className="sr-only">{children}</span>
	),
}));

// Mock Tooltip components
vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
	TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
	TooltipContent: ({ children }: { children: ReactNode }) => (
		<span>{children}</span>
	),
}));

// Mock Button
vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		disabled,
		...props
	}: ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button onClick={onClick} disabled={disabled} {...props}>
			{children}
		</button>
	),
}));

// Mock the PromptLibrary's child components
vi.mock("@/components/studio/features/prompt-library/prompt-list-view", () => ({
	PromptListView: ({
		onInsertPrompt,
		prompts,
	}: {
		onInsertPrompt: (content: string) => void;
		prompts?: readonly PromptMock[];
	}) => (
		<div data-testid="prompt-list-view">
			{prompts?.map((p) => (
				<button
					key={p._id}
					data-testid="insert-prompt-btn"
					onClick={() => onInsertPrompt(p.content)}
				>
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

vi.mock("lucide-react", () => ({
	BookmarkPlus: () => <span data-testid="bookmark-icon">📥</span>,
	Check: () => <span>✓</span>,
	Copy: () => <span>📋</span>,
	Loader2: () => <span>⏳</span>,
	LogIn: () => <span>🔑</span>,
	ZoomIn: () => <span>🔍</span>,
	X: () => <span>✕</span>,
	Wand2: () => <span data-testid="wand-icon">🪄</span>,
}));

// Mock model config
vi.mock("@/lib/config/models", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/lib/config/models")>();
	return {
		...actual,
		getModelDisplayName: (model: string) => model,
	};
});

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

			render(
				<ImageLightbox
					image={mockImage}
					isOpen={true}
					onClose={vi.fn()}
					onInsertPrompt={onInsertPrompt}
				/>,
			);

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
			render(
				<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />,
			);

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
			render(
				<ImageLightbox image={mockVideo} isOpen={true} onClose={vi.fn()} />,
			);

			expect(screen.getByTestId("video-player")).toBeInTheDocument();
			expect(screen.getByTestId("video-player")).toHaveAttribute(
				"src",
				mockVideo.url,
			);
			expect(screen.queryByTestId("image-player")).not.toBeInTheDocument();
		});

		it("does not show zoom indicator for video content", () => {
			render(
				<ImageLightbox image={mockVideo} isOpen={true} onClose={vi.fn()} />,
			);

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

			render(
				<ImageLightbox
					image={thumbnailVideo}
					isOpen={true}
					onClose={vi.fn()}
				/>,
			);

			// Should render video player with the FULL URL, not the thumbnail URL
			expect(screen.getByTestId("video-player")).toBeInTheDocument();
			expect(screen.getByTestId("video-player")).toHaveAttribute(
				"src",
				mockFullDetails.url,
			);

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
			render(
				<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />,
			);

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
			const { ImageLightbox: UnauthLightbox } = await import(
				"./image-lightbox"
			);

			const { container } = render(
				<UnauthLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />,
			);

			const signInLinks = container.querySelectorAll('a[href="/sign-in"]');
			// 3 sign-in links: save to library, copy prompt, and edit image
			expect(signInLinks.length).toBe(3);
		});
	});
});

describe("ImageLightbox - Single Image Mode", () => {
	const mockImage = {
		url: "https://example.com/test-image.jpg",
		prompt: "A beautiful landscape",
		model: "test-model",
		width: 1024,
		height: 1024,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders single centered image when no edits exist", () => {
		render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

		// Should NOT render comparison labels
		expect(screen.queryByText("Original")).not.toBeInTheDocument();
		expect(screen.queryByText("Current")).not.toBeInTheDocument();
	});

	it("does not render side-by-side comparison layout without edits", () => {
		const { container } = render(
			<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />,
		);

		// The grid-cols-2 class is used by LightboxCompareView for side-by-side
		const compareGrid = container.querySelector(".md\\:grid-cols-2");
		expect(compareGrid).not.toBeInTheDocument();
	});

	it("does not show version strip when no edits exist", () => {
		render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

		// Version strip has aria-label "Image versions"
		expect(screen.queryByLabelText("Image versions")).not.toBeInTheDocument();
	});

	it("shows edit button for image content", () => {
		render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

		expect(screen.getByTestId("wand-icon")).toBeInTheDocument();
	});

	it("renders the image with correct URL", () => {
		render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

		// Find the image element
		const images = screen.getAllByRole("img");
		expect(images.length).toBeGreaterThan(0);
		// At least one image should have our URL
		const hasCorrectUrl = images.some(
			(img) =>
				img.getAttribute("src") === mockImage.url ||
				img.getAttribute("src")?.includes("test-image.jpg"),
		);
		expect(hasCorrectUrl).toBe(true);
	});
});

describe("ImageLightbox - Edit Flow", () => {
	const mockImage = {
		url: "https://example.com/test-image.jpg",
		prompt: "A beautiful landscape",
		model: "test-model",
		width: 1024,
		height: 1024,
	};

	const mockVideo = {
		url: "https://example.com/test-video.mp4",
		prompt: "A beautiful video",
		model: "veo",
		contentType: "video/mp4",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("hides edit button for video content", () => {
		render(<ImageLightbox image={mockVideo} isOpen={true} onClose={vi.fn()} />);

		// Edit button (wand icon) should not be visible for video
		// The button exists but is disabled/hidden based on canEdit prop
		const wandIcons = screen.queryAllByTestId("wand-icon");
		// Either no wand icon, or the button should be a sign-in link (for unauth users)
		// Based on the code, the edit button is conditionally rendered based on canEditImage
		// which is false for videos
		expect(wandIcons.length).toBe(0);
	});

	// Note: Testing isGenerating state requires module reset and re-mocking all dependencies
	// including lucide-react icons like Sparkles. This is complex and the component behavior
	// is verified through other integration tests. The key behavior (showing loading overlay)
	// is handled by GenerationLoadingOverlay which has its own unit tests.
});

describe("ImageLightbox - Comparison View", () => {
	// To test comparison view, we need to mock a state where editChain has items
	// This is challenging because editChain is internal state
	// The best approach is to test the integration by simulating a successful edit

	const mockImage = {
		url: "https://example.com/test-image.jpg",
		prompt: "A beautiful landscape",
		model: "test-model",
		width: 1024,
		height: 1024,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("version strip returns null when only one version exists", () => {
		// This tests that LightboxVersionStrip correctly hides itself
		render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />);

		// Version strip should not render when versions.length <= 1
		expect(screen.queryByLabelText("Image versions")).not.toBeInTheDocument();
	});
});

describe("ImageLightbox - State Reset", () => {
	const mockImage = {
		url: "https://example.com/test-image.jpg",
		prompt: "A beautiful landscape",
		model: "test-model",
		width: 1024,
		height: 1024,
	};

	const differentImage = {
		url: "https://example.com/different-image.jpg",
		prompt: "A different landscape",
		model: "different-model",
		width: 512,
		height: 512,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("maintains single image mode when different image is opened", () => {
		const { rerender } = render(
			<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />,
		);

		// Re-render with different image
		rerender(
			<ImageLightbox image={differentImage} isOpen={true} onClose={vi.fn()} />,
		);

		// Should still be in single mode (no comparison labels)
		expect(screen.queryByText("Original")).not.toBeInTheDocument();
		expect(screen.queryByText("Current")).not.toBeInTheDocument();
	});

	it("resets to single image mode when lightbox is closed and reopened", () => {
		const { rerender } = render(
			<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />,
		);

		// Close the lightbox
		rerender(
			<ImageLightbox image={mockImage} isOpen={false} onClose={vi.fn()} />,
		);

		// Reopen the lightbox
		rerender(
			<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />,
		);

		// Should be in single mode (no comparison labels)
		expect(screen.queryByText("Original")).not.toBeInTheDocument();
		expect(screen.queryByText("Current")).not.toBeInTheDocument();
	});
});

describe("ImageLightbox - Mobile Swipe Navigation", () => {
	const mockImage = {
		url: "https://example.com/test-image.jpg",
		prompt: "A beautiful landscape",
		model: "test-model",
		width: 1024,
		height: 1024,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("navigates to the next media on upward touch swipe", () => {
		const onNext = vi.fn();

		render(
			<ImageLightbox
				image={mockImage}
				isOpen={true}
				onClose={vi.fn()}
				mediaNavigation={{
					hasNext: true,
					hasPrevious: true,
					onNext,
					onPrevious: vi.fn(),
				}}
			/>,
		);

		const swipeRegion = screen.getByTestId("lightbox-swipe-region");
		fireEvent.pointerDown(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 120,
			clientY: 300,
		});
		fireEvent.pointerUp(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 118,
			clientY: 180,
		});

		return waitFor(() => {
			expect(onNext).toHaveBeenCalledTimes(1);
		});
	});

	it("navigates to the previous media on downward touch swipe", () => {
		const onPrevious = vi.fn();

		render(
			<ImageLightbox
				image={mockImage}
				isOpen={true}
				onClose={vi.fn()}
				mediaNavigation={{
					hasNext: true,
					hasPrevious: true,
					onNext: vi.fn(),
					onPrevious,
				}}
			/>,
		);

		const swipeRegion = screen.getByTestId("lightbox-swipe-region");
		fireEvent.pointerDown(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 120,
			clientY: 180,
		});
		fireEvent.pointerUp(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 122,
			clientY: 320,
		});

		return waitFor(() => {
			expect(onPrevious).toHaveBeenCalledTimes(1);
		});
	});

	it("drags the media with the finger before release", () => {
		render(
			<ImageLightbox
				image={mockImage}
				isOpen={true}
				onClose={vi.fn()}
				mediaNavigation={{
					hasNext: true,
					hasPrevious: true,
					onNext: vi.fn(),
					onPrevious: vi.fn(),
				}}
			/>,
		);

		const swipeRegion = screen.getByTestId("lightbox-swipe-region");
		const swipeMotion = screen.getByTestId("lightbox-swipe-motion");
		const initialTransform = swipeMotion.style.transform;

		fireEvent.pointerDown(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 120,
			clientY: 180,
		});
		fireEvent.pointerMove(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 122,
			clientY: 300,
		});

		expect(swipeMotion.style.transform).not.toBe(initialTransform);
		expect(swipeMotion.style.transform).toContain("translate3d");
	});

	it("ignores mostly horizontal drags", async () => {
		const onNext = vi.fn();
		const onPrevious = vi.fn();

		render(
			<ImageLightbox
				image={mockImage}
				isOpen={true}
				onClose={vi.fn()}
				mediaNavigation={{
					hasNext: true,
					hasPrevious: true,
					onNext,
					onPrevious,
				}}
			/>,
		);

		const swipeRegion = screen.getByTestId("lightbox-swipe-region");
		fireEvent.pointerDown(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 120,
			clientY: 180,
		});
		fireEvent.pointerMove(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 280,
			clientY: 210,
		});
		fireEvent.pointerUp(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 280,
			clientY: 210,
		});

		await waitFor(() => {
			expect(onNext).not.toHaveBeenCalled();
			expect(onPrevious).not.toHaveBeenCalled();
		});
	});

	it("snaps back when swiping beyond a gallery boundary", async () => {
		render(
			<ImageLightbox
				image={mockImage}
				isOpen={true}
				onClose={vi.fn()}
				mediaNavigation={{
					hasNext: false,
					hasPrevious: false,
					onNext: vi.fn(),
					onPrevious: vi.fn(),
				}}
			/>,
		);

		const swipeRegion = screen.getByTestId("lightbox-swipe-region");
		const swipeMotion = screen.getByTestId("lightbox-swipe-motion");
		const initialTransform = swipeMotion.style.transform;

		fireEvent.pointerDown(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 120,
			clientY: 240,
		});
		fireEvent.pointerMove(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 120,
			clientY: 80,
		});
		fireEvent.pointerUp(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 120,
			clientY: 80,
		});

		await waitFor(() => {
			expect(swipeMotion.style.transform).toBe(initialTransform);
		});
	});

	it("ignores short touch drags", () => {
		const onNext = vi.fn();

		render(
			<ImageLightbox
				image={mockImage}
				isOpen={true}
				onClose={vi.fn()}
				mediaNavigation={{
					hasNext: true,
					hasPrevious: false,
					onNext,
					onPrevious: vi.fn(),
				}}
			/>,
		);

		const swipeRegion = screen.getByTestId("lightbox-swipe-region");
		fireEvent.pointerDown(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 120,
			clientY: 240,
		});
		fireEvent.pointerUp(swipeRegion, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 118,
			clientY: 200,
		});

		expect(onNext).not.toHaveBeenCalled();
	});
});
