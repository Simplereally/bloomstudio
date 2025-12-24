# Story: GPT Image Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** **Critical**  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **GPT Image** model. This model has **fixed dimensions** and requires **disabling** the dimension slider.

## Background

GPT Image (DALL-E based) has very specific constraints:
- **Fixed resolutions only** - no arbitrary dimensions
- Only supports specific size presets
- Dimension slider must be **disabled**
- User can only select from predefined aspect ratios

### Supported Sizes for GPT Image

| Size | Dimensions | Aspect Ratio |
|------|------------|--------------|
| Small | 1024×1024 | 1:1 (Square) |
| Medium Wide | 1792×1024 | 16:9 (Landscape) |
| Medium Tall | 1024×1792 | 9:16 (Portrait) |

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define GPT Image-specific aspect ratio presets
- [ ] **Limited to only 3 options:**

| Aspect Ratio | Resolution | Notes |
|--------------|------------|-------|
| 1:1 | 1024×1024 | **Fixed - No customization** |
| 16:9 | 1792×1024 | **Fixed - No customization** |
| 9:16 | 1024×1792 | **Fixed - No customization** |

- [ ] **Remove/Hide:** Custom ratio option
- [ ] **Remove/Hide:** 4:3, 3:4, 21:9 ratios (not supported)

### 2. Dimension Controls

- [ ] ⚠️ **DISABLE** dimension slider/controls completely
- [ ] Display informational message: "GPT Image uses fixed resolutions"
- [ ] Dimensions should update automatically based on aspect ratio selection
- [ ] No manual dimension input allowed

### 3. Validation Logic

```typescript
const GPTIMAGE_CONSTRAINTS = {
  fixedSizes: true,
  allowCustomDimensions: false,
  supportedSizes: [
    { width: 1024, height: 1024, ratio: '1:1' },
    { width: 1792, height: 1024, ratio: '16:9' },
    { width: 1024, height: 1792, ratio: '9:16' },
  ],
  defaultSize: { width: 1024, height: 1024, ratio: '1:1' },
}

function validateGPTImageDimensions(width: number, height: number): ValidationResult {
  const validSize = GPTIMAGE_CONSTRAINTS.supportedSizes.find(
    (s) => s.width === width && s.height === height
  )
  
  if (!validSize) {
    return { 
      valid: false, 
      error: 'GPT Image only supports 1024×1024, 1792×1024, or 1024×1792',
      suggestedDimensions: GPTIMAGE_CONSTRAINTS.defaultSize
    }
  }
  
  return { valid: true }
}
```

### 4. UI Behavior

- [ ] When GPT Image model is selected:
  - Show **only** 3 aspect ratio cards (1:1, 16:9, 9:16)
  - **Hide or disable** dimension controls entirely
  - Display "Fixed Size" indicator on each ratio card
  - Show GPT badge on model selector

### 5. Default Values

- **Default Aspect:** 1:1
- **Default Dimensions:** 1024×1024

### 6. Model Switching Behavior

When switching TO GPT Image from another model:
- [ ] Map current aspect ratio to nearest supported ratio
- [ ] Force dimensions to match the selected ratio's fixed size
- [ ] Show notification: "Dimensions adjusted to GPT Image fixed size"

When switching FROM GPT Image to another model:
- [ ] Re-enable dimension controls
- [ ] Keep current dimensions but allow customization

## Technical Notes

> [!IMPORTANT]
> This model REQUIRES disabling dimension controls. The slider/input must be completely non-interactive when GPT Image is selected.

- GPT Image is backed by OpenAI's DALL-E model
- Fixed sizes are enforced by the API
- Attempting other dimensions will result in API error

## Files to Modify

- `lib/config/model-constraints.ts` - **Add GPT Image constraints** (see Infrastructure section below)
- `lib/image-models.ts`
- `components/studio/controls/dimension-controls.tsx` - Add disabled state
- `components/studio/controls/aspect-ratio-selector.tsx` - Filter available ratios
- `hooks/use-studio-client-shell.ts` - Already has `handleModelChange` integration

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

The following infrastructure is already in place and should be **extended** (not duplicated):

### 1. Model Constraints Configuration

**File:** `lib/config/model-constraints.ts`

Add GPT Image constraints to this file:

```typescript
// Add to lib/config/model-constraints.ts

export const GPTIMAGE_CONSTRAINTS: ModelConstraints = {
  maxPixels: Infinity, // Fixed sizes, not pixel-based
  minDimension: 1024,
  maxDimension: 1792,
  step: 1, // Not applicable - fixed sizes
  defaultDimensions: { width: 1024, height: 1024 },
  dimensionsEnabled: false, // ⚠️ KEY: Disables dimension controls
} as const

// Add to the model detection logic:
function isGPTImageModel(modelId: string): boolean {
  const normalized = modelId.toLowerCase()
  return normalized === "gptimage" || normalized === "gpt-image"
}

// Update getModelConstraints():
export function getModelConstraints(modelId: string): ModelConstraints {
  if (isFluxModel(modelId)) return FLUX_CONSTRAINTS
  if (isGPTImageModel(modelId)) return GPTIMAGE_CONSTRAINTS
  return DEFAULT_CONSTRAINTS
}
```

### 2. Fixed-Size Aspect Ratios

Add GPT Image-specific aspect ratios:

```typescript
export const GPTIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = [
  { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
  { label: "Landscape", value: "16:9", width: 1792, height: 1024, icon: "rectangle-horizontal", category: "landscape" },
  { label: "Portrait", value: "9:16", width: 1024, height: 1792, icon: "rectangle-vertical", category: "portrait" },
] as const // Note: NO "custom" option

// Update getModelAspectRatios():
export function getModelAspectRatios(modelId: string): readonly AspectRatioOption[] {
  if (isFluxModel(modelId)) return FLUX_ASPECT_RATIOS
  if (isGPTImageModel(modelId)) return GPTIMAGE_ASPECT_RATIOS
  return ASPECT_RATIOS
}
```

### 3. Dimension Controls Hook

**File:** `hooks/use-dimension-constraints.ts`

The `useDimensionConstraints` hook already supports `dimensionsEnabled: false`. When this is set, the `DimensionControls` component returns `null` (hides itself).

**No changes needed** - just set `dimensionsEnabled: false` in constraints.

### 4. Studio Integration

**File:** `hooks/use-studio-client-shell.ts`

The hook already:
- ✅ Has `handleModelChange` that auto-resets dimensions
- ✅ Returns `aspectRatios` based on model
- ✅ Passes `modelId` to `DimensionControls`

**No changes needed** - it auto-adapts to constraint changes.

### 5. Types Already Available

**File:** `types/pollinations.ts`

```typescript
import type { ModelConstraints, AspectRatioOption } from "@/types/pollinations"
```

---

## Testing

- [ ] Verify dimension slider is disabled when GPT Image selected
- [ ] Verify only 3 aspect ratio options are shown
- [ ] Verify selecting aspect ratio auto-sets correct dimensions
- [ ] Verify switching models properly enables/disables controls
- [ ] Verify API calls use only valid dimensions
