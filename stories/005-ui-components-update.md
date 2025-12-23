# Story 005: Update UI Components for New API Features

## Overview
Update React components to expose new API capabilities including quality settings, transparent backgrounds, guidance scale, and dynamic model selection.

## Priority: Medium
## Estimated Effort: 5 hours
## Dependencies: Story 001-004

---

## Background

The new `gen.pollinations.ai` API introduces several new parameters that should be exposed in the UI:
- **Quality**: low, medium, high, hd
- **Transparent**: Generate with transparent background
- **Guidance Scale**: How closely to follow the prompt (1-20)
- **Dynamic Models**: Fetch and display available models from API
- **NoLogo**: Option to remove Pollinations watermark

---

## Technical Specification

### Stack Requirements
- **React**: 19.2
- **Next.js**: 16.1.0
- **shadcn/ui**: Components library
- **TanStack Query**: v5.9

### Files to Modify

#### [MODIFY] `hooks/use-generation-controls.ts`
Add new state for quality, transparent, guidance_scale.

#### [MODIFY] `components/image-generator/generation-controls.tsx`
Add UI for new parameters.

### Files to Create

#### [NEW] `components/image-generator/quality-selector.tsx`
Quality dropdown component.

#### [NEW] `components/image-generator/advanced-settings.tsx`
Collapsible advanced settings panel.

#### [NEW] `components/image-generator/model-selector.tsx`
Dynamic model selector using useImageModels hook.

---

## Implementation Details

### 1. Update Generation Controls Hook

```typescript
// hooks/use-generation-controls.ts
import { useState, useCallback } from "react"
import type {
  ImageGenerationParams,
  Quality,
  ImageModel,
} from "@/lib/schemas/pollinations.schema"
import type { AspectRatio } from "@/types/pollinations"
import { ASPECT_RATIOS } from "@/lib/image-models"
import { PollinationsAPI } from "@/lib/pollinations-api"
import { POLLINATIONS_CONFIG } from "@/lib/config/api.config"

export interface UseGenerationControlsProps {
  onGenerate: (params: ImageGenerationParams) => void
}

export interface GenerationControlsState {
  prompt: string
  negativePrompt: string
  model: ImageModel
  aspectRatio: AspectRatio
  width: number
  height: number
  seed: number
  quality: Quality
  enhance: boolean
  transparent: boolean
  guidanceScale: number | undefined
  nologo: boolean
  privateGen: boolean
  safe: boolean
}

export function useGenerationControls({ onGenerate }: UseGenerationControlsProps) {
  // Basic settings
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [model, setModel] = useState<ImageModel>("flux")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1")
  const [width, setWidth] = useState(POLLINATIONS_CONFIG.DEFAULTS.WIDTH)
  const [height, setHeight] = useState(POLLINATIONS_CONFIG.DEFAULTS.HEIGHT)
  const [seed, setSeed] = useState(-1)

  // New API parameters
  const [quality, setQuality] = useState<Quality>("medium")
  const [enhance, setEnhance] = useState(false)
  const [transparent, setTransparent] = useState(false)
  const [guidanceScale, setGuidanceScale] = useState<number | undefined>(undefined)
  const [nologo, setNologo] = useState(false)
  const [privateGen, setPrivateGen] = useState(false)
  const [safe, setSafe] = useState(false)

  // Advanced settings visibility
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleAspectRatioChange = useCallback((value: AspectRatio) => {
    setAspectRatio(value)
    if (value !== "custom") {
      const ratio = ASPECT_RATIOS.find((r) => r.value === value)
      if (ratio) {
        setWidth(ratio.width)
        setHeight(ratio.height)
      }
    }
  }, [])

  const handleWidthChange = useCallback((value: number[]) => {
    const roundedWidth = PollinationsAPI.roundDimension(value[0])
    setWidth(roundedWidth)
    setAspectRatio("custom")
  }, [])

  const handleHeightChange = useCallback((value: number[]) => {
    const roundedHeight = PollinationsAPI.roundDimension(value[0])
    setHeight(roundedHeight)
    setAspectRatio("custom")
  }, [])

  const handleRandomSeed = useCallback(() => {
    setSeed(PollinationsAPI.generateRandomSeed())
  }, [])

  const handleGuidanceScaleChange = useCallback((value: number[]) => {
    setGuidanceScale(value[0])
  }, [])

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return

    const params: ImageGenerationParams = {
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      model,
      width,
      height,
      seed: seed === -1 ? undefined : seed,
      quality,
      enhance,
      transparent,
      guidance_scale: guidanceScale,
      nologo,
      private: privateGen,
      safe,
    }

    onGenerate(params)
  }, [
    prompt, negativePrompt, model, width, height, seed,
    quality, enhance, transparent, guidanceScale, nologo,
    privateGen, safe, onGenerate
  ])

  const resetToDefaults = useCallback(() => {
    setPrompt("")
    setNegativePrompt("")
    setModel("flux")
    setAspectRatio("1:1")
    setWidth(POLLINATIONS_CONFIG.DEFAULTS.WIDTH)
    setHeight(POLLINATIONS_CONFIG.DEFAULTS.HEIGHT)
    setSeed(-1)
    setQuality("medium")
    setEnhance(false)
    setTransparent(false)
    setGuidanceScale(undefined)
    setNologo(false)
    setPrivateGen(false)
    setSafe(false)
  }, [])

  return {
    // Basic state
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    model,
    setModel,
    aspectRatio,
    handleAspectRatioChange,
    width,
    handleWidthChange,
    height,
    handleHeightChange,
    seed,
    setSeed,
    handleRandomSeed,

    // New parameters
    quality,
    setQuality,
    enhance,
    setEnhance,
    transparent,
    setTransparent,
    guidanceScale,
    handleGuidanceScaleChange,
    nologo,
    setNologo,
    privateGen,
    setPrivateGen,
    safe,
    setSafe,

    // UI state
    showAdvanced,
    setShowAdvanced,

    // Actions
    handleGenerate,
    resetToDefaults,
  }
}
```

### 2. Create Quality Selector Component

```tsx
// components/image-generator/quality-selector.tsx
"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Quality } from "@/lib/schemas/pollinations.schema"

interface QualitySelectorProps {
  value: Quality
  onChange: (value: Quality) => void
  disabled?: boolean
}

const QUALITY_OPTIONS = [
  { value: "low", label: "Low", description: "Faster generation" },
  { value: "medium", label: "Medium", description: "Balanced quality" },
  { value: "high", label: "High", description: "Better details" },
  { value: "hd", label: "HD", description: "Best quality" },
] as const satisfies readonly { value: Quality; label: string; description: string }[]

export function QualitySelector({
  value,
  onChange,
  disabled = false,
}: QualitySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="quality">Quality</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="quality" className="w-full">
          <SelectValue placeholder="Select quality" />
        </SelectTrigger>
        <SelectContent>
          {QUALITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between gap-2">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

### 3. Create Model Selector Component

```tsx
// components/image-generator/model-selector.tsx
"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useImageModels } from "@/hooks/queries"
import type { ImageModel } from "@/lib/schemas/pollinations.schema"

interface ModelSelectorProps {
  value: string
  onChange: (value: ImageModel) => void
  disabled?: boolean
}

export function ModelSelector({
  value,
  onChange,
  disabled = false,
}: ModelSelectorProps) {
  const { models, isLoading, isFallback } = useImageModels()

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Model</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="model">Model</Label>
        {isFallback && (
          <Badge variant="outline" className="text-xs">
            Offline
          </Badge>
        )}
      </div>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as ImageModel)}
        disabled={disabled}
      >
        <SelectTrigger id="model" className="w-full">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.name} value={model.name}>
              <div className="flex flex-col">
                <span className="font-medium capitalize">{model.name}</span>
                {model.description && (
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

### 4. Create Advanced Settings Component

```tsx
// components/image-generator/advanced-settings.tsx  
"use client"

import { ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { POLLINATIONS_CONFIG } from "@/lib/config/api.config"

interface AdvancedSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  
  // Negative prompt
  negativePrompt: string
  onNegativePromptChange: (value: string) => void
  
  // Toggle options
  transparent: boolean
  onTransparentChange: (value: boolean) => void
  nologo: boolean
  onNologoChange: (value: boolean) => void
  enhance: boolean
  onEnhanceChange: (value: boolean) => void
  private: boolean
  onPrivateChange: (value: boolean) => void
  safe: boolean
  onSafeChange: (value: boolean) => void
  
  // Guidance scale
  guidanceScale: number | undefined
  onGuidanceScaleChange: (value: number[]) => void
}

export function AdvancedSettings({
  open,
  onOpenChange,
  negativePrompt,
  onNegativePromptChange,
  transparent,
  onTransparentChange,
  nologo,
  onNologoChange,
  enhance,
  onEnhanceChange,
  private: isPrivate,
  onPrivateChange,
  safe,
  onSafeChange,
  guidanceScale,
  onGuidanceScaleChange,
}: AdvancedSettingsProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-2"
          size="sm"
        >
          <span className="text-sm font-medium">Advanced Settings</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 pt-4">
        {/* Negative Prompt */}
        <div className="space-y-2">
          <Label htmlFor="negative-prompt">Negative Prompt</Label>
          <Textarea
            id="negative-prompt"
            placeholder="What to avoid in generation..."
            value={negativePrompt}
            onChange={(e) => onNegativePromptChange(e.target.value)}
            className="min-h-[60px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Default: &quot;worst quality, blurry&quot;
          </p>
        </div>

        <Separator />

        {/* Guidance Scale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Guidance Scale</Label>
            <span className="text-sm text-muted-foreground">
              {guidanceScale ?? "Auto"}
            </span>
          </div>
          <Slider
            value={[guidanceScale ?? 7]}
            onValueChange={onGuidanceScaleChange}
            min={POLLINATIONS_CONFIG.GUIDANCE_SCALE.MIN}
            max={POLLINATIONS_CONFIG.GUIDANCE_SCALE.MAX}
            step={0.5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            How closely to follow the prompt (1=loose, 20=strict)
          </p>
        </div>

        <Separator />

        {/* Toggle Options */}
        <div className="space-y-3">
          <SettingToggle
            id="transparent"
            label="Transparent Background"
            description="Generate PNG with transparency"
            checked={transparent}
            onCheckedChange={onTransparentChange}
          />
          
          <SettingToggle
            id="nologo"
            label="Remove Watermark"
            description="Remove Pollinations logo"
            checked={nologo}
            onCheckedChange={onNologoChange}
          />
          
          <SettingToggle
            id="enhance"
            label="Enhance Prompt"
            description="Let AI improve your prompt"
            checked={enhance}
            onCheckedChange={onEnhanceChange}
          />
          
          <SettingToggle
            id="private"
            label="Private Generation"
            description="Hide from public feeds"
            checked={isPrivate}
            onCheckedChange={onPrivateChange}
          />
          
          <SettingToggle
            id="safe"
            label="Safe Mode"
            description="Enable content safety filters"
            checked={safe}
            onCheckedChange={onSafeChange}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface SettingToggleProps {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function SettingToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
```

### 5. Update Generation Controls Component

```tsx
// components/image-generator/generation-controls.tsx
// Add new components and wire up state from hook

import { QualitySelector } from "./quality-selector"
import { ModelSelector } from "./model-selector"
import { AdvancedSettings } from "./advanced-settings"

// In the JSX, add:
// - ModelSelector using dynamic models
// - QualitySelector
// - AdvancedSettings collapsible panel
```

---

## Acceptance Criteria

- [ ] Quality selector with low/medium/high/hd options
- [ ] Model selector fetches from API dynamically
- [ ] Fallback indicator shown when using cached models
- [ ] Advanced settings panel with all new options
- [ ] Negative prompt textarea with placeholder text
- [ ] Guidance scale slider (1-20)
- [ ] Toggle switches for: transparent, nologo, enhance, private, safe
- [ ] All settings properly wired to useGenerationControls hook
- [ ] Form state resets correctly with resetToDefaults
- [ ] Components are accessible with proper labels

---

## Testing Requirements

### Component Tests

```typescript
// components/image-generator/quality-selector.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QualitySelector } from "./quality-selector"

describe("QualitySelector", () => {
  it("renders with current value", () => {
    render(<QualitySelector value="medium" onChange={vi.fn()} />)
    expect(screen.getByRole("combobox")).toHaveTextContent("Medium")
  })

  it("calls onChange when selection changes", async () => {
    const onChange = vi.fn()
    render(<QualitySelector value="medium" onChange={onChange} />)
    
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByText("HD"))
    
    expect(onChange).toHaveBeenCalledWith("hd")
  })
})
```

### Run Command
```bash
bun test components/image-generator/
```

---

## Related Stories
- Story 003: Dynamic Models Query (provides useImageModels)
- Story 004: TanStack Query Hooks (provides types)
