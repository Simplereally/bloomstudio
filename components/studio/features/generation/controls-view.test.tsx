// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ControlsView, type ControlsViewProps } from "./controls-view";

// Mock studio components
vi.mock("@/components/studio", () => ({
  AspectRatioSelector: ({ selectedRatio }: { selectedRatio: string }) => <div data-testid="aspect-ratio-selector">{selectedRatio}</div>,
  CollapsibleSection: ({
    children,
    title,
    testId,
    rightContent,
    collapsedContent,
    defaultExpanded,
    disabled,
    open,
  }: {
    children: React.ReactNode;
    title: string;
    testId: string;
    rightContent?: React.ReactNode;
    collapsedContent?: React.ReactNode;
    defaultExpanded?: boolean;
    disabled?: boolean;
    open?: boolean;
  }) => (
    <div
      data-testid={testId}
      data-default-expanded={String(defaultExpanded ?? true)}
      data-disabled={String(disabled ?? false)}
      data-open={open !== undefined ? String(open) : undefined}
    >
      <div>{title}</div>
      {collapsedContent && <div data-testid={`${testId}-collapsed-content`}>{collapsedContent}</div>}
      {rightContent}
      {children}
    </div>
  ),
  DimensionControls: ({ width, height }: { width: number; height: number }) => (
    <div data-testid="dimension-controls">
      {width}x{height}
    </div>
  ),
  DimensionHeaderControls: ({ megapixels, isOverLimit }: { megapixels: string; isOverLimit: boolean }) => (
    <div data-testid="dimension-header">
      <span data-testid="megapixels">{megapixels}</span>
      <span data-testid="is-over-limit">{String(isOverLimit)}</span>
    </div>
  ),
  ModelSelector: ({ selectedModel, onModelChange }: { selectedModel: string; onModelChange: (model: string) => void }) => (
    <div data-testid="model-selector">
      <span>{selectedModel}</span>
      <button data-testid="change-model-btn" onClick={() => onModelChange("new-model")}>
        Change
      </button>
    </div>
  ),
  ReferenceImagePicker: ({ selectedImage }: { selectedImage?: string }) => (
    <div data-testid="reference-image-picker">{selectedImage || "none"}</div>
  ),
  SeedControl: ({ seed, isLocked }: { seed: number; isLocked: boolean }) => (
    <div data-testid="seed-control">
      <span data-testid="seed-value">{seed}</span>
      <span data-testid="seed-locked">{String(isLocked)}</span>
    </div>
  ),
  OptionsPanel: ({ options }: { options: { enhance: boolean; private: boolean; safe: boolean } }) => (
    <div data-testid="options-panel">
      <span data-testid="enhance">{String(options.enhance)}</span>
      <span data-testid="private">{String(options.private)}</span>
      <span data-testid="safe">{String(options.safe)}</span>
    </div>
  ),
  BatchModePanel: ({ settings }: { settings: { enabled: boolean; count: number } }) => (
    <div data-testid="batch-mode-panel">
      <span data-testid="batch-enabled">{String(settings.enabled)}</span>
      <span data-testid="batch-count">{settings.count}</span>
    </div>
  ),
  VideoReferenceImagePicker: ({ selectedImages }: { selectedImages?: { firstFrame?: string; lastFrame?: string } }) => (
    <div data-testid="video-reference-image-picker">
      Frames: {(selectedImages?.firstFrame ? 1 : 0) + (selectedImages?.lastFrame ? 1 : 0)}
    </div>
  ),
  VideoSettingsPanel: () => <div data-testid="video-settings-panel">Video Settings</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}));

describe("ControlsView", () => {
  const defaultProps: ControlsViewProps = {
    // Model
    model: "flux",
    onModelChange: vi.fn(),
    models: [
      {
        id: "flux",
        displayName: "Flux.1 [dev]",
        type: "image",
        icon: "sparkles",
        logo: "/models/flux.svg",
        description: "Pro quality",
        constraints: {} as any,
        aspectRatios: [],
        supportsNegativePrompt: true,
      },
    ],
    isLoadingModels: false,
    isGenerating: false,

    // Aspect ratio
    aspectRatio: "1:1",
    onAspectRatioChange: vi.fn(),
    aspectRatios: [],

    // Dimensions
    width: 1024,
    height: 1024,
    onWidthChange: vi.fn(),
    onHeightChange: vi.fn(),
    dimensionsEnabled: true,
    dimensionsLinked: false,
    onDimensionsLinkedChange: vi.fn(),
    megapixels: "1.05",
    isOverLimit: false,
    percentOfLimit: 50,
    hasPixelLimit: true,

    // Reference image
    referenceImage: undefined,
    onReferenceImageChange: vi.fn(),

    // Seed
    seed: -1,
    onSeedChange: vi.fn(),
    seedLocked: false,
    onSeedLockedChange: vi.fn(),

    // Options
    options: { enhance: false, private: false, safe: false },
    onOptionsChange: vi.fn(),

    // Batch mode
    batchSettings: { enabled: false, count: 10 },
    onBatchSettingsChange: vi.fn(),
    isBatchActive: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all control sections", () => {
    render(<ControlsView {...defaultProps} aspectRatio="custom" />);

    expect(screen.getByTestId("model-section")).toBeInTheDocument();
    expect(screen.getByTestId("aspect-ratio-section")).toBeInTheDocument();
    expect(screen.getByTestId("dimensions-section")).toBeInTheDocument();
    expect(screen.getByTestId("reference-image-section")).toBeInTheDocument();
    expect(screen.getByTestId("seed-section")).toBeInTheDocument();
    expect(screen.getByTestId("options-panel")).toBeInTheDocument();
    expect(screen.getByTestId("batch-mode-panel")).toBeInTheDocument();
  });

  it("does not render dimensions section when not in custom mode", () => {
    render(<ControlsView {...defaultProps} aspectRatio="1:1" />);

    expect(screen.queryByTestId("dimensions-section")).not.toBeInTheDocument();
  });

  it("renders model selector with correct model", () => {
    render(<ControlsView {...defaultProps} model="turbo" />);

    expect(screen.getByTestId("model-selector")).toHaveTextContent("turbo");
  });

  it("renders aspect ratio selector with correct ratio", () => {
    render(<ControlsView {...defaultProps} aspectRatio="16:9" />);

    expect(screen.getByTestId("aspect-ratio-selector")).toHaveTextContent("16:9");
  });

  it("renders dimension controls with correct dimensions", () => {
    render(<ControlsView {...defaultProps} aspectRatio="custom" width={1536} height={864} />);

    expect(screen.getByTestId("dimension-controls")).toHaveTextContent("1536x864");
  });

  it("renders seed control with correct values", () => {
    render(<ControlsView {...defaultProps} seed={12345} seedLocked={true} />);

    expect(screen.getByTestId("seed-value")).toHaveTextContent("12345");
    expect(screen.getByTestId("seed-locked")).toHaveTextContent("true");
  });

  it("renders options panel with correct options", () => {
    render(<ControlsView {...defaultProps} options={{ enhance: true, private: true, safe: false }} />);

    expect(screen.getByTestId("enhance")).toHaveTextContent("true");
    expect(screen.getByTestId("private")).toHaveTextContent("true");
    expect(screen.getByTestId("safe")).toHaveTextContent("false");
  });

  it("renders batch mode panel with correct settings", () => {
    render(<ControlsView {...defaultProps} batchSettings={{ enabled: true, count: 5 }} />);

    expect(screen.getByTestId("batch-enabled")).toHaveTextContent("true");
    expect(screen.getByTestId("batch-count")).toHaveTextContent("5");
  });

  it("renders dimension header controls with pixel info when in custom mode", () => {
    render(<ControlsView {...defaultProps} aspectRatio="custom" megapixels="2.1" isOverLimit={true} />);

    expect(screen.getByTestId("dimension-header")).toBeInTheDocument();
    expect(screen.getByTestId("megapixels")).toHaveTextContent("2.1");
    expect(screen.getByTestId("is-over-limit")).toHaveTextContent("true");
  });

  it("renders reference image picker", () => {
    render(<ControlsView {...defaultProps} referenceImage="https://example.com/ref.jpg" />);

    expect(screen.getByTestId("reference-image-picker")).toHaveTextContent("https://example.com/ref.jpg");
  });

  it("renders dimensions collapsed content with dimension and megapixel badges when in custom mode", () => {
    render(
      <ControlsView
        {...defaultProps}
        aspectRatio="custom"
        width={1536}
        height={864}
        megapixels="1.33"
        percentOfLimit={75}
        hasPixelLimit={true}
      />
    );

    const collapsedContent = screen.getByTestId("dimensions-section-collapsed-content");
    expect(collapsedContent).toBeInTheDocument();
    // Should contain dimensions
    expect(collapsedContent).toHaveTextContent("1536×864");
    // Should contain megapixels and percentage (1 decimal place)
    expect(collapsedContent).toHaveTextContent("1.33");
    expect(collapsedContent).toHaveTextContent("75.0%");
  });

  it("renders aspect ratio collapsed content with ratio and dimensions", () => {
    render(<ControlsView {...defaultProps} aspectRatio="16:9" width={1360} height={768} />);
    const collapsedContent = screen.getByTestId("aspect-ratio-section-collapsed-content");
    expect(collapsedContent).toHaveTextContent("16:9 • 1360×768");
  });

  it("does not render megapixels badge when hasPixelLimit is false in custom mode", () => {
    render(
      <ControlsView
        {...defaultProps}
        aspectRatio="custom"
        width={1024}
        height={1024}
        megapixels="1.05"
        percentOfLimit={50}
        hasPixelLimit={false}
      />
    );

    const collapsedContent = screen.getByTestId("dimensions-section-collapsed-content");
    expect(collapsedContent).toBeInTheDocument();
    // Should contain dimensions
    expect(collapsedContent).toHaveTextContent("1024×1024");
    // Should NOT contain percentage (no pixel limit)
    expect(collapsedContent).not.toHaveTextContent("50%");
  });

  it("dimensions section is expanded by default when in custom mode", () => {
    render(<ControlsView {...defaultProps} aspectRatio="custom" width={1024} height={1024} />);

    const dimensionsSection = screen.getByTestId("dimensions-section");
    // Should be expanded (defaultExpanded=true)
    expect(dimensionsSection).toHaveAttribute("data-default-expanded", "true");
    // Should be enabled
    expect(dimensionsSection).toHaveAttribute("data-disabled", "false");
  });

  it("collapses model section when a model is selected", async () => {
    render(<ControlsView {...defaultProps} />);

    const modelSection = screen.getByTestId("model-section");
    // Initially expanded
    expect(modelSection).toHaveAttribute("data-open", "true");

    // Select a model
    const changeBtn = screen.getByTestId("change-model-btn");
    fireEvent.click(changeBtn);

    // Should call onModelChange
    expect(defaultProps.onModelChange).toHaveBeenCalledWith("new-model");

    // Section should now be collapsed
    expect(modelSection).toHaveAttribute("data-open", "false");
  });

  it("renders video frames section when isVideoModel is true, even without videoSettings", () => {
    const videoProps = {
      ...defaultProps,
      isVideoModel: true,
      videoReferenceImages: { firstFrame: undefined, lastFrame: undefined },
      onVideoReferenceImagesChange: vi.fn(),
      // videoSettings explicitly undefined to test independence
      videoSettings: undefined,
      onVideoSettingsChange: undefined,
    };
    render(<ControlsView {...videoProps} />);

    expect(screen.getByTestId("video-frames-section")).toBeInTheDocument();
    expect(screen.getByTestId("video-reference-image-picker")).toBeInTheDocument();
    // Video settings section should NOT assume to be present if videoSettings is missing (but logic requires it as per current implementation)
    expect(screen.queryByTestId("video-settings-section")).not.toBeInTheDocument();
  });
});
