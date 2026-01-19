import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Convex server functions
vi.mock("./_generated/server", () => ({
  internalAction: (config: any) => config,
}));

vi.mock("./_generated/api", () => ({
  internal: {
    generatedImages: {
      updateImagePromptInference: "updateImagePromptInference",
    },
    contentAnalysis: {
      analyzeImage: "analyzeImage",
    },
  },
}));

// Mock the lib functions
vi.mock("./lib/promptInference", () => ({
  analyzePromptWithCerebras: vi.fn(),
  decideSensitivity: vi.fn(),
}));

import { analyzePromptImage } from "./promptInference";
import { analyzePromptWithCerebras, decideSensitivity } from "./lib/promptInference";

describe("promptInference internal action", () => {
  let mockCtx: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      runMutation: vi.fn(),
      scheduler: {
        runAfter: vi.fn(),
      },
    };
  });

  it("should escalate to vision if decideSensitivity returns escalate_to_vision", async () => {
    const inferenceResult = {
      category: "test_category",
      confidence: 0.5,
      reasoning: "ambiguous",
    };
    (analyzePromptWithCerebras as any).mockResolvedValue(inferenceResult);
    (decideSensitivity as any).mockReturnValue({ action: "escalate_to_vision" });

    await analyzePromptImage.handler(mockCtx, { imageId: "img123" as any, prompt: "test prompt" });

    expect(mockCtx.runMutation).toHaveBeenCalledWith("updateImagePromptInference", expect.objectContaining({
      imageId: "img123",
      promptInference: expect.objectContaining({
        category: "test_category",
        confidence: 0.5,
      }),
      confidence: 0.5,
    }));

    expect(mockCtx.scheduler.runAfter).toHaveBeenCalledWith(0, "analyzeImage", {
      imageId: "img123",
    });
  });

  it("should tag as sensitive if decideSensitivity returns tag_sensitive", async () => {
    const inferenceResult = {
      category: "nsfw",
      confidence: 0.9,
      reasoning: "clearly sensitive",
    };
    (analyzePromptWithCerebras as any).mockResolvedValue(inferenceResult);
    (decideSensitivity as any).mockReturnValue({ action: "tag_sensitive" });

    await analyzePromptImage.handler(mockCtx, { imageId: "img123" as any, prompt: "test prompt" });

    expect(mockCtx.runMutation).toHaveBeenCalledWith("updateImagePromptInference", expect.objectContaining({
      imageId: "img123",
      isSensitive: true,
      confidence: 0.9,
    }));

    expect(mockCtx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  it("should tag as safe if decideSensitivity returns tag_safe", async () => {
    const inferenceResult = {
      category: "safe",
      confidence: 0.95,
      reasoning: "clearly safe",
    };
    (analyzePromptWithCerebras as any).mockResolvedValue(inferenceResult);
    (decideSensitivity as any).mockReturnValue({ action: "tag_safe" });

    await analyzePromptImage.handler(mockCtx, { imageId: "img123" as any, prompt: "test prompt" });

    expect(mockCtx.runMutation).toHaveBeenCalledWith("updateImagePromptInference", expect.objectContaining({
      imageId: "img123",
      isSensitive: false,
      confidence: 0,
    }));

    expect(mockCtx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  it("should fallback to vision analysis if an error occurs", async () => {
    (analyzePromptWithCerebras as any).mockRejectedValue(new Error("API Error"));

    await analyzePromptImage.handler(mockCtx, { imageId: "img123" as any, prompt: "test prompt" });

    expect(mockCtx.scheduler.runAfter).toHaveBeenCalledWith(0, "analyzeImage", {
      imageId: "img123",
    });
  });
});
