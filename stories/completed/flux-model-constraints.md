# Story: Flux Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** High  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Flux** family of models. Based on empirical research documented in `FLUX_DIMENSION_LIMITS.md`, Flux models have specific pixel limits and dimension constraints that must be respected.

## Background

The Pollinations API enforces a strict **< 1 megapixel** limit for Flux models:
- **Max total pixels:** 1,048,575 (must be **< 2²⁰** i.e. strictly less than 1,048,576)
- **Dimension alignment:** Multiples of 32 recommended for quality
- **Minimum dimension:** 64 pixels

**Critical:** If dimensions hit or exceed 1MP (≥ 1,048,576 pixels), the API will automatically "squash" the image by scaling down to ~589,824 pixels (~768×768).

---

## Acceptance Criteria

### 1. Aspect Ratio Presets

All presets must:
- Stay **strictly under** 1,048,576 pixels (1MP)
- Use **clean, professional dimensions** (no awkward values like 1024×1022)
- Align to multiples of 32 for optimal model quality
- Maximize resolution within the 1MP constraint

#### Optimized Preset Table

| Aspect Ratio | Resolution | Total Pixels | % of Limit | Notes |
|--------------|------------|--------------|------------|-------|
| **1:1** | 1024×1024 | 1,048,576 | ❌ | Exceeds limit - **NOT SAFE** |
| **1:1** | 1000×1000 | 1,000,000 | 95.4% | ✅ **Recommended** - clean, safe |
| **1:1** | 992×992 | 984,064 | 93.9% | ✅ Alternative - 32-aligned |
| **16:9** | 1360×768 | 1,044,480 | 99.6% | ✅ Maximized landscape |
| **9:16** | 768×1360 | 1,044,480 | 99.6% | ✅ Maximized portrait |
| **4:3** | 1152×864 | 995,328 | 94.9% | ✅ 32-aligned standard |
| **3:4** | 864×1152 | 995,328 | 94.9% | ✅ 32-aligned portrait |
| **3:2** | 1248×832 | 1,038,336 | 99.0% | ✅ Photo landscape |
| **2:3** | 832×1248 | 1,038,336 | 99.0% | ✅ Photo portrait |
| **4:5** | 896×1120 | 1,003,520 | 95.7% | ✅ Instagram portrait |
| **5:4** | 1120×896 | 1,003,520 | 95.7% | ✅ Photo landscape |
| **21:9** | 1568×672 | 1,053,696 | ❌ | Exceeds - adjust down |
| **21:9** | 1536×640 | 983,040 | 93.8% | ✅ Safe ultrawide |
| **9:21** | 640×1536 | 983,040 | 93.8% | ✅ Safe vertical ultra |
| **Custom** | User-defined | **< 1,048,576** | — | With live validation |

---

## Implementation

### 2. Extend Existing Types

Extend the existing types in `types/pollinations.ts` rather than creating parallel structures.

```typescript
// types/pollinations.ts - ADD these new types

/**
 * Extended aspect ratio type to support model-specific presets.
 * Union includes all standard ratios plus any model-specific additions.
 */
export type AspectRatio =
  | "1:1"
  | "16:9"
  | "9:16"
  | "4:3"
  | "3:4"
  | "3:2"
  | "2:3"
  | "4:5"
  | "5:4"
  | "21:9"
  | "9:21"
  | "custom"

/**
 * Model constraints configuration.
 * Each model can define its own pixel limits and UI behavior.
 */
export interface ModelConstraints {
  /** Maximum total pixels allowed (width × height must be < this value) */
  readonly maxPixels: number
  /** Minimum dimension for width or height */
  readonly minDimension: number
  /** Maximum dimension for a single axis */
  readonly maxDimension: number
  /** Step size for UI sliders (should align with model's optimal values) */
  readonly step: number
  /** Default dimensions when this model is selected */
  readonly defaultDimensions: { readonly width: number; readonly height: number }
  /** Whether dimension controls are enabled for this model */
  readonly dimensionsEnabled: boolean
}

/**
 * Aspect ratio option extended with optional category for UI grouping.
 */
export interface AspectRatioOption {
  readonly label: string
  readonly value: AspectRatio
  readonly width: number
  readonly height: number
  readonly icon: string
  readonly category?: "square" | "landscape" | "portrait" | "ultrawide"
}
```

---

### 3. Model Constraints Configuration

Create a single configuration file for all model constraints.

```typescript
// lib/config/model-constraints.ts

import type { AspectRatioOption, ModelConstraints } from "@/types/pollinations"

/**
 * Flux model family constraints.
 * Enforces < 1 megapixel limit with 32-pixel alignment.
 */
export const FLUX_CONSTRAINTS: ModelConstraints = {
  maxPixels: 1_048_575, // Strictly < 2^20 (1MP)
  minDimension: 64,
  maxDimension: 2048,
  step: 32,
  defaultDimensions: { width: 1000, height: 1000 },
  dimensionsEnabled: true,
} as const

/**
 * Default constraints for models without specific limits.
 */
export const DEFAULT_CONSTRAINTS: ModelConstraints = {
  maxPixels: Infinity,
  minDimension: 64,
  maxDimension: 2048,
  step: 64,
  defaultDimensions: { width: 1024, height: 1024 },
  dimensionsEnabled: true,
} as const

/**
 * Model ID to constraints mapping.
 * Flux variants all share the same 1MP limit.
 */
const CONSTRAINTS_MAP: ReadonlyMap<string, ModelConstraints> = new Map([
  ["flux", FLUX_CONSTRAINTS],
  ["flux-pro", FLUX_CONSTRAINTS],
  ["flux-realism", FLUX_CONSTRAINTS],
  ["flux/dev", FLUX_CONSTRAINTS],
  ["flux/schnell", FLUX_CONSTRAINTS],
])

/**
 * Get constraints for a specific model.
 * Returns DEFAULT_CONSTRAINTS if model has no specific limits.
 */
export function getModelConstraints(modelId: string): ModelConstraints {
  return CONSTRAINTS_MAP.get(modelId) ?? DEFAULT_CONSTRAINTS
}

/**
 * Check if a model has a megapixel limit.
 */
export function hasPixelLimit(modelId: string): boolean {
  const constraints = getModelConstraints(modelId)
  return constraints.maxPixels < Infinity
}

/**
 * Flux-optimized aspect ratio presets (all < 1MP).
 */
export const FLUX_ASPECT_RATIOS: readonly AspectRatioOption[] = [
  { label: "Square", value: "1:1", width: 1000, height: 1000, icon: "square", category: "square" },
  { label: "Landscape", value: "16:9", width: 1360, height: 768, icon: "rectangle-horizontal", category: "landscape" },
  { label: "Portrait", value: "9:16", width: 768, height: 1360, icon: "rectangle-vertical", category: "portrait" },
  { label: "Photo", value: "4:3", width: 1152, height: 864, icon: "image", category: "landscape" },
  { label: "Portrait Photo", value: "3:4", width: 864, height: 1152, icon: "frame", category: "portrait" },
  { label: "Photo Wide", value: "3:2", width: 1248, height: 832, icon: "image", category: "landscape" },
  { label: "Photo Tall", value: "2:3", width: 832, height: 1248, icon: "frame", category: "portrait" },
  { label: "Social", value: "4:5", width: 896, height: 1120, icon: "smartphone", category: "portrait" },
  { label: "Social Wide", value: "5:4", width: 1120, height: 896, icon: "monitor", category: "landscape" },
  { label: "Ultrawide", value: "21:9", width: 1536, height: 640, icon: "monitor", category: "ultrawide" },
  { label: "Ultra Tall", value: "9:21", width: 640, height: 1536, icon: "smartphone", category: "ultrawide" },
  { label: "Custom", value: "custom", width: 1000, height: 1000, icon: "sliders", category: "square" },
] as const

/**
 * Get aspect ratio presets for a specific model.
 */
export function getModelAspectRatios(modelId: string): readonly AspectRatioOption[] {
  // All Flux variants use the same presets
  if (CONSTRAINTS_MAP.has(modelId)) {
    return FLUX_ASPECT_RATIOS
  }
  // Import default ratios for other models
  // This avoids circular imports by lazy importing
  return require("@/lib/image-models").ASPECT_RATIOS
}
```

---

### 4. Dimension Constraints Hook

A custom hook that calculates dynamic slider bounds based on model constraints.

```typescript
// hooks/use-dimension-constraints.ts

import { useMemo, useCallback } from "react"
import { getModelConstraints } from "@/lib/config/model-constraints"
import type { ModelConstraints } from "@/types/pollinations"

interface UseDimensionConstraintsProps {
  modelId: string
  width: number
  height: number
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
}

interface DimensionConstraintsResult {
  /** Current model constraints */
  constraints: ModelConstraints
  /** Computed max width based on current height and pixel limit */
  maxWidth: number
  /** Computed max height based on current width and pixel limit */
  maxHeight: number
  /** Whether sliders should be enabled */
  isEnabled: boolean
  /** Current pixel count */
  pixelCount: number
  /** Whether current dimensions exceed the limit */
  isOverLimit: boolean
  /** Handle width change with auto-clamping */
  handleWidthChange: (newWidth: number) => void
  /** Handle height change with auto-clamping */
  handleHeightChange: (newHeight: number) => void
}

/**
 * Hook for managing dimension constraints based on model limits.
 * Automatically calculates dynamic slider bounds to prevent exceeding pixel limits.
 */
export function useDimensionConstraints({
  modelId,
  width,
  height,
  onWidthChange,
  onHeightChange,
}: UseDimensionConstraintsProps): DimensionConstraintsResult {
  const constraints = useMemo(() => getModelConstraints(modelId), [modelId])

  const { maxWidth, maxHeight, pixelCount, isOverLimit } = useMemo(() => {
    const { maxPixels, maxDimension } = constraints
    const pixels = width * height

    return {
      // Dynamic max: minimum of (absolute max, pixels remaining / other dimension)
      maxWidth: Math.min(maxDimension, Math.floor(maxPixels / height)),
      maxHeight: Math.min(maxDimension, Math.floor(maxPixels / width)),
      pixelCount: pixels,
      isOverLimit: pixels >= maxPixels,
    }
  }, [constraints, width, height])

  const alignToStep = useCallback(
    (value: number) => Math.round(value / constraints.step) * constraints.step,
    [constraints.step]
  )

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      const aligned = alignToStep(newWidth)
      const clamped = Math.min(aligned, maxWidth)
      onWidthChange(Math.max(constraints.minDimension, clamped))

      // Auto-clamp height if it would exceed pixel limit
      const newMaxHeight = Math.floor(constraints.maxPixels / clamped)
      if (height > newMaxHeight) {
        const clampedHeight = alignToStep(Math.min(height, newMaxHeight))
        onHeightChange(Math.max(constraints.minDimension, clampedHeight))
      }
    },
    [alignToStep, maxWidth, height, constraints, onWidthChange, onHeightChange]
  )

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      const aligned = alignToStep(newHeight)
      const clamped = Math.min(aligned, maxHeight)
      onHeightChange(Math.max(constraints.minDimension, clamped))

      // Auto-clamp width if it would exceed pixel limit
      const newMaxWidth = Math.floor(constraints.maxPixels / clamped)
      if (width > newMaxWidth) {
        const clampedWidth = alignToStep(Math.min(width, newMaxWidth))
        onWidthChange(Math.max(constraints.minDimension, clampedWidth))
      }
    },
    [alignToStep, maxHeight, width, constraints, onWidthChange, onHeightChange]
  )

  return {
    constraints,
    maxWidth,
    maxHeight,
    isEnabled: constraints.dimensionsEnabled,
    pixelCount,
    isOverLimit,
    handleWidthChange,
    handleHeightChange,
  }
}
```

---

### 5. Update DimensionControls Component

Enhance the existing component to accept model-aware constraints.

```tsx
// components/studio/controls/dimension-controls.tsx - MODIFY existing component

"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDimensionConstraints } from "@/hooks/use-dimension-constraints"
import { cn } from "@/lib/utils"
import { AlertTriangle, Link, Ruler, Unlink } from "lucide-react"
import * as React from "react"

export interface DimensionControlsProps {
  /** Current width value */
  width: number
  /** Current height value */
  height: number
  /** Callback when width changes */
  onWidthChange: (width: number) => void
  /** Callback when height changes */
  onHeightChange: (height: number) => void
  /** Model ID for constraint lookup */
  modelId: string
  /** Whether inputs are disabled */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

export const DimensionControls = React.memo(function DimensionControls({
  width,
  height,
  onWidthChange,
  onHeightChange,
  modelId,
  disabled = false,
  className,
}: DimensionControlsProps) {
  const [linked, setLinked] = React.useState(false)
  const aspectRatio = React.useRef(width / height)

  // Get model-specific constraints
  const {
    constraints,
    maxWidth,
    maxHeight,
    isEnabled,
    pixelCount,
    isOverLimit,
    handleWidthChange: constrainedWidthChange,
    handleHeightChange: constrainedHeightChange,
  } = useDimensionConstraints({
    modelId,
    width,
    height,
    onWidthChange,
    onHeightChange,
  })

  // Update aspect ratio when linking
  React.useEffect(() => {
    if (linked) {
      aspectRatio.current = width / height
    }
  }, [linked, width, height])

  const handleWidthSlider = (values: number[]) => {
    const newWidth = values[0]
    constrainedWidthChange(newWidth)

    if (linked) {
      const newHeight = Math.round(newWidth / aspectRatio.current / constraints.step) * constraints.step
      constrainedHeightChange(Math.max(constraints.minDimension, newHeight))
    }
  }

  const handleHeightSlider = (values: number[]) => {
    const newHeight = values[0]
    constrainedHeightChange(newHeight)

    if (linked) {
      const newWidth = Math.round(newHeight * aspectRatio.current / constraints.step) * constraints.step
      constrainedWidthChange(Math.max(constraints.minDimension, newWidth))
    }
  }

  const handleWidthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      handleWidthSlider([value])
    }
  }

  const handleHeightInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      handleHeightSlider([value])
    }
  }

  if (!isEnabled) {
    return null
  }

  const megapixels = (pixelCount / 1_000_000).toFixed(2)
  const hasPixelLimit = constraints.maxPixels < Infinity
  const percentOfLimit = hasPixelLimit
    ? ((pixelCount / constraints.maxPixels) * 100).toFixed(0)
    : null

  return (
    <div className={cn("space-y-3", className)} data-testid="dimension-controls">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Ruler className="h-3.5 w-3.5 text-primary" />
          Dimensions
        </Label>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs",
              isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
            )}
            data-testid="megapixels"
          >
            {megapixels} MP
            {percentOfLimit && ` (${percentOfLimit}%)`}
          </span>
          {isOverLimit && (
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>
                Exceeds model limit. Image will be auto-scaled.
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={linked ? "secondary" : "ghost"}
                size="icon"
                className="h-6 w-6"
                onClick={() => setLinked(!linked)}
                disabled={disabled}
                data-testid="link-toggle"
              >
                {linked ? (
                  <Link className="h-3.5 w-3.5" />
                ) : (
                  <Unlink className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {linked ? "Unlink dimensions" : "Link dimensions"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Width Control */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="width" className="text-xs text-muted-foreground">
            Width
          </Label>
          <div className="flex items-center gap-1">
            <Input
              id="width"
              type="number"
              value={width}
              onChange={handleWidthInput}
              min={constraints.minDimension}
              max={maxWidth}
              step={constraints.step}
              disabled={disabled}
              className="h-6 w-16 text-xs text-right px-1.5"
              data-testid="width-input"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>
        <Slider
          value={[width]}
          onValueChange={handleWidthSlider}
          min={constraints.minDimension}
          max={maxWidth}
          step={constraints.step}
          disabled={disabled}
          className="py-1"
          data-testid="width-slider"
        />
      </div>

      {/* Height Control */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="height" className="text-xs text-muted-foreground">
            Height
          </Label>
          <div className="flex items-center gap-1">
            <Input
              id="height"
              type="number"
              value={height}
              onChange={handleHeightInput}
              min={constraints.minDimension}
              max={maxHeight}
              step={constraints.step}
              disabled={disabled}
              className="h-6 w-16 text-xs text-right px-1.5"
              data-testid="height-input"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>
        <Slider
          value={[height]}
          onValueChange={handleHeightSlider}
          min={constraints.minDimension}
          max={maxHeight}
          step={constraints.step}
          disabled={disabled}
          className="py-1"
          data-testid="height-slider"
        />
      </div>
    </div>
  )
})
```

---

### 6. Integration with useStudioClientShell

Update the main studio hook to pass model context and handle model changes.

```typescript
// hooks/use-studio-client-shell.ts - KEY CHANGES to integrate

import { getModelConstraints, getModelAspectRatios } from "@/lib/config/model-constraints"

// Inside useStudioClientShell():

// When model changes, update dimensions to model's defaults if current exceeds limits
const handleModelChange = React.useCallback((newModel: ImageModel) => {
  setModel(newModel)
  
  const constraints = getModelConstraints(newModel)
  const currentPixels = width * height
  
  // If current dimensions exceed new model's limit, reset to defaults
  if (currentPixels >= constraints.maxPixels) {
    setWidth(constraints.defaultDimensions.width)
    setHeight(constraints.defaultDimensions.height)
    setAspectRatio("1:1")
  }
}, [width, height])

// Get model-specific aspect ratios for the selector
const aspectRatios = React.useMemo(
  () => getModelAspectRatios(model),
  [model]
)

// In return object, add:
return {
  // ... existing
  handleModelChange,
  aspectRatios,
}
```

---

### 7. Update AspectRatioSelector Usage

The component already accepts `ratios` prop — just pass model-specific ratios:

```tsx
// In StudioClientShell.tsx or wherever AspectRatioSelector is rendered:

<AspectRatioSelector
  selectedRatio={aspectRatio}
  onRatioChange={handleAspectRatioChange}
  ratios={aspectRatios}  // Now model-specific!
  disabled={isGenerating}
/>
```

---

### 8. Update DimensionControls Usage

Pass the model ID to enable constraint-aware behavior:

```tsx
// In StudioClientShell.tsx or wherever DimensionControls is rendered:

<DimensionControls
  width={width}
  height={height}
  onWidthChange={handleWidthChange}
  onHeightChange={handleHeightChange}
  modelId={model}  // NEW: enables model-aware constraints
  disabled={isGenerating}
/>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `types/pollinations.ts` | Add `ModelConstraints` interface, extend `AspectRatio` type |
| `lib/config/model-constraints.ts` | **NEW** — Central model constraints configuration |
| `hooks/use-dimension-constraints.ts` | **NEW** — Dimension constraint calculation hook |
| `components/studio/controls/dimension-controls.tsx` | Add `modelId` prop, integrate constraints hook |
| `hooks/use-studio-client-shell.ts` | Add `handleModelChange`, pass model-specific ratios |
| `lib/image-models.ts` | Update default `ASPECT_RATIOS` to safe dimensions |

---

## Testing Checklist

- [ ] Verify 1000×1000 produces images without scaling on Flux models
- [ ] Verify slider max dynamically adjusts as other dimension changes
- [ ] Verify 1024×1024 cannot be reached via sliders on Flux models
- [ ] Verify all Flux preset resolutions produce images without scaling
- [ ] Verify switching to Flux auto-resets dimensions if over limit
- [ ] Verify switching to non-Flux model restores full dimension range
- [ ] Verify percentage indicator shows in UI for pixel-limited models
- [ ] Verify warning icon appears when approaching/exceeding limit

---

## Related Documents

- [FLUX_DIMENSION_LIMITS.md](../FLUX_DIMENSION_LIMITS.md)
