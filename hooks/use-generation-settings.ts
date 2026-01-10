"use client"

/**
 * useGenerationSettings Hook
 *
 * Manages all generation parameter state: model, dimensions, aspect ratio, seed, options.
 * Isolated from prompt state to prevent unnecessary re-renders when typing.
 *
 * Features:
 * - Model selection with automatic constraint application
 * - Resolution tier selection with dynamic dimension calculation using standard resolutions
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
import {
    getDefaultTierForModel,
    getSupportedTiersForModel,
    calculateDimensionsForTier,
    parseAspectRatio,
} from "@/lib/config/resolution-tiers"
import {
    getStandardDimensionsWithFallback,
} from "@/lib/config/standard-resolutions"
import type {
    AspectRatio,
    AspectRatioOption,
    ImageModel,
    ModelConstraints,
    ResolutionTier,
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
    constraints: ModelConstraints | undefined

    // Resolution tier state
    resolutionTier: ResolutionTier
    setResolutionTier: React.Dispatch<React.SetStateAction<ResolutionTier>>
    handleResolutionTierChange: (tier: ResolutionTier) => void
    supportedTiers: readonly ResolutionTier[]

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
 *     resolutionTier,
 *     handleResolutionTierChange,
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
    // Resolution Tier State
    // ========================================
    const [resolutionTier, setResolutionTier] = React.useState<ResolutionTier>("hd")

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
    // Model-specific Data (Memoized)
    // ========================================
    const modelDef = React.useMemo(() => getModel(model), [model])
    const isVideoModel = modelDef?.type === "video"

    const aspectRatios = React.useMemo(
        () => getModelAspectRatios(model) ?? [],
        [model]
    )

    const constraints = React.useMemo(
        () => getModel(model)?.constraints,
        [model]
    )

    const supportedTiers = React.useMemo(
        () => constraints ? getSupportedTiersForModel(constraints) : ["hd"] as const,
        [constraints]
    )

    // ========================================
    // Resolution Tier Handler
    // ========================================
    const handleResolutionTierChange = React.useCallback((tier: ResolutionTier) => {
        setResolutionTier(tier)

        // If we have a non-custom aspect ratio, use standard resolutions
        if (aspectRatio !== "custom") {
            // Get standard dimensions for this aspect ratio and tier
            const standardDims = getStandardDimensionsWithFallback(aspectRatio, tier)

            // If we have model constraints, verify the dimensions are achievable
            if (constraints) {
                const pixels = standardDims.width * standardDims.height
                const exceedsConstraints =
                    pixels > constraints.maxPixels ||
                    standardDims.width > constraints.maxDimension ||
                    standardDims.height > constraints.maxDimension

                if (exceedsConstraints) {
                    // Standard dimensions don't fit, calculate constrained dimensions
                    const parsed = parseAspectRatio(aspectRatio)
                    if (parsed) {
                        const dims = calculateDimensionsForTier(parsed, tier, constraints)
                        setWidth(dims.width)
                        setHeight(dims.height)
                        return
                    }
                }

                // Apply step alignment to standard dimensions
                const step = constraints.step
                const alignedWidth = Math.round(standardDims.width / step) * step
                const alignedHeight = Math.round(standardDims.height / step) * step
                setWidth(Math.max(constraints.minDimension, Math.min(constraints.maxDimension, alignedWidth)))
                setHeight(Math.max(constraints.minDimension, Math.min(constraints.maxDimension, alignedHeight)))
            } else {
                // No constraints, use standard dimensions directly
                setWidth(standardDims.width)
                setHeight(standardDims.height)
            }
        }
    }, [constraints, aspectRatio])

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
    // Also adjusts resolution tier if current tier is not supported
    // Uses standard resolutions where possible
    const handleModelChange = React.useCallback((newModel: ImageModel) => {
        setModel(newModel)

        const newModelDef = getModel(newModel)
        if (!newModelDef) return // Unknown model, no constraints to apply

        const { constraints: newConstraints, aspectRatios: ratios } = newModelDef

        // Check if current tier is supported by new model
        const newSupportedTiers = getSupportedTiersForModel(newConstraints)
        let tierToUse = resolutionTier

        if (!newSupportedTiers.includes(resolutionTier)) {
            // Current tier not supported, find the best alternative
            tierToUse = getDefaultTierForModel(newConstraints)
            setResolutionTier(tierToUse)
        }

        // For fixed-size models (dimensionsEnabled: false), use standard dimensions
        if (!newConstraints.dimensionsEnabled && ratios.length > 0) {
            const firstRatio = ratios[0]
            // Use standard dimensions for this ratio at the tier
            const standardDims = getStandardDimensionsWithFallback(firstRatio.value, tierToUse)
            setWidth(standardDims.width)
            setHeight(standardDims.height)
            setAspectRatio(firstRatio.value)
        } else {
            // For other models, try to preserve aspect ratio with standard dimensions
            if (aspectRatio !== "custom") {
                // Get standard dimensions for current aspect ratio at the new tier
                const standardDims = getStandardDimensionsWithFallback(aspectRatio, tierToUse)

                // Check if standard dimensions fit the model constraints
                const pixels = standardDims.width * standardDims.height
                const exceedsConstraints =
                    pixels > newConstraints.maxPixels ||
                    standardDims.width > newConstraints.maxDimension ||
                    standardDims.height > newConstraints.maxDimension

                if (exceedsConstraints) {
                    // Standard dimensions don't fit, calculate constrained dimensions
                    const parsed = parseAspectRatio(aspectRatio)
                    if (parsed) {
                        const dims = calculateDimensionsForTier(parsed, tierToUse, newConstraints)
                        setWidth(dims.width)
                        setHeight(dims.height)
                        return
                    }
                } else {
                    // Apply step alignment to standard dimensions
                    const step = newConstraints.step
                    const alignedWidth = Math.round(standardDims.width / step) * step
                    const alignedHeight = Math.round(standardDims.height / step) * step
                    setWidth(Math.max(newConstraints.minDimension, Math.min(newConstraints.maxDimension, alignedWidth)))
                    setHeight(Math.max(newConstraints.minDimension, Math.min(newConstraints.maxDimension, alignedHeight)))
                    return
                }
            }

            // Fallback: reset to defaults if current dimensions exceed model limit
            const currentPixels = width * height
            const exceedsPixelLimit = currentPixels > newConstraints.maxPixels
            const exceedsDimensionLimit =
                width > newConstraints.maxDimension || height > newConstraints.maxDimension

            if (exceedsPixelLimit || exceedsDimensionLimit) {
                setWidth(newConstraints.defaultDimensions.width)
                setHeight(newConstraints.defaultDimensions.height)
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
    }, [width, height, aspectRatio, resolutionTier])

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
        constraints,

        // Resolution tier state
        resolutionTier,
        setResolutionTier,
        handleResolutionTierChange,
        supportedTiers,

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
