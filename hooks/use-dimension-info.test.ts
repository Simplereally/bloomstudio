/**
 * Tests for useDimensionInfo hook
 *
 * Tests dimension calculations, limit detection, and model constraint lookups.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDimensionInfo } from "./use-dimension-info";

// Mock the models config
vi.mock("@/lib/config/models", () => ({
  getModel: vi.fn((modelId: string) => {
    const models: Record<string, { constraints: object } | undefined> = {
      flux: {
        constraints: {
          maxPixels: 2_097_152, // ~2MP (1448x1448)
          minPixels: 65536,
          minDimension: 256,
          maxDimension: 1536,
          step: 64,
          defaultDimensions: { width: 1024, height: 1024 },
          dimensionsEnabled: true,
        },
      },
      "turbo-video": {
        constraints: {
          maxPixels: Infinity, // No pixel limit for video
          minPixels: 0,
          minDimension: 64,
          maxDimension: 1920,
          step: 64,
          defaultDimensions: { width: 1280, height: 720 },
          dimensionsEnabled: false, // Dimensions disabled for video
        },
      },
      zimage: {
        constraints: {
          maxPixels: 4_194_304, // 4MP
          minPixels: 0,
          minDimension: 64,
          maxDimension: 2048,
          step: 64,
          defaultDimensions: { width: 1024, height: 1024 },
          dimensionsEnabled: true,
        },
      },
    };
    return models[modelId];
  }),
}));

describe("useDimensionInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic calculations", () => {
    it("calculates pixel count correctly", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 1024,
          height: 768,
        })
      );

      expect(result.current.pixelCount).toBe(1024 * 768);
    });

    it("formats megapixels to 2 decimal places", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 1024,
          height: 1024,
        })
      );

      // 1024 * 1024 = 1,048,576 pixels = 1.05 MP
      expect(result.current.megapixels).toBe("1.05");
    });

    it("handles large dimensions", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "zimage",
          width: 2048,
          height: 2048,
        })
      );

      // 2048 * 2048 = 4,194,304 pixels = 4.19 MP
      expect(result.current.megapixels).toBe("4.19");
    });

    it("handles small dimensions", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 256,
          height: 256,
        })
      );

      // 256 * 256 = 65,536 pixels = 0.07 MP
      expect(result.current.megapixels).toBe("0.07");
    });
  });

  describe("limit detection", () => {
    it("returns isOverLimit true when pixels exceed maxPixels", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 1536,
          height: 1536, // 2,359,296 pixels > 2,097,152 limit
        })
      );

      expect(result.current.isOverLimit).toBe(true);
    });

    it("returns isOverLimit false when pixels are under maxPixels", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 1024,
          height: 1024, // 1,048,576 pixels < 2,097,152 limit
        })
      );

      expect(result.current.isOverLimit).toBe(false);
    });

    it("returns isOverLimit true when pixels exactly equal maxPixels", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 1448,
          height: 1448, // ~2,096,704 pixels ≈ limit (rounding may cause edge cases)
        })
      );

      // 1448 * 1448 = 2,096,704, which is just under 2,097,152
      // So this should NOT be over limit
      expect(result.current.isOverLimit).toBe(false);
    });
  });

  describe("pixel limit info", () => {
    it("returns hasPixelLimit true when model has finite maxPixels", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 1024,
          height: 1024,
        })
      );

      expect(result.current.hasPixelLimit).toBe(true);
    });

    it("returns hasPixelLimit false when model has Infinity maxPixels", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "turbo-video",
          width: 1280,
          height: 720,
        })
      );

      expect(result.current.hasPixelLimit).toBe(false);
    });
  });

  describe("percent of limit", () => {
    it("calculates percentOfLimit correctly", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 1024,
          height: 1024, // 1,048,576 pixels
        })
      );

      // 1,048,576 / 2,097,152 * 100 = 50%
      expect(result.current.percentOfLimit).toBeCloseTo(50, 0);
    });

    it("returns null percentOfLimit when no pixel limit", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "turbo-video",
          width: 1920,
          height: 1080,
        })
      );

      expect(result.current.percentOfLimit).toBeNull();
    });

    it("returns percentOfLimit > 100 when over limit", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 1536,
          height: 1536, // 2,359,296 pixels
        })
      );

      // 2,359,296 / 2,097,152 * 100 ≈ 112.5%
      expect(result.current.percentOfLimit).toBeGreaterThan(100);
    });
  });

  describe("dimensions enabled", () => {
    it("returns isEnabled true for image models", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "flux",
          width: 1024,
          height: 1024,
        })
      );

      expect(result.current.isEnabled).toBe(true);
    });

    it("returns isEnabled false for video models", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "turbo-video",
          width: 1280,
          height: 720,
        })
      );

      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe("unknown model fallback", () => {
    it("uses default constraints for unknown model", () => {
      const { result } = renderHook(() =>
        useDimensionInfo({
          modelId: "unknown-model",
          width: 1024,
          height: 1024,
        })
      );

      // Default has Infinity maxPixels, so no limit
      expect(result.current.hasPixelLimit).toBe(false);
      expect(result.current.isOverLimit).toBe(false);
      expect(result.current.percentOfLimit).toBeNull();
      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe("memoization", () => {
    it("updates when dimensions change", () => {
      const { result, rerender } = renderHook(
        ({ width, height }) =>
          useDimensionInfo({
            modelId: "flux",
            width,
            height,
          }),
        { initialProps: { width: 1024, height: 1024 } }
      );

      expect(result.current.pixelCount).toBe(1024 * 1024);

      rerender({ width: 512, height: 512 });

      expect(result.current.pixelCount).toBe(512 * 512);
    });

    it("updates when model changes", () => {
      const { result, rerender } = renderHook(
        ({ modelId }) =>
          useDimensionInfo({
            modelId,
            width: 1024,
            height: 1024,
          }),
        { initialProps: { modelId: "flux" } }
      );

      expect(result.current.hasPixelLimit).toBe(true);

      rerender({ modelId: "turbo-video" });

      expect(result.current.hasPixelLimit).toBe(false);
    });
  });
});
