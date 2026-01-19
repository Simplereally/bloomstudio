import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateText, hasAnyAIProvider, getPrimaryProvider, AIProviderError } from "./ai-provider";
import * as CerebrasModule from "@/lib/cerebras";
import * as OpenRouterModule from "@/lib/openrouter";

// Mock dependencies
vi.mock("@/lib/cerebras", () => ({
  generateWithCerebras: vi.fn(),
  hasCerebrasApiKey: vi.fn(),
  CerebrasError: class extends Error {
      code: string;
      status?: number;
      constructor(message: string, code: string, status?: number) {
          super(message);
          this.name = "CerebrasError";
          this.code = code;
          this.status = status;
      }
  },
  CEREBRAS_MODELS: { TEXT_PRIMARY: "cerebras-model" }
}));

vi.mock("@/lib/openrouter", () => ({
  generate: vi.fn(),
  hasOpenRouterApiKey: vi.fn(),
  OpenRouterError: class extends Error {
      code: string;
      status?: number;
      constructor(message: string, code?: string, status?: number) {
          super(message);
          this.name = "OpenRouterError";
          this.code = code || "UNKNOWN";
          this.status = status;
      }
  },
  OPENROUTER_MODELS: { 
      SUGGESTIONS: "or-suggestions", 
      PROMPT_ENHANCEMENT: "or-enhancement" 
  }
}));

describe("AI Provider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: both available
        vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(true);
        vi.mocked(OpenRouterModule.hasOpenRouterApiKey).mockReturnValue(true);
    });

    describe("generateText", () => {
        it("should prefer Cerebras if available", async () => {
            vi.mocked(CerebrasModule.generateWithCerebras).mockResolvedValue("Cerebras result");

            const result = await generateText({ prompt: "test" });

            expect(result).toEqual({ text: "Cerebras result", provider: "cerebras" });
            expect(CerebrasModule.generateWithCerebras).toHaveBeenCalledWith(expect.objectContaining({
                model: "cerebras-model",
                prompt: "test"
            }));
            expect(OpenRouterModule.generate).not.toHaveBeenCalled();
        });

        it("should fallback to OpenRouter if Cerebras fails", async () => {
            vi.mocked(CerebrasModule.generateWithCerebras).mockRejectedValue(new Error("Cerebras down"));
            vi.mocked(OpenRouterModule.generate).mockResolvedValue("OpenRouter result");

            const result = await generateText({ prompt: "test" });

            expect(result).toEqual({ text: "OpenRouter result", provider: "openrouter" });
            expect(CerebrasModule.generateWithCerebras).toHaveBeenCalled();
            expect(OpenRouterModule.generate).toHaveBeenCalledWith(expect.objectContaining({
                prompt: "test"
            }));
        });

        it("should skip Cerebras if skipCerebras is true", async () => {
            vi.mocked(OpenRouterModule.generate).mockResolvedValue("OpenRouter result");

            const result = await generateText({ prompt: "test", skipCerebras: true });

            expect(result).toEqual({ text: "OpenRouter result", provider: "openrouter" });
            expect(CerebrasModule.generateWithCerebras).not.toHaveBeenCalled();
            expect(OpenRouterModule.generate).toHaveBeenCalled();
        });

        it("should skip Cerebras if API key is missing", async () => {
            vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(false);
            vi.mocked(OpenRouterModule.generate).mockResolvedValue("OpenRouter result");

            const result = await generateText({ prompt: "test" });

            expect(result).toEqual({ text: "OpenRouter result", provider: "openrouter" });
            expect(CerebrasModule.generateWithCerebras).not.toHaveBeenCalled();
        });

        it("should throw AIProviderError if all providers fail", async () => {
            vi.mocked(CerebrasModule.generateWithCerebras).mockRejectedValue(new Error("Cerebras fail"));
            vi.mocked(OpenRouterModule.generate).mockRejectedValue(new Error("OpenRouter fail"));

            await expect(generateText({ prompt: "test" })).rejects.toThrow(AIProviderError);
            await expect(generateText({ prompt: "test" })).rejects.toThrow("All AI providers failed");
        });

        it("should throw AIProviderError if no providers configured", async () => {
            vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(false);
            vi.mocked(OpenRouterModule.hasOpenRouterApiKey).mockReturnValue(false);

            await expect(generateText({ prompt: "test" })).rejects.toThrow(AIProviderError);
            await expect(generateText({ prompt: "test" })).rejects.toThrow("No AI providers configured");
        });

        it("should propagate AbortError immediately from Cerebras without fallback", async () => {
            const abortError = new Error("Aborted");
            abortError.name = "AbortError";
            vi.mocked(CerebrasModule.generateWithCerebras).mockRejectedValue(abortError);

            await expect(generateText({ prompt: "test" })).rejects.toThrow("Aborted");
            expect(OpenRouterModule.generate).not.toHaveBeenCalled();
        });

        it("should use correct OpenRouter model for 'suggestions' useCase", async () => {
             vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(false);
             vi.mocked(OpenRouterModule.generate).mockResolvedValue("OR response");

             await generateText({ prompt: "test", useCase: "suggestions" });

             expect(OpenRouterModule.generate).toHaveBeenCalledWith(expect.objectContaining({
                 model: "or-suggestions",
                 disableReasoning: true
             }));
        });

        it("should use correct OpenRouter model for 'enhancement' useCase", async () => {
            vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(false);
            vi.mocked(OpenRouterModule.generate).mockResolvedValue("OR response");

            await generateText({ prompt: "test", useCase: "enhancement" });

            expect(OpenRouterModule.generate).toHaveBeenCalledWith(expect.objectContaining({
                model: "or-enhancement",
                disableReasoning: false
            }));
       });
    });

    describe("Utility Functions", () => {
        it("hasAnyAIProvider returns true if at least one available", () => {
            vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(true);
            vi.mocked(OpenRouterModule.hasOpenRouterApiKey).mockReturnValue(false);
            expect(hasAnyAIProvider()).toBe(true);
        });

        it("hasAnyAIProvider returns false if none available", () => {
            vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(false);
            vi.mocked(OpenRouterModule.hasOpenRouterApiKey).mockReturnValue(false);
            expect(hasAnyAIProvider()).toBe(false);
        });

        it("getPrimaryProvider returns cerebras first", () => {
            vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(true);
            expect(getPrimaryProvider()).toBe("cerebras");
        });

        it("getPrimaryProvider returns openrouter if cerebras missing", () => {
            vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(false);
            vi.mocked(OpenRouterModule.hasOpenRouterApiKey).mockReturnValue(true);
            expect(getPrimaryProvider()).toBe("openrouter");
        });

        it("getPrimaryProvider returns null if none", () => {
            vi.mocked(CerebrasModule.hasCerebrasApiKey).mockReturnValue(false);
            vi.mocked(OpenRouterModule.hasOpenRouterApiKey).mockReturnValue(false);
            expect(getPrimaryProvider()).toBeNull();
        });
    });

    describe("AIProviderError", () => {
        it("should create from generic Error", () => {
            const err = new Error("msg");
            const aiErr = AIProviderError.fromError(err);
            expect(aiErr).toBeInstanceOf(AIProviderError);
            expect(aiErr.message).toBe("msg");
            expect(aiErr.code).toBe("UNKNOWN_ERROR");
        });
    });
});
