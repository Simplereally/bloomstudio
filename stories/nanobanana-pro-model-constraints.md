# Story: Nanobanana Pro Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** Medium  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Nanobanana Pro** model. This is the enhanced version of Nanobanana with potentially higher quality output.

## Background

Nanobanana Pro is the professional tier of Nanobanana:
- Higher quality outputs
- May support larger dimensions
- Better detail preservation

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define Nanobanana Pro-specific aspect ratio presets
- [ ] Include optimized dimensions:

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
const NANOBANANA_PRO_CONSTRAINTS = {
  maxPixels: 1048576,
  minDimension: 64,
  maxDimension: 2048,
  alignment: 32,
  uiStep: 64,
  tier: 'pro',
}
```

### 4. UI Behavior

- [ ] When Nanobanana Pro model is selected:
  - Show all aspect ratio cards
  - Enable dimension controls
  - Display "Pro" badge indicator

### 5. Default Values

- **Default Aspect:** 1:1
- **Default Dimensions:** 1024×1024

## Technical Notes

- Pro tier model with enhanced quality
- Display "Pro" badge in UI
- Shares constraints with base Nanobanana

## Files to Modify

- `lib/config/model-constraints.ts` - **Add Nanobanana Pro constraints**
- `lib/image-models.ts`
- `hooks/use-studio-client-shell.ts` - Already integrated

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Add to `lib/config/model-constraints.ts`:

```typescript
export const NANOBANANA_PRO_CONSTRAINTS: ModelConstraints = {
  maxPixels: 1_048_576,
  minDimension: 64,
  maxDimension: 2048,
  step: 32,
  defaultDimensions: { width: 1024, height: 1024 },
  dimensionsEnabled: true,
} as const

// Model detection: can share with base Nanobanana
function isNanobananaModel(modelId: string): boolean {
  return modelId.toLowerCase().startsWith("nanobanana")
}
```

### Implementation

- Same constraints as base Nanobanana (shares `isNanobananaModel()`)
- Pro badge logic handled separately in UI components
- No constraint differences needed between tiers

---

## Testing

- [ ] Verify all aspect ratio presets produce valid output
- [ ] Verify "Pro" badge is displayed
- [ ] Verify dimension controls respect bounds
