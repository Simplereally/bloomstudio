"use client"

/**
 * useGenerationSettings Hook
 * 
 * Manages all generation parameter state: model, dimensions, aspect ratio, seed, options.
 * Isolated from prompt state to prevent unnecessary re-renders when typing.
 * 
 * Features:
 * - Model selection with automatic constraint application
 * - Aspect ratio presets with custom dimension support
 * - Linked dimension changes (maintain aspect ratio)
 * - Seed management with random mode support
 * - Generation options (enhance, private, safe)
 * - Reference image selection
 * 
 * This hook follows the "Headless UI" pattern - pure logic with stable callbacks.
 */

import type { GenerationOptions, VideoSettings, VideoReferenceImages } from "@/components/studio"
import { useRandomSeed } from "@/hooks/use-random-seed"
import {
    getModel,
    getModelAspectRatios,
} from "@/lib/config/models"
import type {
    AspectRatio,
    AspectRatioOption,
    ImageModel,
} from "@/types/pollinations"
import * as React from "react"

/**
 * Return type for useGenerationSettings hook
 */
export interface UseGenerationSettingsReturn {
    // Model state
    model: ImageModel
    setModel: React.Dispatch<React.SetStateAction<ImageModel>>
    handleModelChange: (newModel: ImageModel) => void
    aspectRatios: readonly AspectRatioOption[]

    // Dimension state
    aspectRatio: AspectRatio
    setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>
    width: number
    setWidth: React.Dispatch<React.SetStateAction<number>>
    height: number
    setHeight: React.Dispatch<React.SetStateAction<number>>
    handleAspectRatioChange: (ratio: AspectRatio, dimensions: { width: number; height: number }) => void
    handleWidthChange: (newWidth: number) => void
    handleHeightChange: (newHeight: number) => void
    dimensionsLinked: boolean
    setDimensionsLinked: React.Dispatch<React.SetStateAction<boolean>>

    // Seed state
    seed: number
    setSeed: React.Dispatch<React.SetStateAction<number>>
    seedLocked: boolean
    setSeedLocked: React.Dispatch<React.SetStateAction<boolean>>
    generateSeed: () => number
    isRandomMode: (seed: number) => boolean
    refreshSeedIfNeeded: () => void

    // Options state
    options: GenerationOptions
    setOptions: React.Dispatch<React.SetStateAction<GenerationOptions>>

    // Reference image
    referenceImage: string | undefined
    setReferenceImage: React.Dispatch<React.SetStateAction<string | undefined>>

    // Video-specific settings
    isVideoModel: boolean
    videoSettings: VideoSettings
    setVideoSettings: React.Dispatch<React.SetStateAction<VideoSettings>>
    videoReferenceImages: VideoReferenceImages
    setVideoReferenceImages: React.Dispatch<React.SetStateAction<VideoReferenceImages>>
}

/**
 * Hook for managing image generation settings.
 * 
 * @example
 * ```tsx
 * const {
 *     model,
 *     handleModelChange,
 *     width,
 *     height,
 *     handleAspectRatioChange,
 *     seed,
 *     options,
 * } = useGenerationSettings()
 * ```
 */
export function useGenerationSettings(): UseGenerationSettingsReturn {
    // ========================================
    // Model State
    // ========================================
    const [model, setModel] = React.useState<ImageModel>("zimage")

    // ========================================
    // Dimension State
    // ========================================
    const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("1:1")
    const [width, setWidth] = React.useState(2048)
    const [height, setHeight] = React.useState(2048)
    const [dimensionsLinked, setDimensionsLinked] = React.useState(false)

    // ========================================
    // Seed State
    // ========================================
    const [seed, setSeed] = React.useState(-1)
    const [seedLocked, setSeedLocked] = React.useState(false)
    const { generateSeed, isRandomMode } = useRandomSeed(model)

    // ========================================
    // Options State
    // ========================================
    const [options, setOptions] = React.useState<GenerationOptions>({
        enhance: false,
        private: false,
        safe: false,
    })

    // ========================================
    // Reference Image State
    // ========================================
    const [referenceImage, setReferenceImage] = React.useState<string | undefined>(undefined)

    // ========================================
    // Video-specific State
    // ========================================
    const [videoSettings, setVideoSettings] = React.useState<VideoSettings>({
        duration: 5,
        audio: false,
    })
    const [videoReferenceImages, setVideoReferenceImages] = React.useState<VideoReferenceImages>({
        firstFrame: undefined,
        lastFrame: undefined,
    })

    // ========================================
    // Model-specific Data
    // ========================================
    const modelDef = React.useMemo(() => getModel(model), [model])
    const isVideoModel = modelDef?.type === "video"

    const aspectRatios = React.useMemo(
        () => getModelAspectRatios(model) ?? [],
        [model]
    )

    // ========================================
    // Dimension Handlers
    // ========================================
    const handleAspectRatioChange = React.useCallback(
        (ratio: AspectRatio, dimensions: { width: number; height: number }) => {
            setAspectRatio(ratio)
            setWidth(dimensions.width)
            setHeight(dimensions.height)
        },
        []
    )

    const handleWidthChange = React.useCallback((newWidth: number) => {
        setWidth(newWidth)
        setAspectRatio("custom")
    }, [])

    const handleHeightChange = React.useCallback((newHeight: number) => {
        setHeight(newHeight)
        setAspectRatio("custom")
    }, [])

    // ========================================
    // Model Change Handler
    // ========================================
    // Handle model change with dimension reset for pixel-limited models or fixed-size models
    // Note: This callback depends on width/height to read current values. This is intentional
    // and acceptable because model changes are infrequent operations.
    const handleModelChange = React.useCallback((newModel: ImageModel) => {
        setModel(newModel)

        const newModelDef = getModel(newModel)
        if (!newModelDef) return // Unknown model, no constraints to apply

        const { constraints, aspectRatios: ratios } = newModelDef

        // For fixed-size models (dimensionsEnabled: false), use the first aspect ratio preset
        if (!constraints.dimensionsEnabled && ratios.length > 0) {
            const firstRatio = ratios[0]
            setWidth(firstRatio.width)
            setHeight(firstRatio.height)
            setAspectRatio(firstRatio.value)
        } else {
            // For other models, reset to defaults if current dimensions exceed model limit
            const currentPixels = width * height
            const exceedsPixelLimit = currentPixels > constraints.maxPixels
            const exceedsDimensionLimit =
                width > constraints.maxDimension || height > constraints.maxDimension

            if (exceedsPixelLimit || exceedsDimensionLimit) {
                setWidth(constraints.defaultDimensions.width)
                setHeight(constraints.defaultDimensions.height)
                setAspectRatio("1:1")
            }
        }

        // Reset video settings to model defaults when switching to a video model
        if (newModelDef.type === "video" && newModelDef.durationConstraints) {
            setVideoSettings({
                duration: newModelDef.durationConstraints.defaultDuration,
                audio: false,
            })
            // Clear video reference images when switching models
            setVideoReferenceImages({
                firstFrame: undefined,
                lastFrame: undefined,
            })
        }
    }, [width, height])

    // ========================================
    // Seed Refresh Helper
    // ========================================
    // Called after successful generation to refresh seed if not locked
    const refreshSeedIfNeeded = React.useCallback(() => {
        if (!seedLocked && !isRandomMode(seed)) {
            setSeed(generateSeed())
        }
    }, [seedLocked, seed, isRandomMode, generateSeed])

    return {
        // Model state
        model,
        setModel,
        handleModelChange,
        aspectRatios,

        // Dimension state
        aspectRatio,
        setAspectRatio,
        width,
        setWidth,
        height,
        setHeight,
        handleAspectRatioChange,
        handleWidthChange,
        handleHeightChange,
        dimensionsLinked,
        setDimensionsLinked,

        // Seed state
        seed,
        setSeed,
        seedLocked,
        setSeedLocked,
        generateSeed,
        isRandomMode,
        refreshSeedIfNeeded,

        // Options state
        options,
        setOptions,

        // Reference image
        referenceImage,
        setReferenceImage,

        // Video-specific settings
        isVideoModel,
        videoSettings,
        setVideoSettings,
        videoReferenceImages,
        setVideoReferenceImages,
    }
}
