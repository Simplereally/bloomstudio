import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PromptSection, type PromptSectionProps, type PromptSectionAPI } from "./prompt-section";
import * as React from "react";

// Mock the prompt library components
vi.mock("@/components/studio/features/prompt-library", () => ({
  PromptLibrary: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="prompt-library-modal">Library Modal</div> : null,
  PromptLibraryButton: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button data-testid="library-button" onClick={onClick} disabled={disabled}>
      Library
    </button>
  ),
  SavePromptButton: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button data-testid="save-prompt-button" onClick={onClick} disabled={disabled}>
      Save
    </button>
  ),
}));

// Mock the usePromptInput hook
vi.mock("@/hooks/use-prompt-input", () => ({
  usePromptInput: () => {
    const promptRef = React.useRef<HTMLTextAreaElement>(null);
    const negativePromptRef = React.useRef<HTMLTextAreaElement>(null);
    const promptSubscribers = React.useRef<Set<(value: string) => void>>(new Set());
    const negativeSubscribers = React.useRef<Set<(value: string) => void>>(new Set());

    return {
      promptRef,
      negativePromptRef,
      getPrompt: () => promptRef.current?.value ?? "",
      setPrompt: (value: string) => {
        if (promptRef.current) promptRef.current.value = value;
        promptSubscribers.current.forEach((cb) => cb(value));
      },
      getNegativePrompt: () => negativePromptRef.current?.value ?? "",
      setNegativePrompt: (value: string) => {
        if (negativePromptRef.current) negativePromptRef.current.value = value;
        negativeSubscribers.current.forEach((cb) => cb(value));
      },
      subscribeToPrompt: (cb: (value: string) => void) => {
        promptSubscribers.current.add(cb);
        return () => promptSubscribers.current.delete(cb);
      },
      subscribeToNegativePrompt: (cb: (value: string) => void) => {
        negativeSubscribers.current.add(cb);
        return () => negativeSubscribers.current.delete(cb);
      },
    };
  },
}));

describe("PromptSection", () => {
  const defaultProps: PromptSectionProps = {};

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the prompt section", () => {
      render(<PromptSection {...defaultProps} />);
      expect(screen.getByTestId("prompt-section")).toBeInTheDocument();
    });

    it("renders the prompt input", () => {
      render(<PromptSection {...defaultProps} />);
      expect(screen.getByTestId("prompt-input")).toBeInTheDocument();
    });

    it("renders the character count", () => {
      render(<PromptSection {...defaultProps} />);
      expect(screen.getByTestId("character-count")).toHaveTextContent("0/2000");
    });

    it("hides header when hideHeader is true", () => {
      render(<PromptSection {...defaultProps} hideHeader />);
      expect(screen.queryByTestId("character-count")).not.toBeInTheDocument();
    });

    it("renders negative prompt toggle when showNegativePrompt is true", () => {
      render(<PromptSection {...defaultProps} showNegativePrompt />);
      expect(screen.getByTestId("negative-prompt-toggle")).toBeInTheDocument();
    });

    it("hides negative prompt toggle when showNegativePrompt is false", () => {
      render(<PromptSection {...defaultProps} showNegativePrompt={false} />);
      expect(screen.queryByTestId("negative-prompt-toggle")).not.toBeInTheDocument();
    });
  });

  describe("prompt history", () => {
    it("shows history toggle when promptHistory is provided", () => {
      render(<PromptSection {...defaultProps} promptHistory={["test prompt"]} />);
      expect(screen.getByTestId("history-toggle")).toBeInTheDocument();
    });

    it("hides history toggle when promptHistory is empty", () => {
      render(<PromptSection {...defaultProps} promptHistory={[]} />);
      expect(screen.queryByTestId("history-toggle")).not.toBeInTheDocument();
    });

    it("shows history dropdown when toggle is clicked", async () => {
      render(<PromptSection {...defaultProps} promptHistory={["test prompt 1", "test prompt 2"]} />);

      const toggle = screen.getByTestId("history-toggle");
      await userEvent.click(toggle);

      expect(screen.getByTestId("prompt-history")).toBeInTheDocument();
    });

    it("calls onSelectHistory when a history item is clicked", async () => {
      const onSelectHistory = vi.fn();
      render(
        <PromptSection
          {...defaultProps}
          promptHistory={["history prompt"]}
          onSelectHistory={onSelectHistory}
        />
      );

      const toggle = screen.getByTestId("history-toggle");
      await userEvent.click(toggle);

      const historyItem = screen.getByText("history prompt");
      await userEvent.click(historyItem);

      expect(onSelectHistory).toHaveBeenCalledWith("history prompt");
    });
  });

  describe("suggestions", () => {
    it("shows suggestions when provided", () => {
      render(<PromptSection {...defaultProps} suggestions={["cinematic", "dramatic"]} />);
      expect(screen.getByTestId("suggestions")).toBeInTheDocument();
      expect(screen.getByText("+ cinematic")).toBeInTheDocument();
      expect(screen.getByText("+ dramatic")).toBeInTheDocument();
    });

    it("hides suggestions when empty", () => {
      render(<PromptSection {...defaultProps} suggestions={[]} />);
      expect(screen.queryByTestId("suggestions")).not.toBeInTheDocument();
    });

    it("calls onAddSuggestion when a suggestion is clicked", async () => {
      const onAddSuggestion = vi.fn();
      render(
        <PromptSection
          {...defaultProps}
          suggestions={["cinematic"]}
          onAddSuggestion={onAddSuggestion}
        />
      );

      await userEvent.click(screen.getByText("+ cinematic"));
      expect(onAddSuggestion).toHaveBeenCalledWith("cinematic");
    });
  });

  describe("negative prompt", () => {
    it("expands negative prompt section when toggle is clicked", async () => {
      render(<PromptSection {...defaultProps} showNegativePrompt />);

      const toggle = screen.getByTestId("negative-prompt-toggle");
      await userEvent.click(toggle);

      expect(screen.getByTestId("negative-prompt-input")).toBeInTheDocument();
    });
  });

  describe("disabled states", () => {
    it("disables prompt input when isGenerating is true", () => {
      render(<PromptSection {...defaultProps} isGenerating />);
      expect(screen.getByTestId("prompt-input")).toBeDisabled();
    });

    it("disables prompt input when isEnhancingPrompt is true", () => {
      render(<PromptSection {...defaultProps} isEnhancingPrompt />);
      expect(screen.getByTestId("prompt-input")).toBeDisabled();
    });
  });

  describe("API ref", () => {
    it("exposes getPrompt and setPrompt via apiRef", async () => {
      const apiRef = React.createRef<PromptSectionAPI>();
      render(<PromptSection {...defaultProps} apiRef={apiRef} />);

      expect(apiRef.current).not.toBeNull();
      expect(typeof apiRef.current?.getPrompt).toBe("function");
      expect(typeof apiRef.current?.setPrompt).toBe("function");
    });

    it("exposes getMaxLength via apiRef", () => {
      const apiRef = React.createRef<PromptSectionAPI>();
      render(<PromptSection {...defaultProps} apiRef={apiRef} maxLength={1500} />);

      expect(apiRef.current?.getMaxLength()).toBe(1500);
    });
  });

  describe("library features", () => {
    it("shows library buttons when showLibrary is true", () => {
      render(<PromptSection {...defaultProps} showLibrary />);
      expect(screen.getByTestId("library-button")).toBeInTheDocument();
    });

    it("hides library buttons when showLibrary is false", () => {
      render(<PromptSection {...defaultProps} showLibrary={false} />);
      expect(screen.queryByTestId("library-button")).not.toBeInTheDocument();
    });
  });

  describe("content change callback", () => {
    it("calls onContentChange when prompt has content", async () => {
      const onContentChange = vi.fn();
      render(<PromptSection {...defaultProps} onContentChange={onContentChange} />);

      const input = screen.getByTestId("prompt-input");
      await userEvent.type(input, "Hello");

      // Advance timers for debounce
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(onContentChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("custom className", () => {
    it("applies custom className", () => {
      render(<PromptSection {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId("prompt-section")).toHaveClass("custom-class");
    });
  });
});
