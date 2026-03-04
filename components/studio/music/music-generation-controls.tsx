/**
 * MusicGenerationControls — Parameter panel for music generation
 *
 * Surfaces all meaningful API options as clean, ergonomic controls:
 * - Model selector (Suno vs ElevenLabs Music)
 * - Duration slider with presets (ElevenLabs only)
 * - Instrumental toggle (ElevenLabs only)
 *
 * Design language matches the image/video studio controls:
 * - CollapsibleSection wrappers for each group
 * - Consistent icon sizing, label typography, and spacing
 * - Switch / ToggleGroup patterns from video-settings-panel & options-panel
 *
 * Architecture:
 * - Pure presentational component: options in → UI out
 * - No data fetching or API calls
 * - Delegates all state changes to parent via onOptionsChange
 */

"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  MUSIC_MODEL_META,
  MUSIC_PROVIDER_META,
  MUSIC_PROVIDERS,
  ELEVENMUSIC_DURATION_RANGE,
  type MusicProvider,
  type MusicModel,
  formatMusicDuration,
} from "@/lib/music-api"
import type { MusicGenerationOptions } from "@/hooks/use-music-generation"
import {
  Clock,
  Guitar,
} from "lucide-react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import * as React from "react"

// ============================================================================
// Types
// ============================================================================

export interface MusicGenerationControlsProps {
  /** Current generation options */
  options: MusicGenerationOptions
  /** Callback when any option changes */
  onOptionsChange: (options: Partial<MusicGenerationOptions>) => void
  /** Whether controls are disabled (e.g. during generation) */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

import Image from "next/image"

const PROVIDER_ICONS: Record<MusicProvider, React.ReactNode> = {
  suno: (
    <div className="relative w-4 h-4">
      <Image
        src="/music-providers/suno.png"
        alt="Suno"
        fill
        className="object-contain"
      />
    </div>
  ),
  elevenlabs: (
    <div className="relative w-4 h-4">
      <Image
        src="/music-providers/elevenlabs.svg"
        alt="ElevenLabs"
        fill
        className="object-contain dark:invert"
      />
    </div>
  ),
}

/** Duration preset buttons for quick selection */
const DURATION_PRESETS = [15, 30, 60, 120, 180] as const

// ============================================================================
// Sub-components
// ============================================================================

function ProviderSelector({
  selectedProvider,
  onProviderChange,
  disabled,
}: {
  selectedProvider: MusicProvider
  onProviderChange: (provider: MusicProvider) => void
  disabled?: boolean
}) {
  return (
    <RadioGroupPrimitive.Root
      className="grid grid-cols-2 gap-1.5"
      value={selectedProvider}
      onValueChange={(value) => onProviderChange(value as MusicProvider)}
      disabled={disabled}
      orientation="horizontal"
      loop
      aria-label="Music generation provider"
      data-testid="provider-selector"
    >
      {MUSIC_PROVIDERS.map((provider) => {
        const meta = MUSIC_PROVIDER_META[provider]
        const icon = PROVIDER_ICONS[provider]
        const isSelected = selectedProvider === provider

        return (
          <RadioGroupPrimitive.Item
            key={provider}
            value={provider}
            aria-label={`${meta.label} provider`}
            className={cn(
              "h-10 px-2 gap-2 flex items-center justify-start rounded-md border transition-all text-left",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
              "disabled:opacity-50 disabled:pointer-events-none",
              isSelected
                ? "bg-primary/10 text-primary border-primary/30 ring-1 ring-primary/20 shadow-sm"
                : "border-border/40 bg-transparent hover:border-foreground/30 hover:bg-accent/20",
            )}
            data-testid={`provider-button-${provider}`}
          >
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-colors",
                isSelected
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <span
                className={cn(
                  "text-xs font-semibold tracking-tight truncate block",
                  isSelected ? "text-primary" : "text-foreground",
                )}
              >
                {meta.label}
              </span>
            </div>
          </RadioGroupPrimitive.Item>
        )
      })}
    </RadioGroupPrimitive.Root>
  )
}

function DurationControl({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (duration: number) => void
  disabled?: boolean
}) {
  const { min, max } = ELEVENMUSIC_DURATION_RANGE

  return (
    <div
      className={cn(
        "py-3 px-3",
        disabled && "opacity-50 pointer-events-none",
      )}
      data-testid="duration-control"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/15 text-primary">
          <Clock className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col">
          <Label className="text-sm font-medium leading-none">Duration</Label>
          <span className="text-xs text-muted-foreground mt-0.5">
            {min}–{max} seconds
          </span>
        </div>
        <span className="ml-auto text-sm font-medium text-foreground tabular-nums">
          {formatMusicDuration(value)}
        </span>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={1}
          disabled={disabled}
          className="w-full"
          aria-label="Track duration"
          data-testid="duration-slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{formatMusicDuration(min)}</span>
          <span>{formatMusicDuration(max)}</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-1.5 mt-3">
        {DURATION_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            disabled={disabled}
            aria-label={`Set duration to ${preset} seconds`}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[11px] font-medium tabular-nums transition-all duration-150",
              "border",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              value === preset
                ? "bg-primary/15 text-primary border-primary/30"
                : "border-border/40 bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40",
            )}
          >
            {formatMusicDuration(preset)}
          </button>
        ))}
      </div>
    </div>
  )
}

function InstrumentalControl({
  instrumental,
  onChange,
  disabled,
}: {
  instrumental: boolean
  onChange: (instrumental: boolean) => void
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2.5 px-3",
        disabled && "opacity-50",
      )}
      data-testid="instrumental-control"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md transition-colors",
            instrumental
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Guitar className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col">
          <Label
            htmlFor="instrumental-toggle"
            className="text-sm font-medium cursor-pointer leading-none"
          >
            Instrumental
          </Label>
          <span className="text-xs text-muted-foreground mt-0.5">
            {instrumental ? "No vocals, instruments only" : "Include vocals in output"}
          </span>
        </div>
      </div>
      <Switch
        id="instrumental-toggle"
        checked={instrumental}
        onCheckedChange={onChange}
        disabled={disabled}
        data-testid="instrumental-switch"
      />
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function MusicGenerationControls({
  options,
  onOptionsChange,
  disabled = false,
  className,
}: MusicGenerationControlsProps) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* 1. Provider Selection (Primary Choice) */}
      <div className="space-y-2.5">
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-0.5">
          Music Provider
        </Label>
        <ProviderSelector
          selectedProvider={options.provider}
          onProviderChange={(provider) => {
            const newModel = MUSIC_PROVIDER_META[provider].models[0]
            onOptionsChange({ provider, model: newModel, instrumental: false })
          }}
          disabled={disabled}
        />
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed px-0.5 mt-1">
          {MUSIC_PROVIDER_META[options.provider].description}
        </p>
      </div>

      {/* 2. Global Settings (Stable Layout Position) */}
      <div className="space-y-2.5">
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-0.5">
          General Settings
        </Label>
        <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden shadow-sm">
          <InstrumentalControl
            instrumental={options.instrumental}
            onChange={(instrumental) => onOptionsChange({ instrumental })}
            disabled={disabled}
          />
        </div>
      </div>

      {/* 3. Provider-Specific Settings (Model Versions / Duration) */}
      <div className="space-y-2.5">
        <Label id="provider-settings-label" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-0.5">
          {options.provider === "elevenlabs" ? "Generation Settings" : "Model Version"}
        </Label>
        
        <div className="relative min-h-[40px]">
          {/* Suno Model Selector */}
          {options.provider === "suno" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <RadioGroupPrimitive.Root
                className="grid grid-cols-2 gap-1.5"
                value={options.model}
                onValueChange={(value) => onOptionsChange({ model: value as MusicModel })}
                disabled={disabled}
                orientation="horizontal"
                loop
                aria-labelledby="provider-settings-label"
              >
                {MUSIC_PROVIDER_META.suno.models.map((model) => {
                  const meta = MUSIC_MODEL_META[model]
                  const isSelected = options.model === model
                  return (
                    <RadioGroupPrimitive.Item
                      key={model}
                      value={model}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-medium transition-all text-center",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background border-border/40 text-muted-foreground hover:text-foreground hover:border-foreground/30",
                      )}
                    >
                      {meta.label}
                    </RadioGroupPrimitive.Item>
                  )
                })}
              </RadioGroupPrimitive.Root>
            </div>
          )}

          {/* ElevenLabs Duration Control */}
          {options.provider === "elevenlabs" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden shadow-sm">
                <DurationControl
                  value={options.duration}
                  onChange={(duration) => onOptionsChange({ duration })}
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
