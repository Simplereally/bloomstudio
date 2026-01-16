import { describe, it, expect } from "vitest";
import { decideSensitivity, parseResult } from "./promptInference";

describe("promptInference", () => {
  describe("parseResult", () => {
    it("should parse valid JSON", () => {
      const raw = `{ "isSensitive": true, "category": "explicit", "confidence": 0.95, "reasoning": "bad" }`;
      const result = parseResult(raw);
      expect(result).toEqual({
        isSensitive: true,
        category: "explicit",
        confidence: 0.95,
        reasoning: "bad",
      });
    });

    it("should handle markdown fences", () => {
      const raw = "```json\n{ \"isSensitive\": false, \"category\": \"safe\", \"confidence\": 0.1, \"reasoning\": \"ok\" }\n```";
      const result = parseResult(raw);
      expect(result.category).toBe("safe");
    });

    it("should throw on invalid fields", () => {
      const raw = `{ "isSensitive": "yes", "category": "explicit", "confidence": 0.95, "reasoning": "bad" }`; // boolean check
      expect(() => parseResult(raw)).toThrow();
    });

    it("should throw on invalid category", () => {
      const raw = `{ "isSensitive": true, "category": "weird", "confidence": 0.9, "reasoning": "bad" }`;
      expect(() => parseResult(raw)).toThrow();
    });
  });

  describe("decideSensitivity", () => {
    // Table Tests
    // explicit | >= 0.70 | Mark isSensitive=true, skip vision
    it("should tag explicit >= 0.7 as sensitive", () => {
       const res = decideSensitivity({ category: "explicit", confidence: 0.7, isSensitive: true, reasoning: "" });
       expect(res.action).toBe("tag_sensitive");
    });

    it("should escalate explicit < 0.7", () => {
       const res = decideSensitivity({ category: "explicit", confidence: 0.69, isSensitive: true, reasoning: "" });
       expect(res.action).toBe("escalate_to_vision");
    });

    // suggestive | >= 0.85 | Mark isSensitive=true, skip vision
    it("should tag suggestive >= 0.85 as sensitive", () => {
       const res = decideSensitivity({ category: "suggestive", confidence: 0.85, isSensitive: true, reasoning: "" });
       expect(res.action).toBe("tag_sensitive");
    });

    it("should escalate suggestive < 0.85", () => {
       const res = decideSensitivity({ category: "suggestive", confidence: 0.84, isSensitive: true, reasoning: "" });
       expect(res.action).toBe("escalate_to_vision");
    });

    // safe | >= 0.85 | Mark isSensitive=false, skip vision
    it("should tag safe >= 0.85 as safe", () => {
       const res = decideSensitivity({ category: "safe", confidence: 0.85, isSensitive: false, reasoning: "" });
       expect(res.action).toBe("tag_safe");
    });

    it("should escalate safe < 0.85", () => {
       const res = decideSensitivity({ category: "safe", confidence: 0.84, isSensitive: false, reasoning: "" });
       expect(res.action).toBe("escalate_to_vision");
    });
  });
});
