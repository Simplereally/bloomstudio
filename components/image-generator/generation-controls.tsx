"use client"

/**
 * GenerationControls Component
 *
 * Main form for configuring image generation parameters.
 * Composes smaller components following SRP for each settings group.
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Sparkles,
  Dice6,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  ImageIcon,
  Frame,
  Monitor,
  SlidersHorizontal,
  Loader2,
  RotateCcw,
} from "lucide-react"
import type { ImageGenerationParams, AspectRatio } from "@/types/pollinations"
import { ASPECT_RATIOS, DEFAULT_DIMENSIONS } from "@/lib/image-models"
import { useGenerationControls } from "@/hooks/use-generation-controls"
import { QualitySelector } from "./quality-selector"
import { ModelSelector } from "./model-selector"
import { AdvancedSettings } from "./advanced-settings"

interface GenerationControlsProps {
  onGenerate: (params: ImageGenerationParams) => void
  isGenerating: boolean
}

const ICON_MAP = {
  square: Square,
  "rectangle-horizontal": RectangleHorizontal,
  "rectangle-vertical": RectangleVertical,
  image: ImageIcon,
  frame: Frame,
  monitor: Monitor,
  sliders: SlidersHorizontal,
}

export function GenerationControls({ onGenerate, isGenerating }: GenerationControlsProps) {
  const {
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
    showAdvanced,
    setShowAdvanced,
    handleGenerate,
    resetToDefaults,
  } = useGenerationControls({ onGenerate })

  return (
    <Card className="p-4 space-y-4 bg-card/50 backdrop-blur border-border/50" data-testid="generation-controls">
      {/* Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-sm font-medium">
          Prompt
        </Label>
        <Textarea
          id="prompt"
          data-testid="prompt-input"
          placeholder="Describe the image you want to create..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-20 resize-none bg-background/50"
          disabled={isGenerating}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Model Selection - Dynamic from API */}
        <ModelSelector
          value={model}
          onChange={setModel}
          disabled={isGenerating}
        />

        {/* Quality Selection */}
        <QualitySelector
          value={quality}
          onChange={setQuality}
          disabled={isGenerating}
        />
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <Label htmlFor="aspect-ratio" className="text-sm font-medium">
          Aspect Ratio
        </Label>
        <Select
          value={aspectRatio}
          onValueChange={(v) => handleAspectRatioChange(v as AspectRatio)}
          disabled={isGenerating}
        >
          <SelectTrigger id="aspect-ratio" data-testid="aspect-ratio-select" className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASPECT_RATIOS.map((ratio) => {
              const IconComponent = ICON_MAP[ratio.icon as keyof typeof ICON_MAP]
              return (
                <SelectItem key={ratio.value} value={ratio.value} data-testid={`aspect-ratio-item-${ratio.value}`}>
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
                    <span>{ratio.label}</span>
                    {ratio.value !== "custom" && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({ratio.width}×{ratio.height})
                      </span>
                    )}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="width" className="text-xs font-medium">
            Width: {width}px
          </Label>
          <Slider
            id="width"
            data-testid="width-slider"
            min={DEFAULT_DIMENSIONS.MIN}
            max={DEFAULT_DIMENSIONS.MAX}
            step={DEFAULT_DIMENSIONS.STEP}
            value={[width]}
            onValueChange={handleWidthChange}
            disabled={isGenerating}
            className="py-3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height" className="text-xs font-medium">
            Height: {height}px
          </Label>
          <Slider
            id="height"
            data-testid="height-slider"
            min={DEFAULT_DIMENSIONS.MIN}
            max={DEFAULT_DIMENSIONS.MAX}
            step={DEFAULT_DIMENSIONS.STEP}
            value={[height]}
            onValueChange={handleHeightChange}
            disabled={isGenerating}
            className="py-3"
          />
        </div>
      </div>

      {/* Seed Control */}
      <div className="space-y-2">
        <Label htmlFor="seed" className="text-xs font-medium">
          Seed
        </Label>
        <div className="flex gap-2">
          <Input
            id="seed"
            data-testid="seed-input"
            type="number"
            placeholder="Random (-1)"
            value={seed === -1 ? "" : seed}
            onChange={(e) => setSeed(Number.parseInt(e.target.value) || -1)}
            min={-1}
            max={2147483647}
            className="bg-background/50 text-sm"
            disabled={isGenerating}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRandomSeed}
            disabled={isGenerating}
            title="Generate random seed"
            className="shrink-0 bg-transparent"
            data-testid="random-seed-button"
          >
            <Dice6 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Advanced Settings - Collapsible */}
      <div className="pt-3 border-t border-border/50">
        <AdvancedSettings
          open={showAdvanced}
          onOpenChange={setShowAdvanced}
          negativePrompt={negativePrompt}
          onNegativePromptChange={setNegativePrompt}
          transparent={transparent}
          onTransparentChange={setTransparent}
          nologo={nologo}
          onNologoChange={setNologo}
          enhance={enhance}
          onEnhanceChange={setEnhance}
          privateGen={privateGen}
          onPrivateChange={setPrivateGen}
          safe={safe}
          onSafeChange={setSafe}
          guidanceScale={guidanceScale}
          onGuidanceScaleChange={handleGuidanceScaleChange}
          disabled={isGenerating}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={resetToDefaults}
          disabled={isGenerating}
          title="Reset to defaults"
          className="shrink-0"
          data-testid="reset-button"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          data-testid="generate-button"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`flex-1 relative overflow-hidden transition-all duration-300 ${isGenerating ? "opacity-90 saturate-[0.8]" : ""}`}
          size="lg"
        >
          {isGenerating ? (
            <>
              <span className="relative z-10 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Crafting...
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            </>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Image
            </span>
          )}
        </Button>
      </div>
    </Card>
  )
}
