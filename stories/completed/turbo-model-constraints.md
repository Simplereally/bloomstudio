# Story: Turbo Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** High  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Turbo** model. Turbo is a fast generation model with strict dimension limits.

## Background

According to research in `FLUX_DIMENSION_LIMITS.md`:
- **Max dimensions:** 768×768
- **Min dimensions:** 16×16 (per API docs, but practical min is 64)
- Turbo prioritizes speed over maximum resolution
- Very fast generation times

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define Turbo-specific aspect ratio presets (limited to fit 768px max)
- [ ] Include scaled-down versions of standard ratios:

| Aspect Ratio | Resolution | Total Pixels | Notes |
|--------------|------------|--------------|-------|
| 1:1 | 768×768 | 589,824 | **Maximum for Turbo** |
| 16:9 | 768×432 | 331,776 | Scaled landscape |
| 9:16 | 432×768 | 331,776 | Scaled portrait |
| 4:3 | 768×576 | 442,368 | Scaled photo |
| 3:4 | 576×768 | 442,368 | Scaled portrait photo |
| 21:9 | 768×320 | 245,760 | Ultrawide |
| Custom | User-defined | ≤ 589,824 | With 768px max |

### 2. Dimension Controls

- [ ] **Enable** dimension slider/controls with restricted range
- [ ] Enforce constraints:
  - **Min:** 64×64 (practical minimum)
  - **Max:** 768×768 (strict maximum)
  - **Step:** 64

### 3. Validation Logic

```typescript
const TURBO_CONSTRAINTS = {
  maxPixels: 589824,     // 768 × 768
  minDimension: 64,
  maxDimension: 768,     // Strict maximum
  alignment: 16,
  uiStep: 64,
  isFastModel: true,
}

function validateTurboDimensions(width: number, height: number): ValidationResult {
  if (width > TURBO_CONSTRAINTS.maxDimension) {
    return { valid: false, error: 'Width cannot exceed 768px for Turbo model' }
  }
  if (height > TURBO_CONSTRAINTS.maxDimension) {
    return { valid: false, error: 'Height cannot exceed 768px for Turbo model' }
  }
  return { valid: true }
}
```

### 4. UI Behavior

- [ ] When Turbo model is selected:
  - Show modified aspect ratio cards with Turbo-specific dimensions
  - Enable dimension controls with 768px maximum
  - Display "⚡ Fast Mode" indicator
  - Show warning if user tries to exceed 768px

### 5. Default Values

- **Default Aspect:** 1:1
- **Default Dimensions:** 768×768 (maximum quality)

### 6. Model Switching Behavior

When switching TO Turbo from a higher-resolution model:
- [ ] Scale down dimensions if they exceed 768px
- [ ] Preserve aspect ratio where possible
- [ ] Show notification: "Dimensions scaled to fit Turbo's 768×768 maximum"

## Technical Notes

- Turbo is optimized for rapid iteration and previews
- Lower resolution allows for faster generation
- Useful for testing prompts before using higher-quality models

## Files to Modify

- `lib/config/model-constraints.ts` - **Add Turbo constraints**
- `lib/image-models.ts`
- `hooks/use-studio-client-shell.ts` - Already integrated
- `components/studio/controls/dimension-controls.tsx` - Already model-aware

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Add to `lib/config/model-constraints.ts`:

```typescript
export const TURBO_CONSTRAINTS: ModelConstraints = {
  maxPixels: 589_824, // 768 × 768
  minDimension: 64,
  maxDimension: 768, // Strict max
  step: 64,
  defaultDimensions: { width: 768, height: 768 },
  dimensionsEnabled: true,
} as const

export const TURBO_ASPECT_RATIOS: readonly AspectRatioOption[] = [
  { label: "Square", value: "1:1", width: 768, height: 768, icon: "square", category: "square" },
  { label: "Landscape", value: "16:9", width: 768, height: 432, icon: "rectangle-horizontal", category: "landscape" },
  { label: "Portrait", value: "9:16", width: 432, height: 768, icon: "rectangle-vertical", category: "portrait" },
  { label: "Photo", value: "4:3", width: 768, height: 576, icon: "image", category: "landscape" },
  { label: "Custom", value: "custom", width: 768, height: 768, icon: "sliders", category: "square" },
] as const

// Update getModelConstraints():
function isTurboModel(modelId: string): boolean {
  return modelId.toLowerCase() === "turbo"
}
```

### Hooks Auto-Adapt

- ✅ `useDimensionConstraints` calculates dynamic max at 768px
- ✅ `handleModelChange` scales down dimensions if over 768
- ✅ Percentage indicator shows % of 589K limit

---

## Testing

- [ ] Verify 768×768 works without scaling
- [ ] Verify dimensions above 768 are rejected or scaled
- [ ] Verify fast generation indicator appears
- [ ] Verify model switching properly scales dimensions
