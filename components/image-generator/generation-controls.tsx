"use client"

// Component following SRP - Only handles parameter controls UI

import { useState } from "react"
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
} from "lucide-react"
import type { ImageGenerationParams, AspectRatio } from "@/types/pollinations"
import { IMAGE_MODELS, ASPECT_RATIOS, DEFAULT_DIMENSIONS } from "@/lib/image-models"
import { PollinationsAPI } from "@/lib/pollinations-api"

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
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState<string>("flux")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1")
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [seed, setSeed] = useState(-1)
  const [enhance, setEnhance] = useState(false)
  const [privateGen, setPrivateGen] = useState(false)
  const [safe, setSafe] = useState(false)

  const handleAspectRatioChange = (value: AspectRatio) => {
    setAspectRatio(value)
    if (value !== "custom") {
      const ratio = ASPECT_RATIOS.find((r) => r.value === value)
      if (ratio) {
        setWidth(ratio.width)
        setHeight(ratio.height)
      }
    }
  }

  const handleWidthChange = (value: number[]) => {
    const roundedWidth = PollinationsAPI.roundDimension(value[0])
    setWidth(roundedWidth)
    setAspectRatio("custom")
  }

  const handleHeightChange = (value: number[]) => {
    const roundedHeight = PollinationsAPI.roundDimension(value[0])
    setHeight(roundedHeight)
    setAspectRatio("custom")
  }

  const handleRandomSeed = () => {
    setSeed(PollinationsAPI.generateRandomSeed())
  }

  const handleGenerate = () => {
    if (!prompt.trim()) return

    const params: ImageGenerationParams = {
      prompt: prompt.trim(),
      model: model as any,
      width,
      height,
      seed: seed === -1 ? undefined : seed,
      enhance,
      private: privateGen,
      safe,
    }

    onGenerate(params)
  }

  const currentModel = IMAGE_MODELS.find((m) => m.id === model)

  return (
    <Card className="p-4 space-y-4 bg-card/50 backdrop-blur border-border/50">
      {/* Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-sm font-medium">
          Prompt
        </Label>
        <Textarea
          id="prompt"
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
          <Select value={model} onValueChange={setModel} disabled={isGenerating}>
            <SelectTrigger id="model" className="bg-background/50">
              <SelectValue>
                <span className="font-medium text-sm">{currentModel?.name}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {IMAGE_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
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
            <SelectTrigger id="aspect-ratio" className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIOS.map((ratio) => {
                const IconComponent = ICON_MAP[ratio.icon as keyof typeof ICON_MAP]
                return (
                  <SelectItem key={ratio.value} value={ratio.value}>
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
            <Switch id="enhance" checked={enhance} onCheckedChange={setEnhance} disabled={isGenerating} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-accent" />
              <Label htmlFor="private" className="text-sm font-normal cursor-pointer">
                Private
              </Label>
            </div>
            <Switch id="private" checked={privateGen} onCheckedChange={setPrivateGen} disabled={isGenerating} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-chart-4" />
              <Label htmlFor="safe" className="text-sm font-normal cursor-pointer">
                Safety Filter
              </Label>
            </div>
            <Switch id="safe" checked={safe} onCheckedChange={setSafe} disabled={isGenerating} />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full" size="lg">
        {isGenerating ? "Generating..." : "Generate Image"}
      </Button>
    </Card>
  )
}
