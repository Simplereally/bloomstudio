# Story: Kontext Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** High  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Kontext** model. Kontext is designed for image editing and transformations with reference image support.

## Background

Kontext is an image-to-image model that supports:
- Reference image transformations
- Style transfer
- Image editing with prompts
- Similar dimension constraints to Flux

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define Kontext-specific aspect ratio presets
- [ ] Include all standard ratios with optimized dimensions:

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
  - **Max:** 2048×2048 (subject to pixel limit)
  - **Step:** 64

### 3. Validation Logic

```typescript
const KONTEXT_CONSTRAINTS = {
  maxPixels: 1048576,
  minDimension: 64,
  maxDimension: 2048,
  alignment: 32,
  uiStep: 64,
  supportsReferenceImage: true,
}
```

### 4. UI Behavior

- [ ] When Kontext model is selected:
  - Show all aspect ratio cards
  - Enable dimension controls
  - Show reference image upload option
  - Display image editing mode hints

### 5. Default Values

- **Default Aspect:** 1:1
- **Default Dimensions:** 1024×1024

### 6. Special Features

- [ ] Enable reference image upload UI
- [ ] Show "Image Editing" mode indicator
- [ ] Support for "Match Input" dimensions (match reference image)

## Technical Notes

- Kontext is optimized for image editing workflows
- Reference images influence output dimensions
- Quality is best when output matches input aspect ratio

## Files to Modify

- `lib/config/model-constraints.ts` - **Add Kontext constraints**
- `lib/image-models.ts`
- `components/studio/controls/aspect-ratio-selector.tsx`
- `hooks/use-studio-client-shell.ts` - Already integrated

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Add to `lib/config/model-constraints.ts`:

```typescript
export const KONTEXT_CONSTRAINTS: ModelConstraints = {
  maxPixels: 1_048_576, // Similar to Flux
  minDimension: 64,
  maxDimension: 2048,
  step: 64,
  defaultDimensions: { width: 1024, height: 1024 },
  dimensionsEnabled: true,
} as const

// Kontext can use default ASPECT_RATIOS or define custom ones
// May need additional fields for reference image support
```

### Automatic Features

- ✅ `useDimensionConstraints` enforces pixel limit
- ✅ `handleModelChange` auto-adjusts dimensions  
- ✅ Dynamic slider bounds calculated per constraints
- ✅ Percentage indicator for pixel usage

### Future: Reference Image Support

For "Match Input" dimensions, may need to extend `ModelConstraints` with:
```typescript
supportsReferenceImage?: boolean
```

---

## Testing

- [ ] Verify dimension controls work with reference images
- [ ] Verify "Match Input" correctly inherits dimensions
- [ ] Verify all preset resolutions produce valid output
