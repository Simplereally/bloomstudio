# Story: Seedream Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** Medium  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Seedream** model. Seedream is focused on artistic and dreamlike image generation.

## Background

Seedream is an artistic model that:
- Creates dreamlike, artistic imagery
- Supports standard dimension ranges
- Optimized for creative/artistic outputs

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define Seedream-specific aspect ratio presets
- [ ] Include all standard ratios:

| Aspect Ratio | Resolution | Total Pixels | Notes |
|--------------|------------|--------------|-------|
| 1:1 | 1024×1024 | 1,048,576 | Square compositions |
| 16:9 | 1344×768 | 1,032,192 | Cinematic landscape |
| 9:16 | 768×1344 | 1,032,192 | Vertical compositions |
| 4:3 | 1152×896 | 1,032,192 | Classic ratio |
| 3:4 | 896×1152 | 1,032,192 | Portrait art |
| 21:9 | 1536×640 | 983,040 | Panoramic |
| Custom | User-defined | Variable | Artistic freedom |

### 2. Dimension Controls

- [ ] **Enable** dimension slider/controls
- [ ] Enforce constraints:
  - **Min:** 64×64
  - **Max:** 2048×2048
  - **Step:** 64

### 3. Validation Logic

```typescript
const SEEDREAM_CONSTRAINTS = {
  maxPixels: 1048576,
  minDimension: 64,
  maxDimension: 2048,
  alignment: 32,
  uiStep: 64,
  style: 'artistic',
}
```

### 4. UI Behavior

- [ ] When Seedream model is selected:
  - Show all aspect ratio cards
  - Enable dimension controls
  - Display artistic style indicator (optional)

### 5. Default Values

- **Default Aspect:** 1:1
- **Default Dimensions:** 1024×1024

## Technical Notes

- Artistic/dreamlike output style
- Standard dimension constraints
- May have style-specific settings in future

## Files to Modify

- `lib/config/model-constraints.ts` - **Add Seedream constraints**
- `lib/image-models.ts`
- `hooks/use-studio-client-shell.ts` - Already integrated

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Add to `lib/config/model-constraints.ts`:

```typescript
export const SEEDREAM_CONSTRAINTS: ModelConstraints = {
  maxPixels: 1_048_576,
  minDimension: 64,
  maxDimension: 2048,
  step: 32, // Match Flux alignment
  defaultDimensions: { width: 1024, height: 1024 },
  dimensionsEnabled: true,
} as const

// Can reuse FLUX_ASPECT_RATIOS if same limits
// Or define SEEDREAM_ASPECT_RATIOS with artistic optimizations
```

### Pattern to Follow

1. Add constraints constant
2. Add model detection function (`isSeedreamModel`)
3. Update `getModelConstraints()` and `getModelAspectRatios()`
4. All hooks auto-adapt - no component changes needed

---

## Testing

- [ ] Verify all aspect ratio presets work
- [ ] Verify dimension controls function correctly
- [ ] Verify artistic style outputs are maintained
