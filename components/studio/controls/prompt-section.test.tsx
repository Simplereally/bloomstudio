/**
 * @vitest-environment jsdom
 *
 * Tests for PromptSection - focused on negative prompt content state
 * being independent from positive prompt content state.
 */
import { TooltipProvider } from "@/components/ui/tooltip";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PromptSection, type PromptSectionProps } from "./prompt-section";

// Mock prompt library components since they require auth/convex
vi.mock("@/components/studio/features/prompt-library", () => ({
  PromptLibrary: () => null,
  PromptLibraryButton: ({
    onClick,
    ...props
  }: {
    onClick: () => void;
    variant: string;
    className: string;
  }) => (
    <button type="button" data-testid="library-button" onClick={onClick} {...props}>
      Library
    </button>
  ),
  SavePromptButton: ({
    onClick,
    disabled,
    ...props
  }: {
    onClick: () => void;
    disabled?: boolean;
    variant: string;
    className: string;
  }) => (
    <button type="button" data-testid="save-prompt-button" onClick={onClick} disabled={disabled} {...props}>
      Save
    </button>
  ),
}));

function renderWithProviders(props: Partial<PromptSectionProps> = {}) {
  const defaultProps: PromptSectionProps = {
    showNegativePrompt: true,
    ...props,
  };
  return render(
    <TooltipProvider>
      <PromptSection {...defaultProps} />
    </TooltipProvider>,
  );
}

describe("PromptSection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the prompt section", () => {
    renderWithProviders();
    expect(screen.getByTestId("prompt-section")).toBeInTheDocument();
  });

  it("renders the prompt textarea", () => {
    renderWithProviders();
    expect(screen.getByTestId("prompt-input")).toBeInTheDocument();
  });

  describe("negative prompt EnhanceButton disabled state", () => {
    const enhanceProps = {
      showNegativePrompt: true,
      onEnhancePrompt: vi.fn(),
      onCancelEnhancePrompt: vi.fn(),
      onEnhanceNegativePrompt: vi.fn(),
      onCancelEnhanceNegativePrompt: vi.fn(),
    };

    it("disables negative enhance button when negative prompt is empty", async () => {
      const user = userEvent.setup();
      renderWithProviders(enhanceProps);

      // Open negative prompt section
      await user.click(screen.getByTestId("negative-prompt-toggle"));

      // Negative prompt enhance button should be disabled (no negative content)
      const negativeInput = screen.getByTestId("negative-prompt-input");
      expect(negativeInput).toBeInTheDocument();

      // The negative enhance button should be disabled since there's no negative content
      const enhanceButtons = screen.getAllByLabelText("Enhance with AI");
      // Second enhance button is for negative prompt
      const negativeEnhanceButton = enhanceButtons[1];
      expect(negativeEnhanceButton).toBeDisabled();
    });

    it("enables negative enhance button when negative prompt has content", async () => {
      const user = userEvent.setup();
      renderWithProviders(enhanceProps);

      // Open negative prompt section
      await user.click(screen.getByTestId("negative-prompt-toggle"));

      // Type in negative prompt
      const negativeInput = screen.getByTestId("negative-prompt-input");
      await user.type(negativeInput, "blurry, low quality");

      // The negative enhance button should now be enabled
      await waitFor(() => {
        const enhanceButtons = screen.getAllByLabelText("Enhance with AI");
        const negativeEnhanceButton = enhanceButtons[1];
        expect(negativeEnhanceButton).not.toBeDisabled();
      });
    });

    it("keeps negative enhance button disabled when only positive prompt has content", async () => {
      const user = userEvent.setup();
      renderWithProviders(enhanceProps);

      // Type in positive prompt only
      const positiveInput = screen.getByTestId("prompt-input");
      await user.type(positiveInput, "A beautiful sunset");

      // Open negative prompt section
      await user.click(screen.getByTestId("negative-prompt-toggle"));

      // The negative enhance button should still be disabled (no negative content)
      await waitFor(() => {
        const enhanceButtons = screen.getAllByLabelText("Enhance with AI");
        const negativeEnhanceButton = enhanceButtons[1];
        expect(negativeEnhanceButton).toBeDisabled();
      });
    });

    it("enables positive enhance button independently of negative prompt content", async () => {
      const user = userEvent.setup();
      renderWithProviders(enhanceProps);

      // Type in positive prompt
      const positiveInput = screen.getByTestId("prompt-input");
      await user.type(positiveInput, "A beautiful sunset");

      // Positive enhance button should be enabled
      await waitFor(() => {
        const enhanceButtons = screen.getAllByLabelText("Enhance with AI");
        const positiveEnhanceButton = enhanceButtons[0];
        expect(positiveEnhanceButton).not.toBeDisabled();
      });
    });

    it("both enhance buttons enabled when both prompts have content", async () => {
      const user = userEvent.setup();
      renderWithProviders(enhanceProps);

      // Type in positive prompt
      const positiveInput = screen.getByTestId("prompt-input");
      await user.type(positiveInput, "A beautiful sunset");

      // Open negative prompt and type
      await user.click(screen.getByTestId("negative-prompt-toggle"));
      const negativeInput = screen.getByTestId("negative-prompt-input");
      await user.type(negativeInput, "blurry, low quality");

      // Both enhance buttons should be enabled
      await waitFor(() => {
        const enhanceButtons = screen.getAllByLabelText("Enhance with AI");
        expect(enhanceButtons[0]).not.toBeDisabled();
        expect(enhanceButtons[1]).not.toBeDisabled();
      });
    });

    it("disables negative enhance button again after clearing negative prompt", async () => {
      const user = userEvent.setup();
      renderWithProviders(enhanceProps);

      // Open negative prompt section
      await user.click(screen.getByTestId("negative-prompt-toggle"));

      // Type then clear negative prompt
      const negativeInput = screen.getByTestId("negative-prompt-input");
      await user.type(negativeInput, "blurry");

      // Wait for enabled state
      await waitFor(() => {
        const enhanceButtons = screen.getAllByLabelText("Enhance with AI");
        expect(enhanceButtons[1]).not.toBeDisabled();
      });

      // Clear the negative prompt
      await user.clear(negativeInput);

      // Negative enhance button should be disabled again
      await waitFor(() => {
        const enhanceButtons = screen.getAllByLabelText("Enhance with AI");
        expect(enhanceButtons[1]).toBeDisabled();
      });
    });
  });

  describe("negative prompt SavePromptButton disabled state", () => {
    const libraryProps = {
      showNegativePrompt: true,
      showLibrary: true,
      onEnhancePrompt: vi.fn(),
      onCancelEnhancePrompt: vi.fn(),
      onEnhanceNegativePrompt: vi.fn(),
      onCancelEnhanceNegativePrompt: vi.fn(),
    };

    it("disables negative save button when negative prompt is empty", async () => {
      const user = userEvent.setup();
      renderWithProviders(libraryProps);

      // Open negative prompt section
      await user.click(screen.getByTestId("negative-prompt-toggle"));

      // Save buttons: first is positive, second is negative
      const saveButtons = screen.getAllByTestId("save-prompt-button");
      const negativeSaveButton = saveButtons[1];
      expect(negativeSaveButton).toBeDisabled();
    });

    it("enables negative save button when negative prompt has content", async () => {
      const user = userEvent.setup();
      renderWithProviders(libraryProps);

      // Open negative prompt section
      await user.click(screen.getByTestId("negative-prompt-toggle"));

      // Type in negative prompt
      const negativeInput = screen.getByTestId("negative-prompt-input");
      await user.type(negativeInput, "blurry, low quality");

      // Negative save button should be enabled
      await waitFor(() => {
        const saveButtons = screen.getAllByTestId("save-prompt-button");
        const negativeSaveButton = saveButtons[1];
        expect(negativeSaveButton).not.toBeDisabled();
      });
    });
  });
});
