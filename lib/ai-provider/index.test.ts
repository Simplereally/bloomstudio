import { describe, it, expect } from "vitest";
import * as AIProvider from "./index";

describe("lib/ai-provider/index", () => {
    it("should export core functions", () => {
        expect(AIProvider.generateText).toBeDefined();
        expect(AIProvider.hasAnyAIProvider).toBeDefined();
        expect(AIProvider.getPrimaryProvider).toBeDefined();
    });

    it("should export error class", () => {
        expect(AIProvider.AIProviderError).toBeDefined();
    });
});
