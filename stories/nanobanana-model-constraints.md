# Story: Nanobanana Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** Medium  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Nanobanana** model. Nanobanana is a lightweight, fast model suitable for quick generations.

## Background

Nanobanana is designed for:
- Fast image generation
- Lower resource usage
- Good for previews and iterations

Similar to Turbo, it has more constrained dimension limits compared to Flux.

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define Nanobanana-specific aspect ratio presets
- [ ] Include optimized dimensions for this model:

| Aspect Ratio | Resolution | Total Pixels | Notes |
|--------------|------------|--------------|-------|
| 1:1 | 1024×1024 | 1,048,576 | Standard square |
| 16:9 | 1344×768 | 1,032,192 | Landscape |
| 9:16 | 768×1344 | 1,032,192 | Portrait |
| 4:3 | 1152×896 | 1,032,192 | Photo landscape |
| 3:4 | 896×1152 | 1,032,192 | Photo portrait |
| 21:9 | 1536×640 | 983,040 | Ultrawide |
| Custom | User-defined | Variable | With validation |

### 2. Dimension Controls

- [ ] **Enable** dimension slider/controls
- [ ] Enforce constraints:
  - **Min:** 64×64
  - **Max:** 2048×2048 (subject to API limits)
  - **Step:** 64

### 3. Validation Logic

```typescript
const NANOBANANA_CONSTRAINTS = {
  maxPixels: 1048576,
  minDimension: 64,
  maxDimension: 2048,
  alignment: 32,
  uiStep: 64,
  tier: 'standard',
}
```

### 4. UI Behavior

- [ ] When Nanobanana model is selected:
  - Show all aspect ratio cards
  - Enable dimension controls
  - Display model badge (if applicable)

### 5. Default Values

- **Default Aspect:** 1:1
- **Default Dimensions:** 1024×1024

## Technical Notes

- Standard tier model
- Shares similar constraints with base Flux
- Fast generation times

## Files to Modify

- `lib/config/model-constraints.ts` - **Add Nanobanana constraints**
- `lib/image-models.ts`
- `hooks/use-studio-client-shell.ts` - Already integrated

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Add to `lib/config/model-constraints.ts`:

```typescript
export const NANOBANANA_CONSTRAINTS: ModelConstraints = {
  maxPixels: 1_048_576,
  minDimension: 64,
  maxDimension: 2048,
  step: 32,
  defaultDimensions: { width: 1024, height: 1024 },
  dimensionsEnabled: true,
} as const

// If very similar to Flux, can potentially share FLUX_ASPECT_RATIOS
```

### Implementation Pattern

```typescript
function isNanobananaModel(modelId: string): boolean {
  return modelId.toLowerCase().startsWith("nanobanana")
}

// Update getModelConstraints() switch statement
```

### What You Get for Free

- ✅ Dynamic slider bounds
- ✅ Pixel limit enforcement  
- ✅ Auto dimension reset on model switch
- ✅ Percentage indicator in UI

---

## Testing

- [ ] Verify all aspect ratio presets produce valid output
- [ ] Verify dimension controls respect bounds
- [ ] Verify model selection updates constraints appropriately
