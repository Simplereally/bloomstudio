// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarContent, type SidebarContentProps } from "./sidebar-content";

// Mock the feature components
vi.mock("@/components/studio/features/prompt", () => ({
  PromptFeature: ({
    isGenerating,
    showNegativePrompt,
    showLibrary,
  }: {
    isGenerating: boolean;
    showNegativePrompt: boolean;
    showLibrary: boolean;
  }) => (
    <div data-testid="prompt-feature">
      <span data-testid="prompt-is-generating">{String(isGenerating)}</span>
      <span data-testid="prompt-show-negative">{String(showNegativePrompt)}</span>
      <span data-testid="prompt-show-library">{String(showLibrary)}</span>
    </div>
  ),
  PromptManagerContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

vi.mock("@/components/studio/features/generation", () => ({
  ControlsFeature: ({ isGenerating }: { isGenerating: boolean }) => (
    <div data-testid="controls-feature">
      <span data-testid="controls-is-generating">{String(isGenerating)}</span>
    </div>
  ),
  GenerationSettingsContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
  BatchModeContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({
    children,
    onScroll,
  }: {
    children: React.ReactNode;
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
    viewportRef?: React.Ref<HTMLDivElement>;
  }) => (
    <div data-testid="scroll-area" onScroll={onScroll}>
      {children}
    </div>
  ),
}));

// Create mock hook return values
const createMockPromptManager = () => ({
  promptSectionRef: { current: null },
  promptHistory: [],
  addToPromptHistory: vi.fn(),
  suggestions: [],
  isLoadingSuggestions: false,
  fetchSuggestions: vi.fn(),
  isEnhancingPrompt: false,
  enhancePrompt: vi.fn(),
  cancelEnhancePrompt: vi.fn(),
  isEnhancingNegativePrompt: false,
  enhanceNegativePrompt: vi.fn(),
  cancelEnhanceNegativePrompt: vi.fn(),
  handlePromptContentChange: vi.fn(),
  handleSelectHistory: vi.fn(),
  hasPromptContent: true,
  setHasPromptContent: vi.fn(),
  getPromptValues: vi.fn(() => ({ prompt: "Test prompt", negativePrompt: "" })),
});

const createMockGenerationSettings = () => ({
  model: "flux" as const,
  setModel: vi.fn(),
  handleModelChange: vi.fn(),
  aspectRatios: [],
  constraints: undefined,
  resolutionTier: "hd" as const,
  setResolutionTier: vi.fn(),
  handleResolutionTierChange: vi.fn(),
  supportedTiers: ["hd"] as const,
  aspectRatio: "1:1" as const,
  setAspectRatio: vi.fn(),
  width: 1024,
  setWidth: vi.fn(),
  height: 1024,
  setHeight: vi.fn(),
  handleAspectRatioChange: vi.fn(),
  handleWidthChange: vi.fn(),
  handleHeightChange: vi.fn(),
  dimensionsLinked: false,
  setDimensionsLinked: vi.fn(),
  seed: -1,
  setSeed: vi.fn(),
  seedLocked: false,
  setSeedLocked: vi.fn(),
  generateSeed: vi.fn(() => 12345),
  isRandomMode: vi.fn(() => true),
  refreshSeedIfNeeded: vi.fn(),
  options: { enhance: false, private: false, safe: false },
  setOptions: vi.fn(),
  referenceImage: undefined,
  setReferenceImage: vi.fn(),
  videoSettings: { duration: 5, audio: false },
  setVideoSettings: vi.fn(),
  isVideoModel: false,
  videoReferenceImages: { firstFrame: undefined, lastFrame: undefined },
  setVideoReferenceImages: vi.fn(),
});

const createMockBatchMode = () => ({
  batchSettings: { enabled: false, count: 10 },
  setBatchSettings: vi.fn(),
  activeBatchId: null,
  setActiveBatchId: vi.fn(),
  isBatchActive: false,
  isBatchPaused: false,
  batchStatus: undefined,
  batchProgress: { currentIndex: 0, totalCount: 0, completedCount: 0, inFlightCount: 0 },
  startBatchGeneration: vi.fn(),
  cancelBatchGeneration: vi.fn(),
  pauseBatchGeneration: vi.fn(),
  resumeBatchGeneration: vi.fn(),
  handleBatchGenerateItem: vi.fn(),
});

describe("SidebarContent", () => {
  const createDefaultProps = (): SidebarContentProps => ({
    promptManager: createMockPromptManager(),
    generationSettings: createMockGenerationSettings(),
    batchMode: createMockBatchMode(),
    isGenerating: false,
    showNegativePrompt: true,
    showLibrary: true,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders prompt feature", () => {
    render(<SidebarContent {...createDefaultProps()} />);

    expect(screen.getByTestId("prompt-feature")).toBeInTheDocument();
  });

  it("renders controls feature", () => {
    render(<SidebarContent {...createDefaultProps()} />);

    expect(screen.getByTestId("controls-feature")).toBeInTheDocument();
  });

  it("passes isGenerating to prompt feature", () => {
    render(<SidebarContent {...createDefaultProps()} isGenerating={true} />);

    expect(screen.getByTestId("prompt-is-generating")).toHaveTextContent("true");
  });

  it("passes isGenerating to controls feature", () => {
    render(<SidebarContent {...createDefaultProps()} isGenerating={true} />);

    expect(screen.getByTestId("controls-is-generating")).toHaveTextContent("true");
  });

  it("passes showNegativePrompt to prompt feature", () => {
    render(<SidebarContent {...createDefaultProps()} showNegativePrompt={false} />);

    expect(screen.getByTestId("prompt-show-negative")).toHaveTextContent("false");
  });

  it("passes showLibrary to prompt feature", () => {
    render(<SidebarContent {...createDefaultProps()} showLibrary={false} />);

    expect(screen.getByTestId("prompt-show-library")).toHaveTextContent("false");
  });

  it("renders scroll area", () => {
    render(<SidebarContent {...createDefaultProps()} />);

    expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
  });

  it("renders fade overlay elements", () => {
    const { container } = render(<SidebarContent {...createDefaultProps()} />);

    // Check for fade overlay divs (top and bottom)
    const fadeOverlays = container.querySelectorAll(".pointer-events-none");
    expect(fadeOverlays.length).toBeGreaterThanOrEqual(2);
  });
});
