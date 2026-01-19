import { describe, it, expect } from "vitest";
import { 
  PROMPT_ENHANCEMENT_SYSTEM, 
  NEGATIVE_PROMPT_ENHANCEMENT_SYSTEM,
  buildPromptEnhancementMessage,
  buildNegativePromptEnhancementMessage
} from "./enhancement-prompts";

describe("enhancement-prompts", () => {
  describe("Constants", () => {
    it("should have PROMPT_ENHANCEMENT_SYSTEM defined", () => {
      expect(PROMPT_ENHANCEMENT_SYSTEM).toBeDefined();
      expect(PROMPT_ENHANCEMENT_SYSTEM.length).toBeGreaterThan(0);
      expect(PROMPT_ENHANCEMENT_SYSTEM).toContain("prompt engineer");
    });

    it("should have NEGATIVE_PROMPT_ENHANCEMENT_SYSTEM defined", () => {
      expect(NEGATIVE_PROMPT_ENHANCEMENT_SYSTEM).toBeDefined();
      expect(NEGATIVE_PROMPT_ENHANCEMENT_SYSTEM.length).toBeGreaterThan(0);
      expect(NEGATIVE_PROMPT_ENHANCEMENT_SYSTEM).toContain("negative prompts");
    });
  });

  describe("buildPromptEnhancementMessage", () => {
    it("should format the message correctly with the given prompt", () => {
      const prompt = "A sunset over mountains";
      const result = buildPromptEnhancementMessage(prompt);
      expect(result).toBe(`Enhance this image generation prompt:\n\nA sunset over mountains`);
    });
  });

  describe("buildNegativePromptEnhancementMessage", () => {
    it("should format the message without existing negative prompt", () => {
      const mainPrompt = "A futuristic city";
      const result = buildNegativePromptEnhancementMessage(mainPrompt);
      expect(result).toContain("Main prompt: A futuristic city");
      expect(result).toContain("Generate an appropriate negative prompt");
      expect(result).not.toContain("Existing negative prompt to improve");
    });

    it("should format the message with an existing negative prompt", () => {
      const mainPrompt = "A realistic portrait";
      const existingNegative = "low quality, blurry";
      const result = buildNegativePromptEnhancementMessage(mainPrompt, existingNegative);
      expect(result).toContain("Main prompt: A realistic portrait");
      expect(result).toContain("Existing negative prompt to improve");
      expect(result).toContain("low quality, blurry");
    });

    it("should treat empty string existingNegativePrompt as missing", () => {
        const mainPrompt = "Test";
        const result = buildNegativePromptEnhancementMessage(mainPrompt, "  ");
        expect(result).toContain("Generate an appropriate negative prompt");
    });
  });
});
