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

// Mock API
vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      getSensitiveContentPreference: "users:getSensitiveContentPreference",
      updateSensitiveContentPreference: "users:updateSensitiveContentPreference",
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

describe("ContentPreferenceCard", () => {
  const mockUpdatePreference = vi.fn().mockResolvedValue(undefined);

  interface MutationArgs {
    showSensitiveContent?: string;
  }

  function isMutationArgs(value: unknown): value is MutationArgs {
    return typeof value === "object" && value !== null && "showSensitiveContent" in value;
  }

  type MutationReturn = ReturnType<typeof useMutation>;

  function createMockMutation(): MutationReturn {
    const mutation: MutationReturn = Object.assign(
      async (args?: unknown) => {
        if (!isMutationArgs(args) || !args.showSensitiveContent) {
          return;
        }
        await mockUpdatePreference({ showSensitiveContent: args.showSensitiveContent });
      },
      {
        withOptimisticUpdate: vi.fn(() => mutation),
      }
    );
    return mutation;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMutation).mockReturnValue(createMockMutation());
  });

  it("shows loading state when preference is undefined", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    render(<ContentPreferenceCard />);
    const skeleton = screen.getAllByText((content, element) => {
      return element?.classList.contains("animate-pulse") ?? false;
    });
    expect(skeleton.length).toBeGreaterThan(0);
  });

  it("renders options when loaded", () => {
    vi.mocked(useQuery).mockReturnValue("blur");
    render(<ContentPreferenceCard />);

    expect(screen.getByText("Content Visibility")).toBeInTheDocument();
    expect(screen.getByLabelText(/Hide Sensitive Content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blur Sensitive Content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Show All Content/i)).toBeInTheDocument();
  });

  it("shows current preference as checked", () => {
    vi.mocked(useQuery).mockReturnValue("allow");
    render(<ContentPreferenceCard />);

    const allowRadio = screen.getByRole("radio", { name: /Show All Content/i });
    expect(allowRadio).toHaveAttribute("data-state", "checked");
  });

  it("calls mutation when option is changed", () => {
    vi.mocked(useQuery).mockReturnValue("blur");
    render(<ContentPreferenceCard />);

    const blockRadio = screen.getByRole("radio", { name: /Hide Sensitive Content/i });
    fireEvent.click(blockRadio);

    expect(mockUpdatePreference).toHaveBeenCalledWith({ showSensitiveContent: "block" });
  });
});
