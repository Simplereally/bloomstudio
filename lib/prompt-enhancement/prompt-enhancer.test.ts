import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  enhancePrompt, 
  enhanceNegativePrompt, 
  PromptEnhancementError 
} from "./prompt-enhancer";
import { generateText } from "@/lib/ai-provider";

// Mock the AI provider
vi.mock("@/lib/ai-provider", () => ({
  generateText: vi.fn(),
}));

describe("prompt-enhancer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("enhancePrompt", () => {
    it("should enhance a valid prompt", async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: "Enhanced prompt text",
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      const result = await enhancePrompt("original prompt");

      expect(result.enhancedText).toBe("Enhanced prompt text");
      expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.any(String),
        system: expect.any(String),
        temperature: 0.7,
        maxTokens: 512,
      }));
    });

    it("should strip wrapping double quotes from the response", async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: '"Enhanced prompt with quotes"',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      const result = await enhancePrompt("original prompt");

      expect(result.enhancedText).toBe("Enhanced prompt with quotes");
    });

    it("should strip wrapping single quotes from the response", async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: "'Enhanced prompt with single quotes'",
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      const result = await enhancePrompt("original prompt");

      expect(result.enhancedText).toBe("Enhanced prompt with single quotes");
    });

    it("should throw PromptEnhancementError if prompt is empty", async () => {
      await expect(enhancePrompt("  ")).rejects.toThrow(PromptEnhancementError);
      await expect(enhancePrompt("  ")).rejects.toThrow("Prompt cannot be empty");
    });

    it("should handle AbortError and throw CANCELLED code", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      vi.mocked(generateText).mockRejectedValueOnce(abortError);

      await expect(enhancePrompt("prompt")).rejects.toStrictEqual(
        new PromptEnhancementError("Enhancement was cancelled", "CANCELLED")
      );
    });

    it("should handle generic errors from generateText", async () => {
      vi.mocked(generateText).mockRejectedValue(new Error("API Error"));

      await expect(enhancePrompt("prompt")).rejects.toThrow(PromptEnhancementError);
      await expect(enhancePrompt("prompt")).rejects.toThrow("API Error");
    });
  });

  describe("enhanceNegativePrompt", () => {
    it("should enhance negative prompt given a main prompt", async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: "Enhanced negative prompt",
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      const result = await enhanceNegativePrompt("main prompt", "existing negative");

      expect(result.enhancedText).toBe("Enhanced negative prompt");
      expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
        system: expect.any(String),
        maxTokens: 256,
      }));
    });

    it("should throw PromptEnhancementError if main prompt is empty", async () => {
      await expect(enhanceNegativePrompt("")).rejects.toThrow(PromptEnhancementError);
      await expect(enhanceNegativePrompt("")).rejects.toThrow(
        "Main prompt is required for negative prompt generation"
      );
    });

    it("should handle AbortError and throw CANCELLED code", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      vi.mocked(generateText).mockRejectedValueOnce(abortError);

      await expect(enhanceNegativePrompt("main")).rejects.toStrictEqual(
        new PromptEnhancementError("Enhancement was cancelled", "CANCELLED")
      );
    });
  });

  describe("PromptEnhancementError", () => {
    it("should create from generic Error", () => {
      const error = new Error("Test error");
      const peError = PromptEnhancementError.fromError(error);
      expect(peError).toBeInstanceOf(PromptEnhancementError);
      expect(peError.message).toBe("Test error");
      expect(peError.code).toBe("ENHANCEMENT_FAILED");
    });

    it("should return the same error if it is already PromptEnhancementError", () => {
      const original = new PromptEnhancementError("msg", "CODE");
      const error = PromptEnhancementError.fromError(original);
      expect(error).toBe(original);
    });

    it("should handle unknown error types", () => {
      const error = PromptEnhancementError.fromError("not an error object");
      expect(error.code).toBe("UNKNOWN_ERROR");
    });
  });
});
