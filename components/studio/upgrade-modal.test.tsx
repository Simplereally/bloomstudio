import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVE_MODEL_COUNT } from "@/lib/config/models";
import { UpgradeModal } from "./upgrade-modal";

// Mock dependencies
const mockCreateCheckout = vi.fn();

vi.mock("convex/react", () => ({
	useAction: () => mockCreateCheckout,
}));

vi.mock("@/convex/_generated/api", () => ({
	api: {
		stripe: {
			createSubscriptionCheckout: "createSubscriptionCheckout",
		},
	},
}));

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
	},
}));

// Mock window.location
const originalLocation = window.location;

describe("UpgradeModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Reset window.location mock
		Object.defineProperty(window, "location", {
			writable: true,
			value: { ...originalLocation, href: "", origin: "http://localhost:3000" },
		});
	});

	it("does not render when closed", () => {
		render(<UpgradeModal isOpen={false} onClose={vi.fn()} />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders when open", () => {
		render(<UpgradeModal isOpen={true} onClose={vi.fn()} />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Trial Ended")).toBeInTheDocument();
		expect(screen.getByText("Continue Creating")).toBeInTheDocument();
	});

	it("displays pro features", () => {
		render(<UpgradeModal isOpen={true} onClose={vi.fn()} />);
		expect(screen.getByText("5,000+")).toBeInTheDocument();
		expect(
			screen.getByText("generations / day"),
		).toBeInTheDocument();
		expect(screen.getByText(String(ACTIVE_MODEL_COUNT))).toBeInTheDocument();
		expect(screen.getByText("AI models included")).toBeInTheDocument();
		expect(screen.getByText("Daily")).toBeInTheDocument();
	});

	it("displays correct pricing", () => {
		render(<UpgradeModal isOpen={true} onClose={vi.fn()} />);
		expect(screen.getByText("$3")).toBeInTheDocument();
		expect(screen.getByText("/month")).toBeInTheDocument();
	});

	it("calls onClose when 'Not now' is clicked", async () => {
		const onClose = vi.fn();
		const user = userEvent.setup();
		render(<UpgradeModal isOpen={true} onClose={onClose} />);

		await user.click(screen.getByRole("button", { name: /not now/i }));
		expect(onClose).toHaveBeenCalled();
	});

	it("initiates checkout on upgrade click", async () => {
		const user = userEvent.setup();
		mockCreateCheckout.mockResolvedValue({
			url: "https://stripe.com/checkout",
		});

		render(<UpgradeModal isOpen={true} onClose={vi.fn()} />);

		await user.click(screen.getByRole("button", { name: /upgrade to pro/i }));

		expect(mockCreateCheckout).toHaveBeenCalledWith({
			planType: "monthly",
			successUrl: "http://localhost:3000/studio?upgraded=true",
			cancelUrl: "http://localhost:3000/pricing?canceled=true",
		});

		await waitFor(() => {
			expect(window.location.href).toBe("https://stripe.com/checkout");
		});
	});

	it("handles checkout loading state", async () => {
		const user = userEvent.setup();
		mockCreateCheckout.mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(() => resolve({ url: "https://stripe.com" }), 100),
				),
		);

		render(<UpgradeModal isOpen={true} onClose={vi.fn()} />);

		const button = screen.getByRole("button", { name: /upgrade to pro/i });
		await user.click(button);

		expect(await screen.findByText(/redirecting/i)).toBeInTheDocument();
		expect(button).toBeDisabled();
	});

	it("handles empty checkout URL", async () => {
		const user = userEvent.setup();
		mockCreateCheckout.mockResolvedValue({ url: null });
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<UpgradeModal isOpen={true} onClose={vi.fn()} />);

		await user.click(screen.getByRole("button", { name: /upgrade to pro/i }));

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"Checkout error:",
				expect.any(Error),
			);
			expect(toast.error).toHaveBeenCalledWith(
				"Checkout failed",
				expect.any(Object),
			);
		});
	});

	it("handles checkout API error", async () => {
		const user = userEvent.setup();
		mockCreateCheckout.mockRejectedValue(new Error("Network error"));
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<UpgradeModal isOpen={true} onClose={vi.fn()} />);

		await user.click(screen.getByRole("button", { name: /upgrade to pro/i }));

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"Checkout error:",
				expect.any(Error),
			);
			expect(toast.error).toHaveBeenCalledWith(
				"Checkout failed",
				expect.any(Object),
			);
		});
	});
});
