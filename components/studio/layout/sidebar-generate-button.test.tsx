// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SidebarGenerateButton,
  type SidebarGenerateButtonProps,
} from "./sidebar-generate-button";

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-testid="generate-button">
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: ({ orientation }: { orientation?: string }) => (
    <div data-testid="separator" data-orientation={orientation} />
  ),
}));

vi.mock("@/components/studio/batch/batch-action-button", () => ({
  BatchActionButton: ({
    onPause,
    onResume,
    onCancel,
    isPaused,
    completedCount,
    totalCount,
    inFlightCount,
  }: {
    isPaused: boolean;
    completedCount: number;
    totalCount: number;
    inFlightCount?: number;
    onPause: () => void;
    onResume: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="batch-action-button">
      <button
        onClick={isPaused ? onResume : onPause}
        data-testid="batch-toggle"
      >
        {isPaused ? "Resume" : "Pause"} ({completedCount}/{totalCount})
        {isPaused && inFlightCount && inFlightCount > 0
          ? ` + ${inFlightCount} finishing`
          : ""}
      </button>
      <button onClick={onCancel} data-testid="batch-cancel">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("@/components/studio/batch/batch-config-button", () => ({
  BatchConfigButton: ({
    settings,
    onSettingsChange,
    disabled,
  }: {
    settings: { enabled: boolean; count: number };
    onSettingsChange: (s: { enabled: boolean; count: number }) => void;
    disabled?: boolean;
  }) => (
    <button
      data-testid="batch-config-button"
      disabled={disabled}
      onClick={() => onSettingsChange({ ...settings, enabled: !settings.enabled })}
    >
      Batch Config
    </button>
  ),
}));

describe("SidebarGenerateButton", () => {
  const createDefaultProps = (): SidebarGenerateButtonProps => ({
    isGenerating: false,
    hasPromptContent: true,
    onGenerateClick: vi.fn(),
    isBatchActive: false,
    isBatchPaused: false,
    batchProgress: {
      completedCount: 0,
      totalCount: 0,
      inFlightCount: 0,
    },
    batchSettings: { enabled: false, count: 10 },
    onBatchSettingsChange: vi.fn(),
    onPauseBatch: vi.fn(),
    onResumeBatch: vi.fn(),
    onCancelBatch: vi.fn(),
    isMobile: false,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when batch is not active", () => {
    it("renders generate button", () => {
      render(<SidebarGenerateButton {...createDefaultProps()} />);

      expect(screen.getByTestId("generate-button")).toBeInTheDocument();
    });

    it("renders batch config button", () => {
      render(<SidebarGenerateButton {...createDefaultProps()} />);

      expect(screen.getByTestId("batch-config-button")).toBeInTheDocument();
    });

    it("shows 'Generate Image' text by default", () => {
      render(<SidebarGenerateButton {...createDefaultProps()} />);

      expect(screen.getByTestId("generate-button")).toHaveTextContent(
        "Generate Image",
      );
    });

    it("shows 'Generating...' when isGenerating is true", () => {
      render(
        <SidebarGenerateButton {...createDefaultProps()} isGenerating={true} />,
      );

      expect(screen.getByTestId("generate-button")).toHaveTextContent(
        "Generating...",
      );
    });

    it("shows batch count when batch mode is enabled", () => {
      render(
        <SidebarGenerateButton
          {...createDefaultProps()}
          batchSettings={{ enabled: true, count: 5 }}
        />,
      );

      expect(screen.getByTestId("generate-button")).toHaveTextContent(
        "Generate Batch (5)",
      );
    });

    it("calls onGenerateClick when button is clicked", () => {
      const onGenerateClick = vi.fn();
      render(
        <SidebarGenerateButton
          {...createDefaultProps()}
          onGenerateClick={onGenerateClick}
        />,
      );

      fireEvent.click(screen.getByTestId("generate-button"));

      expect(onGenerateClick).toHaveBeenCalledTimes(1);
    });

    it("disables button when isGenerating is true", () => {
      render(
        <SidebarGenerateButton {...createDefaultProps()} isGenerating={true} />,
      );

      expect(screen.getByTestId("generate-button")).toBeDisabled();
    });

    it("disables button when hasPromptContent is false", () => {
      render(
        <SidebarGenerateButton
          {...createDefaultProps()}
          hasPromptContent={false}
        />,
      );

      expect(screen.getByTestId("generate-button")).toBeDisabled();
    });

    it("renders separator on mobile", () => {
      render(<SidebarGenerateButton {...createDefaultProps()} isMobile={true} />);

      expect(screen.getByTestId("separator")).toBeInTheDocument();
    });

    it("does not render separator on desktop", () => {
      render(<SidebarGenerateButton {...createDefaultProps()} isMobile={false} />);

      expect(screen.queryByTestId("separator")).not.toBeInTheDocument();
    });
  });

  describe("when batch is active", () => {
    it("renders batch action button", () => {
      render(
        <SidebarGenerateButton {...createDefaultProps()} isBatchActive={true} />,
      );

      expect(screen.getByTestId("batch-action-button")).toBeInTheDocument();
    });

    it("does not render generate button", () => {
      render(
        <SidebarGenerateButton {...createDefaultProps()} isBatchActive={true} />,
      );

      expect(screen.queryByTestId("generate-button")).not.toBeInTheDocument();
    });

    it("calls onPauseBatch when pause is clicked", () => {
      const onPauseBatch = vi.fn();
      render(
        <SidebarGenerateButton
          {...createDefaultProps()}
          isBatchActive={true}
          isBatchPaused={false}
          onPauseBatch={onPauseBatch}
        />,
      );

      fireEvent.click(screen.getByTestId("batch-toggle"));

      expect(onPauseBatch).toHaveBeenCalledTimes(1);
    });

    it("calls onResumeBatch when resume is clicked", () => {
      const onResumeBatch = vi.fn();
      render(
        <SidebarGenerateButton
          {...createDefaultProps()}
          isBatchActive={true}
          isBatchPaused={true}
          onResumeBatch={onResumeBatch}
        />,
      );

      fireEvent.click(screen.getByTestId("batch-toggle"));

      expect(onResumeBatch).toHaveBeenCalledTimes(1);
    });

    it("calls onCancelBatch when cancel is clicked", () => {
      const onCancelBatch = vi.fn();
      render(
        <SidebarGenerateButton
          {...createDefaultProps()}
          isBatchActive={true}
          onCancelBatch={onCancelBatch}
        />,
      );

      fireEvent.click(screen.getByTestId("batch-cancel"));

      expect(onCancelBatch).toHaveBeenCalledTimes(1);
    });

    it("shows correct progress", () => {
      render(
        <SidebarGenerateButton
          {...createDefaultProps()}
          isBatchActive={true}
          batchProgress={{
            completedCount: 3,
            totalCount: 10,
            inFlightCount: 2,
          }}
        />,
      );

      expect(screen.getByTestId("batch-toggle")).toHaveTextContent("3/10");
    });
  });
});
