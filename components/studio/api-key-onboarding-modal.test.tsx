import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiKeyOnboardingModal } from "./api-key-onboarding-modal";

// Mock auth state
let mockPollenAuthState = {
  isAuthorized: false,
  isLoading: false,
};

let mockConvexAuthState = {
  isAuthenticated: true,
  isLoading: false,
};

let mockExistingApiKey: string | null | undefined = null;
const mockGetOrCreateUser = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/pollen-auth", () => ({
  usePollenAuth: () => mockPollenAuthState,
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => mockConvexAuthState,
  useQuery: () => mockExistingApiKey,
  useMutation: () => mockGetOrCreateUser,
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      getPollinationsApiKey: "getPollinationsApiKey",
      getOrCreateUser: "getOrCreateUser",
    },
  },
}));

// Mock the ConnectButton since it's tested separately
vi.mock("@/components/pollen-auth", () => ({
  ConnectButton: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <button data-testid="connect-button" className={className}>
      {children}
    </button>
  ),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

describe("ApiKeyOnboardingModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default state
    mockPollenAuthState = {
      isAuthorized: false,
      isLoading: false,
    };
    mockConvexAuthState = {
      isAuthenticated: true,
      isLoading: false,
    };
    mockExistingApiKey = null;
  });

  describe("Automatic mode (no forceOpen prop)", () => {
    it("renders when user has no valid auth", async () => {
      render(<ApiKeyOnboardingModal />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /connect to pollinations/i })).toBeInTheDocument();
        expect(screen.getByText(/zero api costs/i)).toBeInTheDocument();
      });
    });

    it("does not render when user is already authorized via BYOP", () => {
      mockPollenAuthState.isAuthorized = true;

      const { container } = render(<ApiKeyOnboardingModal />);

      expect(container).toBeEmptyDOMElement();
    });

    it("does not render when user has existing API key", () => {
      mockExistingApiKey = "existing-key";

      const { container } = render(<ApiKeyOnboardingModal />);

      expect(container).toBeEmptyDOMElement();
    });

    it("does not render while pollen auth is loading", () => {
      mockPollenAuthState.isLoading = true;

      const { container } = render(<ApiKeyOnboardingModal />);

      expect(container).toBeEmptyDOMElement();
    });

    it("does not render while convex auth is loading", () => {
      mockConvexAuthState.isLoading = true;

      const { container } = render(<ApiKeyOnboardingModal />);

      expect(container).toBeEmptyDOMElement();
    });

    it("does not render when user is not authenticated", () => {
      mockConvexAuthState.isAuthenticated = false;

      const { container } = render(<ApiKeyOnboardingModal />);

      expect(container).toBeEmptyDOMElement();
    });

    it("calls getOrCreateUser on mount when authenticated", async () => {
      render(<ApiKeyOnboardingModal />);

      await waitFor(() => {
        expect(mockGetOrCreateUser).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Controlled mode (forceOpen prop)", () => {
    it("renders when forceOpen is true regardless of auth state", async () => {
      mockPollenAuthState.isAuthorized = true;
      mockExistingApiKey = "existing-key";

      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /connect to pollinations/i })).toBeInTheDocument();
      });
    });

    it("does not render when forceOpen is false", () => {
      render(<ApiKeyOnboardingModal forceOpen={false} onClose={vi.fn()} />);

      expect(
        screen.queryByRole("heading", { name: /connect to pollinations/i })
      ).not.toBeInTheDocument();
    });

    it("calls onClose when modal is closed via escape", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<ApiKeyOnboardingModal forceOpen={true} onClose={onClose} />);

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("Setup page content", () => {
    it("displays setup page by default", async () => {
      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /connect to pollinations/i })).toBeInTheDocument();
        expect(
          screen.getByText(/one-click setup\. generate unlimited images for free\./i)
        ).toBeInTheDocument();
      });
    });

    it("displays connect button", () => {
      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      expect(screen.getByTestId("connect-button")).toBeInTheDocument();
      expect(
        screen.getByText(/connect with pollinations/i)
      ).toBeInTheDocument();
    });

    it("displays free and 30-day authorization badges", () => {
      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText("Free")).toBeInTheDocument();
      expect(screen.getByText(/30-day authorization/i)).toBeInTheDocument();
    });

    it("displays footer security message", () => {
      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      expect(
        screen.getByText(/your connection is secure and renews every 30 days/i)
      ).toBeInTheDocument();
    });
  });

  describe("Upgrade page navigation", () => {
    it("shows preview button in non-production environments", () => {
      // process.env.NODE_ENV is 'test' in vitest which is !== 'production'
      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      expect(
        screen.getByRole("button", { name: /preview upgrade/i })
      ).toBeInTheDocument();
    });

    it("navigates to upgrade page when preview button is clicked", async () => {
      const user = userEvent.setup();

      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      const previewButton = screen.getByRole("button", {
        name: /preview upgrade/i,
      });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /github developer bonus/i })).toBeInTheDocument();
      });
    });

    it("displays increased quota information on upgrade page", async () => {
      const user = userEvent.setup();

      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /preview upgrade/i }));

      await waitFor(() => {
        // Updated to match "Increased Quota" which is in the current component
        expect(screen.getByText("Increased Quota")).toBeInTheDocument();
        expect(screen.getByText(/3× limits/i)).toBeInTheDocument();
        expect(screen.getByText("180")).toBeInTheDocument();
        expect(screen.getByText("540")).toBeInTheDocument();
      });
    });

    it("displays 'Connected' badge on upgrade page", async () => {
      const user = userEvent.setup();

      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /preview upgrade/i }));

      await waitFor(() => {
        expect(screen.getByText("Connected")).toBeInTheDocument();
      });
    });

    it("calls onComplete when 'Continue to Studio' is clicked", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      const onClose = vi.fn();

      render(
        <ApiKeyOnboardingModal
          forceOpen={true}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      await user.click(screen.getByRole("button", { name: /preview upgrade/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /continue to studio/i })).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /continue to studio/i })
      );

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("displays powered by pollinations footer on upgrade page", async () => {
      const user = userEvent.setup();

      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /preview upgrade/i }));

      await waitFor(() => {
        expect(screen.getByText(/powered by pollinations/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible dialog role", () => {
      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("connect button is focusable", () => {
      render(<ApiKeyOnboardingModal forceOpen={true} onClose={vi.fn()} />);

      const connectButton = screen.getByTestId("connect-button");
      expect(connectButton).not.toHaveAttribute("tabindex", "-1");
    });
  });
});
