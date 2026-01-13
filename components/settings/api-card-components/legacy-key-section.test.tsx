import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LegacyKeySection } from "./legacy-key-section";

describe("LegacyKeySection", () => {
  const defaultProps = {
    isOpen: false,
    onOpenChange: vi.fn(),
    hasLegacyKey: false,
    isByopConnected: false,
    isLoading: false,
    isRemoving: false,
    onRemove: vi.fn(),
  };

  it("returns null when no legacy key exists", () => {
    const { container } = render(<LegacyKeySection {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders with (active) label when hasLegacyKey is true and BYOP not connected", () => {
    render(<LegacyKeySection {...defaultProps} hasLegacyKey={true} />);
    expect(screen.getByText("Legacy API Key (active)")).toBeInTheDocument();
  });

  it("renders with (inactive) label when hasLegacyKey is true and BYOP is connected", () => {
    render(<LegacyKeySection {...defaultProps} hasLegacyKey={true} isByopConnected={true} />);
    expect(screen.getByText("Legacy API Key (inactive)")).toBeInTheDocument();
  });

  it("renders expanded content when open and has legacy key", () => {
    render(
      <LegacyKeySection {...defaultProps} hasLegacyKey={true} isOpen={true} />
    );
    expect(screen.getByText("API Key Status")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remove key/i })
    ).toBeInTheDocument();
  });

  it("shows legacy key active warning when not connected via BYOP", () => {
    render(
      <LegacyKeySection
        {...defaultProps}
        hasLegacyKey={true}
        isOpen={true}
        isByopConnected={false}
      />
    );
    expect(screen.getByText("Legacy Key Active")).toBeInTheDocument();
  });

  it("shows BYOP connected message when connected via BYOP", () => {
    render(
      <LegacyKeySection
        {...defaultProps}
        hasLegacyKey={true}
        isOpen={true}
        isByopConnected={true}
      />
    );
    expect(screen.getByText("BYOP Connected")).toBeInTheDocument();
  });

  it("shows 'Key is set and hidden' status", () => {
    render(
      <LegacyKeySection {...defaultProps} hasLegacyKey={true} isOpen={true} />
    );
    expect(screen.getByText("Key is set and hidden")).toBeInTheDocument();
  });

  it("shows 'Loading...' when isLoading is true", () => {
    render(
      <LegacyKeySection
        {...defaultProps}
        hasLegacyKey={true}
        isOpen={true}
        isLoading={true}
      />
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows Remove Key button", () => {
    render(
      <LegacyKeySection {...defaultProps} hasLegacyKey={true} isOpen={true} />
    );
    expect(
      screen.getByRole("button", { name: /remove key/i })
    ).toBeInTheDocument();
  });

  it("shows 'Removing...' when isRemoving is true", () => {
    render(
      <LegacyKeySection
        {...defaultProps}
        hasLegacyKey={true}
        isOpen={true}
        isRemoving={true}
      />
    );
    expect(screen.getByText("Removing...")).toBeInTheDocument();
  });

  it("calls onOpenChange when trigger is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <LegacyKeySection
        {...defaultProps}
        hasLegacyKey={true}
        isOpen={false}
        onOpenChange={onOpenChange}
      />
    );

    // Use a more flexible selector since the label is dynamic
    await user.click(screen.getByRole("button", { name: /legacy api key/i }));
    expect(onOpenChange).toHaveBeenCalled();
  });
});
