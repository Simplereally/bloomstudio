# Flux Model Dimension & Pixel Limits

> **Last Updated:** December 24, 2025  
> **Research Method:** Empirical testing via Pollinations API + web research

This document outlines the dimension and pixel constraints for Flux image generation models, with special attention to the Pollinations AI API implementation.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Pollinations API Constraints](#pollinations-api-constraints)
- [Empirical Test Results](#empirical-test-results)
- [Native Flux Model Capabilities](#native-flux-model-capabilities)
- [Recommended Resolutions](#recommended-resolutions)
- [Implementation Guidelines](#implementation-guidelines)

---

## Executive Summary

| Constraint | Value |
|------------|-------|
| **Pollinations max total pixels** | **1,048,575** (must be **< 2²⁰**) |
| **Max safe 1:1 resolution** | 1023×1023 or 1024×1022 |
| **Dimension alignment** | Multiples of 32 recommended, minimum 64 |
| **Scaling target when exceeded** | ~589,824 pixels (~768×768 equivalent) |

**Key Finding:** The Pollinations API enforces a strict **< 1 megapixel** limit. Exactly 1024×1024 (1,048,576 pixels) triggers downscaling, but 1024×1023 (1,047,552 pixels) passes through unchanged.

---

## Pollinations API Constraints

### Pixel Limit Behavior

The Pollinations AI API caps the total number of pixels at `1024 * 1024 = 1,048,576`. However, the boundary condition appears to be:

```
if (width * height >= maxPixels) → scale down
```

This means:
- **1,048,575 pixels and below** → ✅ Passes through unchanged
- **1,048,576 pixels (exactly 1MP)** → ❌ Triggers scaling
- **Above 1,048,576 pixels** → ❌ Triggers scaling

### Scaling Algorithm

When dimensions exceed the limit, the API:
1. Calculates the scaling factor to fit within ~589,824 pixels
2. Preserves the original aspect ratio
3. Returns the scaled-down image

**Target resolution after scaling:** ~589,824 pixels
- 768×768 for 1:1 aspect ratio
- 576×1024 for portrait orientations
- 1024×576 for landscape orientations

### Model-Specific Limits (via Pollinations)

| Model | Min Size | Max Size | Default | Alignment |
|-------|----------|----------|---------|-----------|
| `flux` (default) | 64×64 | < 1MP total | 1024×768 | Multiple of 32 |
| `flux-pro` | 256×256 | 1440×1440 | 1024×768 | Multiple of 32 |
| `flux-pro/v1.1` | 256×256 | 1440×1440 | 1024×768 | Multiple of 32 |
| `flux-pro/v1.1-ultra` | Fixed | 2752×1536 | 2752×1536 | N/A |
| `flux-realism` | 512×512 | 1536×1536 | 1024×768 | Multiple of 32 |
| `flux/dev` | 512×512 | 1536×1536 | 1024×768 | Multiple of 32 |
| `flux/schnell` | 64×64 | 1536×1536 | 1024×768 | Multiple of 32 |
| `turbo` | 16×16 | 768×768 | 768×768 | N/A |

> **Note:** Even for models with higher stated max sizes (e.g., 1536×1536), the 1MP total pixel limit still applies on the free Pollinations API tier.

---

## Empirical Test Results

### Dimensions That Pass Through Unchanged

| Request | Total Pixels | Notes |
|---------|--------------|-------|
| 1024×1023 | 1,047,552 | ✅ Just under threshold |
| 1033×1000 | 1,033,000 | ✅ |
| 1032×1000 | 1,032,000 | ✅ |
| 1280×807 | 1,032,960 | ✅ |
| 1344×768 | 1,032,192 | ✅ Standard 16:9 |
| 768×1344 | 1,032,192 | ✅ Standard 9:16 |
| 1152×896 | 1,032,192 | ✅ Standard 4:3 |
| 896×1152 | 1,032,192 | ✅ Standard 3:4 |
| 1536×640 | 983,040 | ✅ Standard 21:9 |
| 1000×1000 | 1,000,000 | ✅ |
| 512×576 | 294,912 | ✅ |
| 512×512 | 262,144 | ✅ |
| 64×64 | 4,096 | ✅ Minimum size |
| 832×192 | 159,744 | ✅ Extreme aspect ratio |

### Dimensions That Get Scaled Down

| Request | Total Pixels | Result | Result Pixels |
|---------|--------------|--------|---------------|
| 1024×1024 | 1,048,576 | 768×768 | 589,824 |
| 1024×1408 | 1,441,792 | 576×1024 | 589,824 |
| 1600×960 | 1,536,000 | 1024×576 | 589,824 |
| 1792×1024 | 1,835,008 | 1024×576 | 589,824 |
| 1024×1792 | 1,835,008 | 576×1024 | 589,824 |
| 896×1280 | 1,146,880 | 576×1024 | 589,824 |

### Key Observation

The threshold is **exactly 2²⁰ = 1,048,576 pixels**. Anything at or above this value triggers proportional scaling down to approximately 589,824 pixels while preserving aspect ratio.

---

## Native Flux Model Capabilities

These are the native capabilities of Flux models from Black Forest Labs, independent of any API provider's limits:

### Flux.1 (Dev/Schnell)

| Specification | Value |
|---------------|-------|
| Official supported range | 0.1 - 2.0 megapixels |
| Minimum resolution | ~316×316 |
| Maximum resolution | ~1414×1414 |
| Experimental maximum | ~4.0 MP (2560×1440) |
| Sweet spot | 1920×1080 |
| Training resolution | Primarily 1024×1024 |

### Flux.2 / Flux 1.1 Pro Ultra

| Specification | Value |
|---------------|-------|
| Maximum resolution | 4 megapixels |
| Recommended output | 2 megapixels |
| Example max size | 2048×2048 |
| Output alignment | Multiples of 16 |

### Supported Aspect Ratios

Flux models support various aspect ratios including:
- 1:1 (Square)
- 16:9 / 9:16 (Widescreen)
- 21:9 / 9:21 (Ultra-wide)
- 4:3 / 3:4 (Standard)
- 3:2 / 2:3 (Photo)
- 4:5 / 5:4 (Portrait)

---

## Recommended Resolutions

### Safe Resolutions for Pollinations API

These resolutions are optimized to stay under the 1MP limit while maximizing quality:

| Aspect Ratio | Resolution | Total Pixels | Percentage of Limit |
|--------------|------------|--------------|---------------------|
| 1:1 | 1024×1022 | 1,046,528 | 99.8% |
| 16:9 | 1344×768 | 1,032,192 | 98.4% |
| 9:16 | 768×1344 | 1,032,192 | 98.4% |
| 4:3 | 1152×896 | 1,032,192 | 98.4% |
| 3:4 | 896×1152 | 1,032,192 | 98.4% |
| 21:9 | 1536×640 | 983,040 | 93.8% |
| 9:21 | 640×1536 | 983,040 | 93.8% |
| 3:2 | 1216×832 | 1,011,712 | 96.5% |
| 2:3 | 832×1216 | 1,011,712 | 96.5% |

### Resolution Calculation Formula

To calculate the maximum resolution for a given aspect ratio:

```typescript
function calculateMaxDimensions(aspectWidth: number, aspectHeight: number, maxPixels = 1048575): { width: number; height: number } {
  const aspectRatio = aspectWidth / aspectHeight;
  
  // Calculate the maximum height that fits within the pixel limit
  // width * height <= maxPixels
  // (aspectRatio * height) * height <= maxPixels
  // height <= sqrt(maxPixels / aspectRatio)
  
  let height = Math.floor(Math.sqrt(maxPixels / aspectRatio));
  let width = Math.floor(height * aspectRatio);
  
  // Align to multiples of 32 (recommended for Flux)
  width = Math.floor(width / 32) * 32;
  height = Math.floor(height / 32) * 32;
  
  // Verify we're still under the limit
  while (width * height >= maxPixels) {
    height -= 32;
    width = Math.floor(height * aspectRatio / 32) * 32;
  }
  
  return { width, height };
}
```

---

## Implementation Guidelines

### For This Application (PixelStream)

1. **Use pre-calculated safe resolutions** for standard aspect ratios (defined above)
2. **For custom dimensions**, validate that `width × height < 1,048,576`
3. **Align dimensions** to multiples of 32 for optimal model performance
4. **Minimum dimension** is 64 pixels on either axis

### Validation Example

```typescript
const MAX_PIXELS = 1048575; // One less than 2^20
const MIN_DIMENSION = 64;
const ALIGNMENT = 32;

function validateDimensions(width: number, height: number): boolean {
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return false;
  }
  
  if (width * height >= MAX_PIXELS + 1) {
    return false;
  }
  
  return true;
}

function alignDimension(value: number): number {
  return Math.floor(value / ALIGNMENT) * ALIGNMENT;
}
```

### Warning Signs

If you receive an image with different dimensions than requested, the API has likely scaled it down due to exceeding the pixel limit. Common scaling results:
- 768×768 (from 1:1 requests)
- 576×1024 (from portrait requests)
- 1024×576 (from landscape requests)

---

## References

- [Pollinations AI](https://pollinations.ai)
- [Black Forest Labs (Flux creators)](https://bfl.ai)

---