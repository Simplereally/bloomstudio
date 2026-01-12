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
    inputKey: "",
    onInputKeyChange: vi.fn(),
    isVisible: false,
    onToggleVisibility: vi.fn(),
    isSaving: false,
    isRemoving: false,
    onSave: vi.fn(),
    onRemove: vi.fn(),
  };

  it("renders collapsed by default", () => {
    render(<LegacyKeySection {...defaultProps} />);
    expect(screen.getByText("Manual API Key Entry")).toBeInTheDocument();
    expect(screen.queryByLabelText("Pollinations API Key")).not.toBeInTheDocument();
  });

  it("renders expanded content when open", () => {
    render(<LegacyKeySection {...defaultProps} isOpen={true} />);
    expect(screen.getByLabelText("Pollinations API Key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("shows 'Legacy API Key (active)' when hasLegacyKey is true", () => {
    render(
      <LegacyKeySection {...defaultProps} hasLegacyKey={true} isOpen={false} />
    );
    expect(screen.getByText("Legacy API Key (active)")).toBeInTheDocument();
  });

  it("shows legacy warning when not connected via BYOP", () => {
    render(
      <LegacyKeySection
        {...defaultProps}
        isOpen={true}
        isByopConnected={false}
      />
    );
    expect(screen.getByText("Legacy Option")).toBeInTheDocument();
  });

  it("hides legacy warning when connected via BYOP", () => {
    render(
      <LegacyKeySection {...defaultProps} isOpen={true} isByopConnected={true} />
    );
    expect(screen.queryByText("Legacy Option")).not.toBeInTheDocument();
  });

  it("calls onInputKeyChange when typing", async () => {
    const user = userEvent.setup();
    const onInputKeyChange = vi.fn();
    render(
      <LegacyKeySection
        {...defaultProps}
        isOpen={true}
        onInputKeyChange={onInputKeyChange}
      />
    );

    const input = screen.getByLabelText("Pollinations API Key");
    await user.type(input, "test");
    expect(onInputKeyChange).toHaveBeenCalled();
  });

  it("toggles visibility when visibility button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleVisibility = vi.fn();
    render(
      <LegacyKeySection
        {...defaultProps}
        isOpen={true}
        onToggleVisibility={onToggleVisibility}
      />
    );

    // Find the visibility toggle button (it has Eye icon)
    const visibilityButton = screen.getByRole("button", { name: "" });
    await user.click(visibilityButton);
    expect(onToggleVisibility).toHaveBeenCalledTimes(1);
  });

  it("disables Save button when inputKey is empty", () => {
    render(
      <LegacyKeySection {...defaultProps} isOpen={true} inputKey="" />
    );
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("enables Save button when inputKey has content", () => {
    render(
      <LegacyKeySection {...defaultProps} isOpen={true} inputKey="some-key" />
    );
    expect(screen.getByRole("button", { name: /save/i })).not.toBeDisabled();
  });

  it("calls onSave when Save button is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <LegacyKeySection
        {...defaultProps}
        isOpen={true}
        inputKey="test-key"
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("shows Remove Key button when hasLegacyKey is true", () => {
    render(
      <LegacyKeySection
        {...defaultProps}
        isOpen={true}
        hasLegacyKey={true}
      />
    );
    expect(
      screen.getByRole("button", { name: /remove key/i })
    ).toBeInTheDocument();
  });

  it("shows 'Removing...' when isRemoving is true", () => {
    render(
      <LegacyKeySection
        {...defaultProps}
        isOpen={true}
        hasLegacyKey={true}
        isRemoving={true}
      />
    );
    expect(screen.getByText("Removing...")).toBeInTheDocument();
  });
});
