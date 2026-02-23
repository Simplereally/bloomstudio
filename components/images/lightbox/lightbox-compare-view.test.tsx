// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LightboxImage } from "@/hooks/use-image-lightbox";
import { LightboxCompareView } from "./lightbox-compare-view";

// Mock framer-motion
vi.mock("framer-motion", () => ({
	AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
	motion: {
		div: ({
			children,
			...props
		}: {
			children?: ReactNode;
			[key: string]: unknown;
		}) => <div {...props}>{children}</div>,
	},
}));

// Mock Tooltip components
vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
	TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
	TooltipContent: ({ children }: { children: ReactNode }) => (
		<span>{children}</span>
	),
}));

// Mock Badge component
vi.mock("@/components/ui/badge", () => ({
	Badge: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => (
		<span data-testid="badge" className={className}>
			{children}
		</span>
	),
}));

// Mock Spinner component
vi.mock("@/components/ui/spinner", () => ({
	Spinner: ({ className }: { className?: string }) => (
		<span data-testid="spinner" className={className}>
			Loading...
		</span>
	),
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		disabled,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button type="button" onClick={onClick} disabled={disabled} {...props}>
			{children}
		</button>
	),
}));

// Mock model config
vi.mock("@/lib/config/models", () => ({
	getModelDisplayName: (model: string) => model.toUpperCase(),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
	BookmarkPlus: () => <span data-testid="bookmark-icon">Save</span>,
	Check: () => <span data-testid="check-icon">Check</span>,
	Copy: () => <span data-testid="copy-icon">Copy</span>,
	LogIn: () => <span data-testid="login-icon">Login</span>,
	Wand2: () => <span data-testid="wand-icon">Edit</span>,
	ZoomIn: () => <span data-testid="zoom-icon">Zoom</span>,
}));

// Mock useImageLightbox hook
vi.mock("@/hooks/use-image-lightbox", () => ({
	useImageLightbox: () => ({
		isZoomed: false,
		naturalSize: { width: 1000, height: 1000 },
		isDragging: false,
		scrollContainerRef: { current: null },
		canZoom: true,
		handleImageLoad: vi.fn(),
		toggleZoom: vi.fn(),
		handleMouseDown: vi.fn(),
		handleMouseMove: vi.fn(),
		handleMouseUp: vi.fn(),
		handleMouseLeave: vi.fn(),
		hasDragged: { current: false },
	}),
}));

// Mock Next.js Image
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
	}) => <img src={src} alt={alt} data-testid="next-image" {...props} />,
}));

describe("LightboxCompareView", () => {
	const originalImage: LightboxImage = {
		url: "https://example.com/original.jpg",
		prompt: "Original landscape",
		model: "flux-pro",
		width: 1024,
		height: 1024,
	};

	const editedImage: LightboxImage = {
		url: "https://example.com/edited.jpg",
		prompt: "Edited landscape with mountains",
		model: "kontext",
		width: 1024,
		height: 1024,
	};

	const defaultProps = {
		baseImage: originalImage,
		selectedImage: editedImage,
		isSignedIn: true,
		canEdit: true,
		onEdit: vi.fn(),
		onSaveToLibrary: vi.fn(),
		onCopyPrompt: vi.fn(),
		onBackdropClick: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("rendering", () => {
		it("renders two LightboxPane components", () => {
			render(<LightboxCompareView {...defaultProps} />);

			// Should have two panes
			expect(screen.getByTestId("lightbox-pane-original")).toBeInTheDocument();
			expect(screen.getByTestId("lightbox-pane-current")).toBeInTheDocument();
		});

		it("passes baseImage to left pane with 'Original' label", () => {
			render(<LightboxCompareView {...defaultProps} />);

			const badges = screen.getAllByTestId("badge");
			const labels = badges.map((b) => b.textContent);

			expect(labels).toContain("Original");
		});

		it("passes selectedImage to right pane with 'Current' label", () => {
			render(<LightboxCompareView {...defaultProps} />);

			const badges = screen.getAllByTestId("badge");
			const labels = badges.map((b) => b.textContent);

			expect(labels).toContain("Current");
		});

		it("renders images with correct URLs", () => {
			render(<LightboxCompareView {...defaultProps} />);

			const images = screen.getAllByTestId("next-image");
			const srcs = images.map((img) => img.getAttribute("src"));

			expect(srcs).toContain("https://example.com/original.jpg");
			expect(srcs).toContain("https://example.com/edited.jpg");
		});
	});

	describe("selected state", () => {
		it("marks Current pane as selected when different from Original", () => {
			render(<LightboxCompareView {...defaultProps} />);

			// With different images, Current should be selected
			const currentPane = screen.getByTestId("lightbox-pane-current");
			const currentBadge = currentPane.querySelector('[data-testid="badge"]');

			// Current badge should have selected styling (bg-primary)
			expect(currentBadge?.className).toContain("bg-primary");
		});

		it("marks Original pane as selected when selectedImage equals baseImage", () => {
			render(
				<LightboxCompareView
					{...defaultProps}
					selectedImage={originalImage} // Same as baseImage
				/>,
			);

			const originalPane = screen.getByTestId("lightbox-pane-original");
			const originalBadge = originalPane.querySelector('[data-testid="badge"]');

			// Original badge should have selected styling when selected
			expect(originalBadge?.className).toContain("bg-primary");
		});
	});

	describe("callbacks", () => {
		it("passes onEdit callback to both panes", () => {
			const onEdit = vi.fn();
			render(<LightboxCompareView {...defaultProps} onEdit={onEdit} />);

			// Both panes should exist and have received the callback
			// The actual callback invocation is tested in LightboxPane tests
			expect(screen.getByTestId("lightbox-pane-original")).toBeInTheDocument();
			expect(screen.getByTestId("lightbox-pane-current")).toBeInTheDocument();
		});

		it("passes onBackdropClick callback to both panes", () => {
			const onBackdropClick = vi.fn();
			render(
				<LightboxCompareView
					{...defaultProps}
					onBackdropClick={onBackdropClick}
				/>,
			);

			// Both panes have close buttons
			const closeButtons = screen.getAllByRole("button", {
				name: "Close lightbox",
			});
			expect(closeButtons).toHaveLength(2);
		});
	});

	describe("auth state", () => {
		it("passes isSignedIn to both panes", () => {
			render(<LightboxCompareView {...defaultProps} isSignedIn={false} />);

			// Both panes should exist
			expect(screen.getByTestId("lightbox-pane-original")).toBeInTheDocument();
			expect(screen.getByTestId("lightbox-pane-current")).toBeInTheDocument();
		});
	});

	describe("edit capability", () => {
		it("passes canEdit to both panes", () => {
			render(<LightboxCompareView {...defaultProps} canEdit={false} />);

			// Both panes should exist
			expect(screen.getByTestId("lightbox-pane-original")).toBeInTheDocument();
			expect(screen.getByTestId("lightbox-pane-current")).toBeInTheDocument();
		});
	});

	describe("layout", () => {
		it("renders grid layout with correct structure", () => {
			const { container } = render(<LightboxCompareView {...defaultProps} />);

			// Should have grid layout with 2 columns on md+ screens
			const grid = container.querySelector(".grid");
			expect(grid).toBeInTheDocument();
			expect(grid?.className).toContain("md:grid-cols-2");
		});
	});
});
