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
import { Sparkles, Dice6, Lock, Shield } from "lucide-react"
import type { ImageGenerationParams, AspectRatio } from "@/types/pollinations"
import { IMAGE_MODELS, ASPECT_RATIOS, DEFAULT_DIMENSIONS } from "@/lib/image-models"
import { PollinationsAPI } from "@/lib/pollinations-api"

interface GenerationControlsProps {
  onGenerate: (params: ImageGenerationParams) => void
  isGenerating: boolean
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

  return (
    <Card className="p-6 space-y-6 bg-card/50 backdrop-blur border-border/50">
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
          className="min-h-24 resize-none bg-background/50"
          disabled={isGenerating}
        />
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model" className="text-sm font-medium">
          Model
        </Label>
        <Select value={model} onValueChange={setModel} disabled={isGenerating}>
          <SelectTrigger id="model" className="bg-background/50">
            <SelectValue />
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
            {ASPECT_RATIOS.map((ratio) => (
              <SelectItem key={ratio.value} value={ratio.value}>
                {ratio.label} {ratio.value !== "custom" && `(${ratio.width}×${ratio.height})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width" className="text-sm font-medium">
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
            className="py-4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height" className="text-sm font-medium">
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
            className="py-4"
          />
        </div>
      </div>

      {/* Seed Control */}
      <div className="space-y-2">
        <Label htmlFor="seed" className="text-sm font-medium">
          Seed (Random: -1)
        </Label>
        <div className="flex gap-2">
          <Input
            id="seed"
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number.parseInt(e.target.value) || -1)}
            min={-1}
            max={2147483647}
            className="bg-background/50"
            disabled={isGenerating}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRandomSeed}
            disabled={isGenerating}
            title="Generate random seed"
          >
            <Dice6 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <h3 className="text-sm font-medium">Advanced Options</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="enhance" className="text-sm font-normal cursor-pointer">
              AI Prompt Enhancement
            </Label>
          </div>
          <Switch id="enhance" checked={enhance} onCheckedChange={setEnhance} disabled={isGenerating} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="private" className="text-sm font-normal cursor-pointer">
              Private (Hide from feed)
            </Label>
          </div>
          <Switch id="private" checked={privateGen} onCheckedChange={setPrivateGen} disabled={isGenerating} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="safe" className="text-sm font-normal cursor-pointer">
              Strict Safety Filter
            </Label>
          </div>
          <Switch id="safe" checked={safe} onCheckedChange={setSafe} disabled={isGenerating} />
        </div>
      </div>

      {/* Generate Button */}
      <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full" size="lg">
        {isGenerating ? "Generating..." : "Generate Image"}
      </Button>
    </Card>
  )
}
