/**
 * Tests for image-models utilities
 *
 * Tests aspect ratio constants and the getClampedAspectRatio function.
 */

import { describe, it, expect } from "vitest";
import {
  ASPECT_RATIOS,
  DEFAULT_DIMENSIONS,
  getClampedAspectRatio,
} from "./image-models";

describe("ASPECT_RATIOS", () => {
  describe("structure validation", () => {
    it("contains expected number of aspect ratio options", () => {
      expect(ASPECT_RATIOS.length).toBeGreaterThanOrEqual(10);
    });

    it("every option has required properties", () => {
      ASPECT_RATIOS.forEach((option) => {
        expect(option.label).toBeDefined();
        expect(option.value).toBeDefined();
        expect(option.width).toBeGreaterThan(0);
        expect(option.height).toBeGreaterThan(0);
        expect(option.icon).toBeDefined();
        expect(option.category).toBeDefined();
      });
    });

    it("has unique values for each aspect ratio", () => {
      const values = ASPECT_RATIOS.map((o) => o.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("specific aspect ratios", () => {
    it("includes Square 1:1", () => {
      const square = ASPECT_RATIOS.find((o) => o.value === "1:1");
      expect(square).toBeDefined();
      expect(square?.label).toBe("Square");
      expect(square?.width).toBe(square?.height);
    });

    it("includes Landscape 16:9", () => {
      const landscape = ASPECT_RATIOS.find((o) => o.value === "16:9");
      expect(landscape).toBeDefined();
      expect(landscape?.label).toBe("Landscape");
      expect(landscape!.width).toBeGreaterThan(landscape!.height);
    });

    it("includes Portrait 9:16", () => {
      const portrait = ASPECT_RATIOS.find((o) => o.value === "9:16");
      expect(portrait).toBeDefined();
      expect(portrait?.label).toBe("Portrait");
      expect(portrait!.height).toBeGreaterThan(portrait!.width);
    });

    it("includes Custom option", () => {
      const custom = ASPECT_RATIOS.find((o) => o.value === "custom");
      expect(custom).toBeDefined();
      expect(custom?.label).toBe("Custom");
    });
  });

  describe("dimension validity", () => {
    it("all dimensions are divisible by 32 (most common step)", () => {
      ASPECT_RATIOS.forEach((option) => {
        expect(option.width % 32).toBe(0);
        expect(option.height % 32).toBe(0);
      });
    });

    it("all dimensions are within safe limits", () => {
      ASPECT_RATIOS.forEach((option) => {
        expect(option.width).toBeGreaterThanOrEqual(DEFAULT_DIMENSIONS.MIN);
        expect(option.width).toBeLessThanOrEqual(DEFAULT_DIMENSIONS.MAX);
        expect(option.height).toBeGreaterThanOrEqual(DEFAULT_DIMENSIONS.MIN);
        expect(option.height).toBeLessThanOrEqual(DEFAULT_DIMENSIONS.MAX);
      });
    });
  });

  describe("categories", () => {
    it("has valid categories", () => {
      const validCategories = [
        "square",
        "landscape",
        "portrait",
        "ultrawide",
      ];
      ASPECT_RATIOS.forEach((option) => {
        expect(validCategories).toContain(option.category);
      });
    });

    it("landscape options have width > height", () => {
      const landscapes = ASPECT_RATIOS.filter(
        (o) => o.category === "landscape"
      );
      landscapes.forEach((option) => {
        expect(option.width).toBeGreaterThan(option.height);
      });
    });

    it("portrait options have height > width", () => {
      const portraits = ASPECT_RATIOS.filter((o) => o.category === "portrait");
      portraits.forEach((option) => {
        expect(option.height).toBeGreaterThan(option.width);
      });
    });

    it("square options have equal width and height", () => {
      const squares = ASPECT_RATIOS.filter((o) => o.category === "square");
      // Note: Custom is also marked as square but may differ
      squares
        .filter((o) => o.value !== "custom")
        .forEach((option) => {
          expect(option.width).toBe(option.height);
        });
    });
  });
});

describe("DEFAULT_DIMENSIONS", () => {
  it("has expected MIN value", () => {
    expect(DEFAULT_DIMENSIONS.MIN).toBe(64);
  });

  it("has expected MAX value", () => {
    expect(DEFAULT_DIMENSIONS.MAX).toBe(2048);
  });

  it("has expected STEP value", () => {
    expect(DEFAULT_DIMENSIONS.STEP).toBe(64);
  });

  it("has expected DEFAULT value", () => {
    expect(DEFAULT_DIMENSIONS.DEFAULT).toBe(1024);
  });

  it("DEFAULT is within MIN and MAX", () => {
    expect(DEFAULT_DIMENSIONS.DEFAULT).toBeGreaterThanOrEqual(
      DEFAULT_DIMENSIONS.MIN
    );
    expect(DEFAULT_DIMENSIONS.DEFAULT).toBeLessThanOrEqual(
      DEFAULT_DIMENSIONS.MAX
    );
  });

  it("DEFAULT is divisible by STEP", () => {
    expect(DEFAULT_DIMENSIONS.DEFAULT % DEFAULT_DIMENSIONS.STEP).toBe(0);
  });
});

describe("getClampedAspectRatio", () => {
  describe("normal cases", () => {
    it("returns correct ratio for square", () => {
      expect(getClampedAspectRatio(1024, 1024)).toBe(1);
    });

    it("returns correct ratio for 16:9 landscape", () => {
      const ratio = getClampedAspectRatio(1920, 1080);
      expect(ratio).toBeCloseTo(16 / 9, 2);
    });

    it("returns correct ratio for 9:16 portrait", () => {
      const ratio = getClampedAspectRatio(1080, 1920);
      expect(ratio).toBeCloseTo(9 / 16, 2);
    });

    it("returns correct ratio for 4:3", () => {
      const ratio = getClampedAspectRatio(1024, 768);
      expect(ratio).toBeCloseTo(4 / 3, 2);
    });
  });

  describe("clamping behavior", () => {
    it("clamps very wide aspect ratios to max", () => {
      // 10:1 ratio should be clamped to 2.5
      const ratio = getClampedAspectRatio(1000, 100);
      expect(ratio).toBe(2.5);
    });

    it("clamps very tall aspect ratios to min", () => {
      // 1:10 ratio = 0.1, should be clamped to 0.4
      const ratio = getClampedAspectRatio(100, 1000);
      expect(ratio).toBe(0.4);
    });

    it("does not clamp ratio within bounds", () => {
      // 1.5 is within 0.4-2.5
      const ratio = getClampedAspectRatio(1500, 1000);
      expect(ratio).toBe(1.5);
    });

    it("respects custom min parameter", () => {
      const ratio = getClampedAspectRatio(100, 1000, 0.2);
      expect(ratio).toBe(0.2);
    });

    it("respects custom max parameter", () => {
      const ratio = getClampedAspectRatio(1000, 100, 0.4, 5);
      expect(ratio).toBe(5);
    });
  });

  describe("edge cases", () => {
    it("returns 1 for zero width", () => {
      expect(getClampedAspectRatio(0, 1000)).toBe(1);
    });

    it("returns 1 for zero height", () => {
      expect(getClampedAspectRatio(1000, 0)).toBe(1);
    });

    it("returns 1 for both zero", () => {
      expect(getClampedAspectRatio(0, 0)).toBe(1);
    });

    it("returns 1 for undefined-like values (NaN)", () => {
      expect(getClampedAspectRatio(NaN, 1000)).toBe(1);
    });

    it("handles negative values gracefully", () => {
      // -100/1000 = -0.1, which is less than min 0.4
      const ratio = getClampedAspectRatio(-100, 1000);
      expect(ratio).toBe(0.4);
    });
  });

  describe("boundary values", () => {
    it("returns exactly min when ratio equals min", () => {
      // 0.4 = 400/1000
      const ratio = getClampedAspectRatio(400, 1000);
      expect(ratio).toBe(0.4);
    });

    it("returns exactly max when ratio equals max", () => {
      // 2.5 = 2500/1000
      const ratio = getClampedAspectRatio(2500, 1000);
      expect(ratio).toBe(2.5);
    });

    it("returns ratio just below max unchanged", () => {
      // 2.4 is below 2.5
      const ratio = getClampedAspectRatio(2400, 1000);
      expect(ratio).toBe(2.4);
    });

    it("returns ratio just above min unchanged", () => {
      // 0.5 is above 0.4
      const ratio = getClampedAspectRatio(500, 1000);
      expect(ratio).toBe(0.5);
    });
  });
});
