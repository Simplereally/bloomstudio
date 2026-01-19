import { describe, it, expect } from "vitest";
import {
  getModelPricing,
  estimateImageCost,
  estimateVideoCost,
  getModelsByEfficiency,
  modelSupportsReferenceImage,
  isModelAlpha,
  IMAGE_MODEL_PRICING,
  VIDEO_MODEL_PRICING,
} from "./pollinations-pricing.schema";

describe("pollinations-pricing.schema", () => {
  describe("getModelPricing", () => {
    it("should return pricing for a valid image model", () => {
      const pricing = getModelPricing("flux");
      expect(pricing).toBeDefined();
      expect(pricing?.type).toBe("image");
      expect(pricing?.modelId).toBe("flux");
    });

    it("should return pricing for a valid video model", () => {
      const pricing = getModelPricing("veo");
      expect(pricing).toBeDefined();
      expect(pricing?.type).toBe("video");
      expect(pricing?.modelId).toBe("veo");
    });

    it("should return undefined for invalid model", () => {
      const pricing = getModelPricing("invalid-model-name");
      expect(pricing).toBeUndefined();
    });

    it("should be case insensitive", () => {
      const pricing = getModelPricing("FLUX");
      expect(pricing).toBeDefined();
      expect(pricing?.modelId).toBe("flux");
    });
  });

  describe("estimateImageCost", () => {
    it("should calculate cost for per-image pricing model", () => {
      // Flux is 0.0002 per image
      const cost = estimateImageCost("flux", 10);
      expect(cost).toBe(0.0002 * 10);
    });

    it("should calculate cost for token-based model (rough estimate)", () => {
      // nanobanana: output per million is 30.0
      // 1 image = 30.0 / 1_000_000 * 1
      const cost = estimateImageCost("nanobanana", 1);
      expect(cost).toBe(30.0 / 1_000_000);
    });

    it("should return undefined for video models", () => {
      const cost = estimateImageCost("veo");
      expect(cost).toBeUndefined();
    });

    it("should return undefined for unknown models", () => {
      const cost = estimateImageCost("unknown");
      expect(cost).toBeUndefined();
    });
  });

  describe("estimateVideoCost", () => {
    it("should calculate cost for per-second pricing model", () => {
      // veo is 0.15 per second
      const cost = estimateVideoCost("veo", 5);
      expect(cost).toBe(0.15 * 5);
    });

    it("should calculate cost for token-based video model", () => {
      // seedance-pro: approx 10 per pollen -> 1/10 per video roughly
      const cost = estimateVideoCost("seedance-pro", 5);
      expect(cost).toBe(1 / 10);
    });

    it("should return undefined for image models", () => {
      const cost = estimateVideoCost("flux", 5);
      expect(cost).toBeUndefined();
    });

    it("should return undefined for unknown models", () => {
      const cost = estimateVideoCost("unknown", 5);
      expect(cost).toBeUndefined();
    });
  });

  describe("getModelsByEfficiency", () => {
    it("should return all models sorted by efficiency", () => {
      const models = getModelsByEfficiency();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].approximatePerPollen).toBeGreaterThanOrEqual(models[1].approximatePerPollen);
    });

    it("should filter by image type", () => {
      const models = getModelsByEfficiency("image");
      expect(models.every((m) => m.type === "image")).toBe(true);
      expect(models.length).toBe(Object.keys(IMAGE_MODEL_PRICING).length);
    });

    it("should filter by video type", () => {
      const models = getModelsByEfficiency("video");
      expect(models.every((m) => m.type === "video")).toBe(true);
      expect(models.length).toBe(Object.keys(VIDEO_MODEL_PRICING).length);
    });
  });

  describe("modelSupportsReferenceImage", () => {
    it("should return true for models that support reference image", () => {
      expect(modelSupportsReferenceImage("gptimage")).toBe(true);
      expect(modelSupportsReferenceImage("veo")).toBe(true);
    });

    it("should return false for models that do not support reference image", () => {
      expect(modelSupportsReferenceImage("flux")).toBe(false);
    });

    it("should return false for unknown models", () => {
      expect(modelSupportsReferenceImage("unknown")).toBe(false);
    });
  });

  describe("isModelAlpha", () => {
    it("should return true for alpha models", () => {
      expect(isModelAlpha("veo")).toBe(true);
    });

    it("should return false for stable models", () => {
      expect(isModelAlpha("flux")).toBe(false);
    });

    it("should return false for unknown models", () => {
      expect(isModelAlpha("unknown")).toBe(false);
    });
  });
});
