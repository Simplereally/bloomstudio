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

    it("should return pricing for flux-2-dev", () => {
      const pricing = getModelPricing("flux-2-dev");
      expect(pricing).toBeDefined();
      expect(pricing?.type).toBe("image");
      expect(pricing?.modelId).toBe("flux-2-dev");
      expect(pricing?.approximatePerPollen).toBe(1000);
    });

    it("should return pricing for dirtberry", () => {
      const pricing = getModelPricing("dirtberry");
      expect(pricing).toBeDefined();
      expect(pricing?.type).toBe("image");
      expect(pricing?.modelId).toBe("dirtberry");
      expect(pricing?.approximatePerPollen).toBe(1000);
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

    it("should calculate cost for flux-2-dev at $0.001/image", () => {
      const cost1 = estimateImageCost("flux-2-dev", 1);
      expect(cost1).toBe(0.001);

      const cost10 = estimateImageCost("flux-2-dev", 10);
      expect(cost10).toBe(0.001 * 10);
    });

    it("should calculate cost for token-based model (rough estimate)", () => {
      // nanobanana: output per million is 30.0
      // 1 image = 30.0 / 1_000_000 * 1
      const cost = estimateImageCost("nanobanana", 1);
      expect(cost).toBe(30.0 / 1_000_000);
    });

    it("should calculate cost for dirtberry at $0.001/image", () => {
      const cost1 = estimateImageCost("dirtberry", 1);
      expect(cost1).toBe(0.001);

      const cost10 = estimateImageCost("dirtberry", 10);
      expect(cost10).toBe(0.001 * 10);
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

    it("should calculate cost for grok-video at $0.0025/s", () => {
      // grok-video is 0.0025 per second
      const cost5s = estimateVideoCost("grok-video", 5);
      expect(cost5s).toBe(0.0025 * 5); // $0.0125 for 5s

      const cost10s = estimateVideoCost("grok-video", 10);
      expect(cost10s).toBe(0.0025 * 10); // $0.025 for 10s
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
      expect(modelSupportsReferenceImage("flux-2-dev")).toBe(false);
      expect(modelSupportsReferenceImage("dirtberry")).toBe(false);
    });

    it("should return false for unknown models", () => {
      expect(modelSupportsReferenceImage("unknown")).toBe(false);
    });
  });

  describe("isModelAlpha", () => {
    it("should return true for alpha models", () => {
      expect(isModelAlpha("veo")).toBe(true);
      expect(isModelAlpha("grok-video")).toBe(true);
      expect(isModelAlpha("dirtberry")).toBe(true);
    });

    it("should return false for stable models", () => {
      expect(isModelAlpha("flux")).toBe(false);
      expect(isModelAlpha("flux-2-dev")).toBe(false);
    });

    it("should return false for unknown models", () => {
      expect(isModelAlpha("unknown")).toBe(false);
    });
  });
});

describe("FLUX.2 Dev pricing specifics", () => {
  it("should exist in IMAGE_MODEL_PRICING", () => {
    expect(IMAGE_MODEL_PRICING["flux-2-dev"]).toBeDefined();
  });

  it("should have per-image pricing at $0.001", () => {
    const pricing = IMAGE_MODEL_PRICING["flux-2-dev"];
    expect(pricing.imagePricing?.perImage).toBe(0.001);
  });

  it("should have approximatePerPollen of 1000 (consistent with perImage)", () => {
    const pricing = IMAGE_MODEL_PRICING["flux-2-dev"];
    expect(pricing.approximatePerPollen).toBe(1000);
    // Verify: 1 / perImage should equal approximatePerPollen
    const expectedEfficiency = 1 / pricing.imagePricing!.perImage;
    expect(pricing.approximatePerPollen).toBe(expectedEfficiency);
  });

  it("should not support reference image", () => {
    const pricing = IMAGE_MODEL_PRICING["flux-2-dev"];
    expect(pricing.supportsReferenceImage).toBe(false);
  });

  it("should not be alpha", () => {
    const pricing = IMAGE_MODEL_PRICING["flux-2-dev"];
    expect(pricing.isAlpha).toBeUndefined();
  });

  it("should not have token pricing (uses simple per-image pricing)", () => {
    const pricing = IMAGE_MODEL_PRICING["flux-2-dev"];
    expect(pricing.tokenPricing).toBeUndefined();
  });
});

describe("Dirtberry pricing specifics", () => {
  it("should exist in IMAGE_MODEL_PRICING", () => {
    expect(IMAGE_MODEL_PRICING["dirtberry"]).toBeDefined();
  });

  it("should have per-image pricing at $0.001", () => {
    const pricing = IMAGE_MODEL_PRICING["dirtberry"];
    expect(pricing.imagePricing?.perImage).toBe(0.001);
  });

  it("should have approximatePerPollen of 1000 (consistent with perImage)", () => {
    const pricing = IMAGE_MODEL_PRICING["dirtberry"];
    expect(pricing.approximatePerPollen).toBe(1000);
    const expectedEfficiency = 1 / pricing.imagePricing!.perImage;
    expect(pricing.approximatePerPollen).toBe(expectedEfficiency);
  });

  it("should not support reference image", () => {
    const pricing = IMAGE_MODEL_PRICING["dirtberry"];
    expect(pricing.supportsReferenceImage).toBe(false);
  });

  it("should be alpha", () => {
    const pricing = IMAGE_MODEL_PRICING["dirtberry"];
    expect(pricing.isAlpha).toBe(true);
  });

  it("should not have token pricing (uses simple per-image pricing)", () => {
    const pricing = IMAGE_MODEL_PRICING["dirtberry"];
    expect(pricing.tokenPricing).toBeUndefined();
  });
});
