// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LightboxImage } from "@/hooks/use-image-lightbox";
import { LightboxPane } from "./lightbox-pane";

// Mock clipboard API
Object.assign(navigator, {
	clipboard: {
		writeText: vi.fn(() => Promise.resolve()),
	},
});

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
}));

// Mock useImageLightbox hook
const mockToggleZoom = vi.fn();
const mockHandleImageLoad = vi.fn();
const mockHandleMouseDown = vi.fn();
const mockHandleMouseMove = vi.fn();
const mockHandleMouseUp = vi.fn();
const mockHandleMouseLeave = vi.fn();
const mockHasDragged = { current: false };

vi.mock("@/hooks/use-image-lightbox", () => ({
	useImageLightbox: () => ({
		isZoomed: false,
		naturalSize: { width: 1000, height: 1000 },
		isDragging: false,
		scrollContainerRef: { current: null },
		canZoom: true,
		handleImageLoad: mockHandleImageLoad,
		toggleZoom: mockToggleZoom,
		handleMouseDown: mockHandleMouseDown,
		handleMouseMove: mockHandleMouseMove,
		handleMouseUp: mockHandleMouseUp,
		handleMouseLeave: mockHandleMouseLeave,
		hasDragged: mockHasDragged,
	}),
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
	default: ({
		src,
		alt,
		onLoad,
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
		onLoad?: () => void;
		priority?: boolean;
		unoptimized?: boolean;
		fill?: boolean;
		loader?: unknown;
		placeholder?: "blur" | "empty";
		blurDataURL?: string;
		sizes?: string;
		quality?: number;
		[key: string]: unknown;
	}) => (
		<img
			src={src}
			alt={alt}
			data-testid="next-image"
			onLoad={onLoad}
			{...props}
		/>
	),
}));

describe("LightboxPane", () => {
	const mockImage: LightboxImage = {
		url: "https://example.com/thumbnail.jpg",
		originalUrl: "https://example.com/original.jpg",
		prompt: "A beautiful sunset over the ocean",
		model: "flux-pro",
		width: 1024,
		height: 1024,
		params: {
			model: "flux-pro",
			width: 1024,
			height: 1024,
		},
	};

	const defaultProps = {
		image: mockImage,
		label: "Original",
		isSelected: false,
		isSignedIn: true,
		canEdit: true,
		onEdit: vi.fn(),
		onSaveToLibrary: vi.fn(),
		onCopyPrompt: vi.fn(),
		onBackdropClick: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockHasDragged.current = false;
	});

	describe("rendering", () => {
		it("renders with correct test id based on label", () => {
			render(<LightboxPane {...defaultProps} label="Original" />);
			expect(screen.getByTestId("lightbox-pane-original")).toBeInTheDocument();
		});

		it("renders label badge with correct text", () => {
			render(<LightboxPane {...defaultProps} label="Current" />);
			const badges = screen.getAllByTestId("badge");
			// First badge is the label badge
			expect(badges[0]).toHaveTextContent("Current");
		});

		it("renders image with correct src", () => {
			render(<LightboxPane {...defaultProps} />);
			const images = screen.getAllByTestId("next-image");
			// Should have at least the full-res image
			const fullResImage = images.find((img) =>
				img.getAttribute("src")?.includes("original.jpg"),
			);
			expect(fullResImage).toBeInTheDocument();
		});

		it("renders spinner while image is loading", () => {
			render(<LightboxPane {...defaultProps} />);
			expect(screen.getByTestId("spinner")).toBeInTheDocument();
		});
	});

	describe("overlay behavior", () => {
		it("shows overlay on hover", async () => {
			const user = userEvent.setup();
			render(<LightboxPane {...defaultProps} />);

			// Find the image button and hover it
			const images = screen.getAllByTestId("next-image");
			const imageButton = images[0].closest("button");
			expect(imageButton).toBeInTheDocument();

			await user.hover(imageButton!);

			await waitFor(() => {
				expect(screen.getByTestId("lightbox-pane-overlay")).toBeInTheDocument();
			});
		});

		it("hides overlay when not hovering", () => {
			render(<LightboxPane {...defaultProps} />);

			// Initially not hovering, overlay should not be visible
			expect(
				screen.queryByTestId("lightbox-pane-overlay"),
			).not.toBeInTheDocument();
		});
	});

	describe("action callbacks", () => {
		it("calls onEdit with image when edit is clicked", async () => {
			const user = userEvent.setup();
			const onEdit = vi.fn();
			render(<LightboxPane {...defaultProps} onEdit={onEdit} />);

			// Hover over the region container to show overlay
			const region = screen.getByRole("region", { name: "Image preview" });
			await user.hover(region);

			// Wait for overlay to appear
			await waitFor(() => {
				expect(screen.getByTestId("pane-edit-button")).toBeInTheDocument();
			});

			// Click the edit button - get the button directly
			const editButton = screen.getByTestId("pane-edit-button");
			// Use fireEvent for direct DOM interaction since userEvent may have issues with nested components
			editButton.click();

			await waitFor(() => {
				expect(onEdit).toHaveBeenCalledWith(mockImage);
			});
		});

		it("calls onSaveToLibrary with prompt when save is clicked", async () => {
			const user = userEvent.setup();
			const onSaveToLibrary = vi.fn();
			render(
				<LightboxPane {...defaultProps} onSaveToLibrary={onSaveToLibrary} />,
			);

			// Hover over the region container to show overlay
			const region = screen.getByRole("region", { name: "Image preview" });
			await user.hover(region);

			// Wait for overlay and click save
			await waitFor(() => {
				expect(screen.getByTestId("pane-save-button")).toBeInTheDocument();
			});

			const saveButton = screen.getByTestId("pane-save-button");
			saveButton.click();

			await waitFor(() => {
				expect(onSaveToLibrary).toHaveBeenCalledWith(mockImage.prompt);
			});
		});

		it("calls onCopyPrompt with prompt when copy is clicked", async () => {
			const user = userEvent.setup();
			const onCopyPrompt = vi.fn();
			render(<LightboxPane {...defaultProps} onCopyPrompt={onCopyPrompt} />);

			// Hover over the region container to show overlay
			const region = screen.getByRole("region", { name: "Image preview" });
			await user.hover(region);

			// Wait for overlay and click copy
			await waitFor(() => {
				expect(screen.getByTestId("pane-copy-button")).toBeInTheDocument();
			});

			const copyButton = screen.getByTestId("pane-copy-button");
			copyButton.click();

			await waitFor(() => {
				expect(onCopyPrompt).toHaveBeenCalledWith(mockImage.prompt);
			});
		});
	});

	describe("backdrop click", () => {
		it("calls onBackdropClick when backdrop is clicked", async () => {
			const user = userEvent.setup();
			const onBackdropClick = vi.fn();
			render(
				<LightboxPane {...defaultProps} onBackdropClick={onBackdropClick} />,
			);

			const backdrop = screen.getByRole("button", { name: "Close lightbox" });
			await user.click(backdrop);

			expect(onBackdropClick).toHaveBeenCalledTimes(1);
		});

		it("does not call onBackdropClick when hasDragged is true", async () => {
			const user = userEvent.setup();
			const onBackdropClick = vi.fn();

			// Set hasDragged to true
			mockHasDragged.current = true;

			render(
				<LightboxPane {...defaultProps} onBackdropClick={onBackdropClick} />,
			);

			const backdrop = screen.getByRole("button", { name: "Close lightbox" });
			await user.click(backdrop);

			expect(onBackdropClick).not.toHaveBeenCalled();
		});

		it("calls onBackdropClick on Escape key", async () => {
			const user = userEvent.setup();
			const onBackdropClick = vi.fn();
			render(
				<LightboxPane {...defaultProps} onBackdropClick={onBackdropClick} />,
			);

			const backdrop = screen.getByRole("button", { name: "Close lightbox" });
			backdrop.focus();
			await user.keyboard("{Escape}");

			expect(onBackdropClick).toHaveBeenCalledTimes(1);
		});
	});

	describe("zoom functionality", () => {
		it("calls toggleZoom when image is clicked", async () => {
			const user = userEvent.setup();
			render(<LightboxPane {...defaultProps} />);

			const images = screen.getAllByTestId("next-image");
			const imageButton = images[0].closest("button");
			await user.click(imageButton!);

			expect(mockToggleZoom).toHaveBeenCalled();
		});
	});

	describe("selected state", () => {
		it("applies selected styling when isSelected is true", () => {
			render(<LightboxPane {...defaultProps} isSelected={true} />);
			const badges = screen.getAllByTestId("badge");
			// Label badge should have selected styling
			expect(badges[0].className).toContain("bg-primary");
		});

		it("applies default styling when isSelected is false", () => {
			render(<LightboxPane {...defaultProps} isSelected={false} />);
			const badges = screen.getAllByTestId("badge");
			expect(badges[0].className).toContain("bg-black");
		});
	});

	describe("auth-gated actions", () => {
		it("shows sign-in prompts when not signed in", async () => {
			const user = userEvent.setup();
			render(<LightboxPane {...defaultProps} isSignedIn={false} />);

			// Hover to show overlay
			const images = screen.getAllByTestId("next-image");
			const imageButton = images[0].closest("button");
			await user.hover(imageButton!);

			await waitFor(() => {
				expect(screen.getByTestId("pane-edit-signin")).toBeInTheDocument();
				expect(screen.getByTestId("pane-save-signin")).toBeInTheDocument();
				expect(screen.getByTestId("pane-copy-signin")).toBeInTheDocument();
			});
		});
	});

	describe("edit visibility", () => {
		it("hides edit button when canEdit is false", async () => {
			const user = userEvent.setup();
			render(<LightboxPane {...defaultProps} canEdit={false} />);

			// Hover to show overlay
			const images = screen.getAllByTestId("next-image");
			const imageButton = images[0].closest("button");
			await user.hover(imageButton!);

			await waitFor(() => {
				expect(screen.getByTestId("lightbox-pane-overlay")).toBeInTheDocument();
			});

			expect(screen.queryByTestId("pane-edit-button")).not.toBeInTheDocument();
		});
	});
});
