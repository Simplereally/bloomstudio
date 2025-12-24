# Story: ZImage Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** Medium  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **ZImage** model.

## Background

ZImage is an image generation model with standard dimension support:
- Supports flexible dimensions
- Standard resolution ranges
- May have specific optimizations for certain ratios

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define ZImage-specific aspect ratio presets
- [ ] Include all standard ratios:

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
  - **Max:** 2048×2048
  - **Step:** 64

### 3. Validation Logic

```typescript
const ZIMAGE_CONSTRAINTS = {
  maxPixels: 1048576,
  minDimension: 64,
  maxDimension: 2048,
  alignment: 32,
  uiStep: 64,
}
```

### 4. UI Behavior

- [ ] When ZImage model is selected:
  - Show all aspect ratio cards
  - Enable dimension controls
  - Standard generation interface

### 5. Default Values

- **Default Aspect:** 1:1
- **Default Dimensions:** 1024×1024

## Technical Notes

- Standard dimension constraints
- May need updates if API documentation reveals specific limits

## Files to Modify

- `lib/config/model-constraints.ts` - **Add ZImage constraints**
- `lib/image-models.ts`
- `hooks/use-studio-client-shell.ts` - Already integrated

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Add to `lib/config/model-constraints.ts`:

```typescript
export const ZIMAGE_CONSTRAINTS: ModelConstraints = {
  maxPixels: 1_048_576,
  minDimension: 64,
  maxDimension: 2048,
  step: 32,
  defaultDimensions: { width: 1024, height: 1024 },
  dimensionsEnabled: true,
} as const
```

### Minimal Implementation

1. Add `ZIMAGE_CONSTRAINTS` constant
2. Add `isZImageModel()` check
3. Update `getModelConstraints()` 
4. Can share `FLUX_ASPECT_RATIOS` if limits match

### Auto-Integrated Features

- ✅ Dimension controls with dynamic limits
- ✅ Pixel percentage indicator
- ✅ Model switch dimension adjustment

---

## Testing

- [ ] Verify all aspect ratio presets work
- [ ] Verify dimension controls function correctly
- [ ] Verify no unexpected scaling occurs
