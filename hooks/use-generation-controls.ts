import { useState, useCallback } from "react"
import type {
    ImageGenerationParams,
    Quality,
    ImageModel,
} from "@/lib/schemas/pollinations.schema"
import type { AspectRatio } from "@/types/pollinations"
import { ASPECT_RATIOS } from "@/lib/image-models"
import { PollinationsAPI } from "@/lib/pollinations-api"
import { API_DEFAULTS } from "@/lib/config/api.config"

export interface UseGenerationControlsProps {
    onGenerate: (params: ImageGenerationParams) => void
}

/**
 * State shape for generation controls
 * Uses Zod-inferred types for full type safety
 */
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

/**
 * Hook for managing image generation controls state.
 * 
 * Provides:
 * - Type-safe state management using Zod-inferred types
 * - Handlers for all API parameters
 * - Integration with aspect ratio presets
 * - Reset functionality
 */
export function useGenerationControls({ onGenerate }: UseGenerationControlsProps) {
    // Basic settings
    const [prompt, setPrompt] = useState("")
    const [negativePrompt, setNegativePrompt] = useState("")
    const [model, setModel] = useState<ImageModel>(API_DEFAULTS.model)
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1")
    const [width, setWidth] = useState(API_DEFAULTS.width)
    const [height, setHeight] = useState(API_DEFAULTS.height)
    const [seed, setSeed] = useState(-1)

    // New API parameters
    const [quality, setQuality] = useState<Quality>(API_DEFAULTS.quality)
    const [enhance, setEnhance] = useState(API_DEFAULTS.enhance)
    const [transparent, setTransparent] = useState(API_DEFAULTS.transparent)
    const [guidanceScale, setGuidanceScale] = useState<number | undefined>(undefined)
    const [nologo, setNologo] = useState(API_DEFAULTS.nologo)
    const [privateGen, setPrivateGen] = useState(API_DEFAULTS.private)
    const [safe, setSafe] = useState(API_DEFAULTS.safe)

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
        setModel(API_DEFAULTS.model)
        setAspectRatio("1:1")
        setWidth(API_DEFAULTS.width)
        setHeight(API_DEFAULTS.height)
        setSeed(-1)
        setQuality(API_DEFAULTS.quality)
        setEnhance(API_DEFAULTS.enhance)
        setTransparent(API_DEFAULTS.transparent)
        setGuidanceScale(undefined)
        setNologo(API_DEFAULTS.nologo)
        setPrivateGen(API_DEFAULTS.private)
        setSafe(API_DEFAULTS.safe)
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
