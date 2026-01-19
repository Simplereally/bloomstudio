import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSuggestions } from "./suggestion-generator";
import { generateText } from "@/lib/ai-provider";

// Mock the AI provider
vi.mock("@/lib/ai-provider", () => ({
  generateText: vi.fn(),
}));

describe("suggestion-generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateSuggestions", () => {
    it("should return empty array for empty or short prompts", async () => {
      expect(await generateSuggestions("")).toEqual({ suggestions: [] });
      expect(await generateSuggestions("  ")).toEqual({ suggestions: [] });
      expect(await generateSuggestions("ab")).toEqual({ suggestions: [] });
      expect(generateText).not.toHaveBeenCalled();
    });

    it("should parse and return suggestions from AI response", async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: "dramatic lighting, movie poster, high quality",
        usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
      });

      const result = await generateSuggestions("cyberpunk city");

      expect(result.suggestions).toEqual([
        "dramatic lighting",
        "movie poster",
        "high quality"
      ]);
      expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
        useCase: "suggestions",
        prompt: expect.stringContaining("cyberpunk city"),
        temperature: 1,
      }));
    });

    it("should handle mixed whitespace and empty parts in AI response", async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: "  glowy eyes ,  , neon colors,  techwear  ",
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      });

      const result = await generateSuggestions("robot");

      expect(result.suggestions).toEqual([
        "glowy eyes",
        "neon colors",
        "techwear"
      ]);
    });

    it("should limit to max 3 suggestions", async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: "s1, s2, s3, s4, s5",
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      });

      const result = await generateSuggestions("robot");

      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions).toEqual(["s1", "s2", "s3"]);
    });

    it("should filter out suggestions that are too long", async () => {
      const longSuggestion = "a".repeat(51);
      vi.mocked(generateText).mockResolvedValueOnce({
        text: `good, ${longSuggestion}, better`,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      });

      const result = await generateSuggestions("robot");

      expect(result.suggestions).toEqual(["good", "better"]);
    });

    it("should rethrow AbortError", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      vi.mocked(generateText).mockRejectedValueOnce(abortError);

      await expect(generateSuggestions("cyberpunk")).rejects.toThrow("Aborted");
    });

    it("should rethrow ResponseAborted errors", async () => {
      const abortError = new Error("ResponseAborted");
      vi.mocked(generateText).mockRejectedValueOnce(abortError);

      await expect(generateSuggestions("cyberpunk")).rejects.toThrow("ResponseAborted");
    });

    it("should return empty array and log error for generic failures", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(generateText).mockRejectedValueOnce(new Error("API Down"));

      const result = await generateSuggestions("cyberpunk");

      expect(result).toEqual({ suggestions: [] });
      expect(consoleSpy).toHaveBeenCalledWith("Suggestion generation error:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
