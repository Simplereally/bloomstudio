# Story: GPT Image Large Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** **Critical**  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **GPT Image Large** model. Similar to GPT Image, this model has **fixed dimensions** and requires **disabling** the dimension slider.

## Background

GPT Image Large (DALL-E 3 HD based) shares the same constraints as GPT Image but may support higher quality output:
- **Fixed resolutions only** - no arbitrary dimensions
- Only supports specific size presets
- Dimension slider must be **disabled**
- Higher quality/detail than standard GPT Image

### Supported Sizes for GPT Image Large

| Size | Dimensions | Aspect Ratio |
|------|------------|--------------|
| Square HD | 1024×1024 | 1:1 |
| Landscape HD | 1792×1024 | 16:9 |
| Portrait HD | 1024×1792 | 9:16 |

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define GPT Image Large-specific aspect ratio presets
- [ ] **Limited to only 3 options:**

| Aspect Ratio | Resolution | Notes |
|--------------|------------|-------|
| 1:1 | 1024×1024 | **Fixed HD** |
| 16:9 | 1792×1024 | **Fixed HD** |
| 9:16 | 1024×1792 | **Fixed HD** |

- [ ] **Remove/Hide:** Custom ratio option
- [ ] **Remove/Hide:** 4:3, 3:4, 21:9 ratios (not supported)

### 2. Dimension Controls

- [ ] ⚠️ **DISABLE** dimension slider/controls completely
- [ ] Display informational message: "GPT Image Large uses fixed HD resolutions"
- [ ] Dimensions should update automatically based on aspect ratio selection
- [ ] No manual dimension input allowed

### 3. Validation Logic

```typescript
const GPTIMAGE_LARGE_CONSTRAINTS = {
  fixedSizes: true,
  allowCustomDimensions: false,
  isHD: true,
  supportedSizes: [
    { width: 1024, height: 1024, ratio: '1:1' },
    { width: 1792, height: 1024, ratio: '16:9' },
    { width: 1024, height: 1792, ratio: '9:16' },
  ],
  defaultSize: { width: 1024, height: 1024, ratio: '1:1' },
}

function validateGPTImageLargeDimensions(width: number, height: number): ValidationResult {
  const validSize = GPTIMAGE_LARGE_CONSTRAINTS.supportedSizes.find(
    (s) => s.width === width && s.height === height
  )
  
  if (!validSize) {
    return { 
      valid: false, 
      error: 'GPT Image Large only supports 1024×1024, 1792×1024, or 1024×1792',
      suggestedDimensions: GPTIMAGE_LARGE_CONSTRAINTS.defaultSize
    }
  }
  
  return { valid: true }
}
```

### 4. UI Behavior

- [ ] When GPT Image Large model is selected:
  - Show **only** 3 aspect ratio cards (1:1, 16:9, 9:16)
  - **Hide or disable** dimension controls entirely
  - Display "HD" or "Large" badge indicator
  - Show "Fixed Size" indicator on each ratio card

### 5. Default Values

- **Default Aspect:** 1:1
- **Default Dimensions:** 1024×1024

### 6. Model Switching Behavior

Same as GPT Image:
- [ ] Map current aspect ratio to nearest supported ratio
- [ ] Force dimensions to match the selected ratio's fixed size
- [ ] Show notification: "Dimensions adjusted to GPT Image Large fixed size"

## Technical Notes

> [!IMPORTANT]
> This model REQUIRES disabling dimension controls. The slider/input must be completely non-interactive.

- GPT Image Large is the HD variant
- Display "Large" or "HD" badge to distinguish from standard
- Same fixed size constraints as GPT Image
- Higher quality output at same dimensions

## Files to Modify

- `lib/config/model-constraints.ts` - **Add GPT Image Large constraints**
- `lib/image-models.ts`
- `components/studio/controls/dimension-controls.tsx`
- `components/studio/controls/aspect-ratio-selector.tsx`
- `hooks/use-studio-client-shell.ts` - Already integrated

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

Extend the existing infrastructure:

### Add to `lib/config/model-constraints.ts`:

```typescript
export const GPTIMAGE_LARGE_CONSTRAINTS: ModelConstraints = {
  maxPixels: Infinity,
  minDimension: 1024,
  maxDimension: 1792,
  step: 1,
  defaultDimensions: { width: 1024, height: 1024 },
  dimensionsEnabled: false, // ⚠️ Disables dimension controls
} as const

// Reuse GPTIMAGE_ASPECT_RATIOS (same fixed sizes)
// Update getModelConstraints() and getModelAspectRatios()
```

### Automatic Integration

Once constraints are added:
- ✅ `useDimensionConstraints` hook returns `isEnabled: false`
- ✅ `DimensionControls` component auto-hides
- ✅ `handleModelChange` resets dimensions to defaults
- ✅ `aspectRatios` returns filtered list (no custom)

---

## Testing

- [ ] Verify dimension slider is disabled
- [ ] Verify only 3 aspect ratio options shown
- [ ] Verify "HD" or "Large" badge is displayed
- [ ] Verify switching models enables/disables controls
