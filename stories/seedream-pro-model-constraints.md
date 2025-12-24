# Story: Seedream Pro Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** Medium  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Seedream Pro** model. This is the professional tier of Seedream with enhanced artistic capabilities.

## Background

Seedream Pro offers:
- Higher quality artistic outputs
- Enhanced dream-like effects
- Professional-tier processing
- Potentially larger dimension support

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define Seedream Pro-specific aspect ratio presets
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
const SEEDREAM_PRO_CONSTRAINTS = {
  maxPixels: 1048576,
  minDimension: 64,
  maxDimension: 2048,
  alignment: 32,
  uiStep: 64,
  tier: 'pro',
  style: 'artistic',
}
```

### 4. UI Behavior

- [ ] When Seedream Pro model is selected:
  - Show all aspect ratio cards
  - Enable dimension controls
  - Display "Pro" badge indicator
  - Show artistic style indicator

### 5. Default Values

- **Default Aspect:** 1:1
- **Default Dimensions:** 1024×1024

## Technical Notes

- Pro tier artistic model
- Display "Pro" badge in UI
- Enhanced output quality
- Shares base constraints with standard Seedream

## Files to Modify

- `lib/config/model-constraints.ts` - **Add Seedream Pro constraints**
- `lib/image-models.ts`
- `hooks/use-studio-client-shell.ts` - Already integrated

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Add to `lib/config/model-constraints.ts`:

```typescript
// Shares constraints with base Seedream
function isSeedreamModel(modelId: string): boolean {
  return modelId.toLowerCase().startsWith("seedream")
}

// SEEDREAM_CONSTRAINTS handles both base and Pro tiers
```

### Implementation Notes

- Same dimension constraints as base Seedream
- Pro badge handled by UI, not constraints
- Can share `SEEDREAM_CONSTRAINTS` for both tiers

---

## Testing

- [ ] Verify all aspect ratio presets work
- [ ] Verify "Pro" badge is displayed
- [ ] Verify dimension controls function correctly
