// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LightboxImage } from "@/hooks/use-image-lightbox";
import { LightboxPaneOverlay } from "./lightbox-pane-overlay";

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

describe("LightboxPaneOverlay", () => {
	const mockImage: LightboxImage = {
		url: "https://example.com/test.jpg",
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
		isVisible: true,
		isSignedIn: true,
		canEdit: true,
		copied: false,
		onEdit: vi.fn(),
		onSaveToLibrary: vi.fn(),
		onCopyPrompt: vi.fn(),
		onHoverChange: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("visibility", () => {
		it("renders when isVisible is true", () => {
			render(<LightboxPaneOverlay {...defaultProps} isVisible={true} />);
			expect(screen.getByTestId("lightbox-pane-overlay")).toBeInTheDocument();
		});

		it("does not render when isVisible is false", () => {
			render(<LightboxPaneOverlay {...defaultProps} isVisible={false} />);
			expect(
				screen.queryByTestId("lightbox-pane-overlay"),
			).not.toBeInTheDocument();
		});
	});

	describe("content display", () => {
		it("displays truncated prompt", () => {
			render(<LightboxPaneOverlay {...defaultProps} />);
			expect(
				screen.getByText("A beautiful sunset over the ocean"),
			).toBeInTheDocument();
		});

		it("does not display prompt when image has no prompt", () => {
			const imageWithoutPrompt = { ...mockImage, prompt: undefined };
			render(
				<LightboxPaneOverlay {...defaultProps} image={imageWithoutPrompt} />,
			);
			expect(
				screen.queryByText("A beautiful sunset over the ocean"),
			).not.toBeInTheDocument();
		});

		it("displays model badge", () => {
			render(<LightboxPaneOverlay {...defaultProps} />);
			expect(screen.getByText("FLUX-PRO")).toBeInTheDocument();
		});

		it("displays dimensions badge", () => {
			render(<LightboxPaneOverlay {...defaultProps} />);
			expect(screen.getByText("1024×1024")).toBeInTheDocument();
		});
	});

	describe("action buttons - signed in", () => {
		it("renders edit button when signed in and canEdit is true", () => {
			render(<LightboxPaneOverlay {...defaultProps} />);
			expect(screen.getByTestId("pane-edit-button")).toBeInTheDocument();
		});

		it("renders save to library button when signed in", () => {
			render(<LightboxPaneOverlay {...defaultProps} />);
			expect(screen.getByTestId("pane-save-button")).toBeInTheDocument();
		});

		it("renders copy prompt button when signed in", () => {
			render(<LightboxPaneOverlay {...defaultProps} />);
			expect(screen.getByTestId("pane-copy-button")).toBeInTheDocument();
		});

		it("does not render edit button when canEdit is false", () => {
			render(<LightboxPaneOverlay {...defaultProps} canEdit={false} />);
			expect(screen.queryByTestId("pane-edit-button")).not.toBeInTheDocument();
		});
	});

	describe("action buttons - not signed in", () => {
		it("renders sign-in link for edit when not signed in", () => {
			render(<LightboxPaneOverlay {...defaultProps} isSignedIn={false} />);
			expect(screen.getByTestId("pane-edit-signin")).toBeInTheDocument();
		});

		it("renders sign-in link for save when not signed in", () => {
			render(<LightboxPaneOverlay {...defaultProps} isSignedIn={false} />);
			expect(screen.getByTestId("pane-save-signin")).toBeInTheDocument();
		});

		it("renders sign-in link for copy when not signed in", () => {
			render(<LightboxPaneOverlay {...defaultProps} isSignedIn={false} />);
			expect(screen.getByTestId("pane-copy-signin")).toBeInTheDocument();
		});
	});

	describe("button interactions", () => {
		it("calls onEdit when edit button is clicked", async () => {
			const user = userEvent.setup();
			const onEdit = vi.fn();
			render(<LightboxPaneOverlay {...defaultProps} onEdit={onEdit} />);

			await user.click(screen.getByTestId("pane-edit-button"));
			expect(onEdit).toHaveBeenCalledTimes(1);
		});

		it("calls onSaveToLibrary when save button is clicked", async () => {
			const user = userEvent.setup();
			const onSaveToLibrary = vi.fn();
			render(
				<LightboxPaneOverlay
					{...defaultProps}
					onSaveToLibrary={onSaveToLibrary}
				/>,
			);

			await user.click(screen.getByTestId("pane-save-button"));
			expect(onSaveToLibrary).toHaveBeenCalledTimes(1);
		});

		it("calls onCopyPrompt when copy button is clicked", async () => {
			const user = userEvent.setup();
			const onCopyPrompt = vi.fn();
			render(
				<LightboxPaneOverlay {...defaultProps} onCopyPrompt={onCopyPrompt} />,
			);

			await user.click(screen.getByTestId("pane-copy-button"));
			expect(onCopyPrompt).toHaveBeenCalledTimes(1);
		});
	});

	describe("copy feedback", () => {
		it("shows check icon when copied is true", () => {
			render(<LightboxPaneOverlay {...defaultProps} copied={true} />);
			expect(screen.getByTestId("check-icon")).toBeInTheDocument();
		});

		it("shows copy icon when copied is false", () => {
			render(<LightboxPaneOverlay {...defaultProps} copied={false} />);
			expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
		});
	});

	describe("hover behavior", () => {
		it("calls onHoverChange(true) on mouse enter", async () => {
			const user = userEvent.setup();
			const onHoverChange = vi.fn();
			render(
				<LightboxPaneOverlay {...defaultProps} onHoverChange={onHoverChange} />,
			);

			const section = screen.getByLabelText("Image details and actions");
			await user.hover(section);

			expect(onHoverChange).toHaveBeenCalledWith(true);
		});

		it("calls onHoverChange(false) on mouse leave", async () => {
			const user = userEvent.setup();
			const onHoverChange = vi.fn();
			render(
				<LightboxPaneOverlay {...defaultProps} onHoverChange={onHoverChange} />,
			);

			const section = screen.getByLabelText("Image details and actions");
			await user.hover(section);
			await user.unhover(section);

			expect(onHoverChange).toHaveBeenLastCalledWith(false);
		});
	});

	describe("disabled states", () => {
		it("disables save button when image has no prompt", () => {
			const imageWithoutPrompt = { ...mockImage, prompt: undefined };
			render(
				<LightboxPaneOverlay {...defaultProps} image={imageWithoutPrompt} />,
			);

			const saveButton = screen.getByTestId("pane-save-button");
			expect(saveButton).toBeDisabled();
		});

		it("disables copy button when image has no prompt", () => {
			const imageWithoutPrompt = { ...mockImage, prompt: undefined };
			render(
				<LightboxPaneOverlay {...defaultProps} image={imageWithoutPrompt} />,
			);

			const copyButton = screen.getByTestId("pane-copy-button");
			expect(copyButton).toBeDisabled();
		});
	});
});
