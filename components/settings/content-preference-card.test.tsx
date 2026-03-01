/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContentPreferenceCard } from "./content-preference-card";
import { useQuery, useMutation } from "convex/react";

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock API — factory is hoisted, so values must be inline literals
vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      getSensitiveContentPreference: "users:getSensitiveContentPreference",
      updateSensitiveContentPreference: "users:updateSensitiveContentPreference",
      getDefaultPrivate: "users:getDefaultPrivate",
      updateDefaultPrivate: "users:updateDefaultPrivate",
    },
  },
}));

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Query/mutation reference strings (must match the mock above)
const SENSITIVE_PREF_QUERY = "users:getSensitiveContentPreference";
const DEFAULT_PRIVATE_QUERY = "users:getDefaultPrivate";
const UPDATE_SENSITIVE_PREF_MUTATION = "users:updateSensitiveContentPreference";
const UPDATE_DEFAULT_PRIVATE_MUTATION = "users:updateDefaultPrivate";

describe("ContentPreferenceCard", () => {
  const mockUpdatePreference = vi.fn().mockResolvedValue(undefined);
  const mockUpdateDefaultPrivate = vi.fn().mockResolvedValue(undefined);

  type MutationReturn = ReturnType<typeof useMutation>;

  function createMockPreferenceMutation(): MutationReturn {
    const mutation: MutationReturn = Object.assign(
      async (args?: unknown) => {
        if (
          typeof args === "object" &&
          args !== null &&
          "showSensitiveContent" in args
        ) {
          await mockUpdatePreference({
            showSensitiveContent: (args as { showSensitiveContent: string })
              .showSensitiveContent,
          });
        }
      },
      { withOptimisticUpdate: vi.fn().mockReturnThis() }
    );
    return mutation;
  }

  function createMockDefaultPrivateMutation(): MutationReturn {
    const mutation: MutationReturn = Object.assign(
      async (args?: unknown) => {
        if (
          typeof args === "object" &&
          args !== null &&
          "defaultPrivate" in args
        ) {
          await mockUpdateDefaultPrivate({
            defaultPrivate: (args as { defaultPrivate: boolean })
              .defaultPrivate,
          });
        }
      },
      { withOptimisticUpdate: vi.fn().mockReturnThis() }
    );
    return mutation;
  }

  /**
   * Configure the `useQuery` mock to return different values
   * based on which query reference is passed.
   */
  function mockQueries(values: {
    preference?: string | undefined;
    defaultPrivate?: boolean | undefined;
  }) {
    vi.mocked(useQuery).mockImplementation(
      (queryRef: unknown, ..._args: unknown[]) => {
        if (queryRef === SENSITIVE_PREF_QUERY) return values.preference;
        if (queryRef === DEFAULT_PRIVATE_QUERY) return values.defaultPrivate;
        return undefined;
      },
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();

    // Discriminate mutations by reference
    vi.mocked(useMutation).mockImplementation(
      (mutationRef: unknown) => {
        if (mutationRef === UPDATE_SENSITIVE_PREF_MUTATION) {
          return createMockPreferenceMutation();
        }
        if (mutationRef === UPDATE_DEFAULT_PRIVATE_MUTATION) {
          return createMockDefaultPrivateMutation();
        }
        return createMockPreferenceMutation(); // fallback
      },
    );
  });

  // =========================================================
  // Loading / Skeleton states
  // =========================================================

  it("shows loading state when preference is undefined", () => {
    mockQueries({ preference: undefined, defaultPrivate: undefined });
    render(<ContentPreferenceCard />);

    const skeleton = screen.getAllByText((_content, element) => {
      return element?.classList.contains("animate-pulse") ?? false;
    });
    expect(skeleton.length).toBeGreaterThan(0);
  });

  it("shows loading state when only preference is loaded but defaultPrivate is still undefined", () => {
    mockQueries({ preference: "blur", defaultPrivate: undefined });
    render(<ContentPreferenceCard />);

    const skeleton = screen.getAllByText((_content, element) => {
      return element?.classList.contains("animate-pulse") ?? false;
    });
    expect(skeleton.length).toBeGreaterThan(0);
  });

  it("shows loading state when only defaultPrivate is loaded but preference is still undefined", () => {
    mockQueries({ preference: undefined, defaultPrivate: false });
    render(<ContentPreferenceCard />);

    const skeleton = screen.getAllByText((_content, element) => {
      return element?.classList.contains("animate-pulse") ?? false;
    });
    expect(skeleton.length).toBeGreaterThan(0);
  });

  // =========================================================
  // Rendered content
  // =========================================================

  it("renders all sections when loaded", () => {
    mockQueries({ preference: "blur", defaultPrivate: false });
    render(<ContentPreferenceCard />);

    // Card header
    expect(screen.getByText("Privacy & Safety")).toBeInTheDocument();

    // Section headers
    expect(screen.getByText("Generation Defaults")).toBeInTheDocument();
    expect(screen.getByText("Content Visibility")).toBeInTheDocument();

    // Content visibility radio options
    expect(screen.getByLabelText(/Hide Sensitive Content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blur Sensitive Content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Show All Content/i)).toBeInTheDocument();

    // Private toggle
    expect(screen.getByText("Private Mode by Default")).toBeInTheDocument();
  });

  // =========================================================
  // Content Visibility (Radio Group)
  // =========================================================

  it("shows current content preference as checked", () => {
    mockQueries({ preference: "allow", defaultPrivate: false });
    render(<ContentPreferenceCard />);

    const allowRadio = screen.getByRole("radio", { name: /Show All Content/i });
    expect(allowRadio).toHaveAttribute("data-state", "checked");
  });

  it("calls preference mutation when radio option is changed", () => {
    mockQueries({ preference: "blur", defaultPrivate: false });
    render(<ContentPreferenceCard />);

    const blockRadio = screen.getByRole("radio", { name: /Hide Sensitive Content/i });
    fireEvent.click(blockRadio);

    expect(mockUpdatePreference).toHaveBeenCalledWith({
      showSensitiveContent: "block",
    });
  });

  // =========================================================
  // Private Mode Toggle
  // =========================================================

  it("renders private mode toggle in off state when defaultPrivate is false", () => {
    mockQueries({ preference: "blur", defaultPrivate: false });
    render(<ContentPreferenceCard />);

    const toggle = screen.getByTestId("switch-default-private");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("data-state", "unchecked");
  });

  it("renders private mode toggle in on state when defaultPrivate is true", () => {
    mockQueries({ preference: "blur", defaultPrivate: true });
    render(<ContentPreferenceCard />);

    const toggle = screen.getByTestId("switch-default-private");
    expect(toggle).toHaveAttribute("data-state", "checked");
  });

  it("calls defaultPrivate mutation when toggle is clicked", () => {
    mockQueries({ preference: "blur", defaultPrivate: false });
    render(<ContentPreferenceCard />);

    const toggle = screen.getByTestId("switch-default-private");
    fireEvent.click(toggle);

    expect(mockUpdateDefaultPrivate).toHaveBeenCalledWith({
      defaultPrivate: true,
    });
  });

  it("does not call preference mutation when toggle is clicked", () => {
    mockQueries({ preference: "blur", defaultPrivate: false });
    render(<ContentPreferenceCard />);

    const toggle = screen.getByTestId("switch-default-private");
    fireEvent.click(toggle);

    // Only the private mutation should be called, not the content preference one
    expect(mockUpdateDefaultPrivate).toHaveBeenCalledTimes(1);
    expect(mockUpdatePreference).not.toHaveBeenCalled();
  });
});
