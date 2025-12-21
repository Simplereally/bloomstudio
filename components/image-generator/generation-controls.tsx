"use client"

// Component following SRP - Only handles parameter controls UI

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Sparkles,
  Dice6,
  Lock,
  Shield,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  ImageIcon,
  Frame,
  Monitor,
  SlidersHorizontal,
  Loader2,
} from "lucide-react"
import type { ImageGenerationParams, AspectRatio, ImageModel } from "@/types/pollinations"
import { IMAGE_MODELS, ASPECT_RATIOS, DEFAULT_DIMENSIONS } from "@/lib/image-models"
import { useGenerationControls } from "@/hooks/use-generation-controls"

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
    enhance,
    setEnhance,
    privateGen,
    setPrivateGen,
    safe,
    setSafe,
    handleGenerate,
    currentModel,
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
        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model" className="text-sm font-medium">
            Model
          </Label>
          <Select value={model} onValueChange={(v) => setModel(v as ImageModel)} disabled={isGenerating}>
            <SelectTrigger id="model" data-testid="model-select" className="bg-background/50">
              <SelectValue>
                <span className="font-medium text-sm">{currentModel?.name}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {IMAGE_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} data-testid={`model-item-${m.id}`}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <div className="space-y-3 pt-3 border-t border-border/50">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Options</h3>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <Label htmlFor="enhance" className="text-sm font-normal cursor-pointer">
                AI Enhancement
              </Label>
            </div>
            <Switch
              id="enhance"
              data-testid="enhance-switch"
              checked={enhance}
              onCheckedChange={setEnhance}
              disabled={isGenerating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-accent" />
              <Label htmlFor="private" className="text-sm font-normal cursor-pointer">
                Private
              </Label>
            </div>
            <Switch
              id="private"
              data-testid="private-switch"
              checked={privateGen}
              onCheckedChange={setPrivateGen}
              disabled={isGenerating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-chart-4" />
              <Label htmlFor="safe" className="text-sm font-normal cursor-pointer">
                Safety Filter
              </Label>
            </div>
            <Switch
              id="safe"
              data-testid="safe-switch"
              checked={safe}
              onCheckedChange={setSafe}
              disabled={isGenerating}
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        data-testid="generate-button"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className={`w-full relative overflow-hidden transition-all duration-300 ${isGenerating ? "opacity-90 saturate-[0.8]" : ""}`}
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
    </Card>
  )
}
