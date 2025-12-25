"use client"

/**
 * useStudioClientShell Hook
 *
 * Main state management hook for the Studio page.
 * Integrates TanStack Query for image generation with local UI state.
 */

import type { GenerationOptions } from "@/components/studio"
import { useDownloadImage, useGenerateImage } from "@/hooks/queries"
import { useDeleteGeneratedImage } from "@/hooks/mutations/use-delete-image"
import { useRandomSeed } from "@/hooks/use-random-seed"
import {
    getModelAspectRatios,
    getModelConstraints,
    isGPTImageModel,
    isGPTImageLargeModel,
    findNearestGPTImageSize,
    findNearestGPTImageLargeSize
} from "@/lib/config/model-constraints"
import { showAuthRequiredToast, showErrorToast } from "@/lib/errors"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"
import type {
    AspectRatio,
    AspectRatioOption,
    GeneratedImage,
    ImageGenerationParams,
    ImageModel,
} from "@/types/pollinations"
import * as React from "react"

/**
 * Return type for the useStudioClientShell hook
 */
export interface UseStudioClientShellReturn {
    // State
    prompt: string
    setPrompt: React.Dispatch<React.SetStateAction<string>>
    negativePrompt: string
    setNegativePrompt: React.Dispatch<React.SetStateAction<string>>
    model: ImageModel
    setModel: React.Dispatch<React.SetStateAction<ImageModel>>
    aspectRatio: AspectRatio
    setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>
    width: number
    setWidth: React.Dispatch<React.SetStateAction<number>>
    height: number
    setHeight: React.Dispatch<React.SetStateAction<number>>
    seed: number
    setSeed: React.Dispatch<React.SetStateAction<number>>
    seedLocked: boolean
    setSeedLocked: React.Dispatch<React.SetStateAction<boolean>>
    options: GenerationOptions
    setOptions: React.Dispatch<React.SetStateAction<GenerationOptions>>
    isGenerating: boolean
    showLeftSidebar: boolean
    setShowLeftSidebar: React.Dispatch<React.SetStateAction<boolean>>
    showGallery: boolean
    setShowGallery: React.Dispatch<React.SetStateAction<boolean>>
    selectionMode: boolean
    setSelectionMode: React.Dispatch<React.SetStateAction<boolean>>
    selectedIds: Set<string>
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
    images: GeneratedImage[]
    currentImage: GeneratedImage | null
    setCurrentImage: React.Dispatch<React.SetStateAction<GeneratedImage | null>>
    promptHistory: string[]
    isFullscreen: boolean
    setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>
    isDownloading: boolean
    referenceImage: string | undefined
    setReferenceImage: React.Dispatch<React.SetStateAction<string | undefined>>

    // Handlers
    handleAspectRatioChange: (
        ratio: AspectRatio,
        dimensions: { width: number; height: number }
    ) => void
    handleWidthChange: (newWidth: number) => void
    handleHeightChange: (newHeight: number) => void
    handleModelChange: (newModel: ImageModel) => void
    handleGenerate: () => void
    handleRemoveImage: (id: string) => void
    handleDeleteSelected: () => void
    handleDownload: (image: GeneratedImage) => void
    handleCopyUrl: (image: GeneratedImage) => Promise<void>
    handleRegenerate: () => void
    handleOpenInNewTab: () => void

    // Model-specific data
    aspectRatios: readonly AspectRatioOption[]
}

export function useStudioClientShell(): UseStudioClientShellReturn {
    // Generation state
    const [prompt, setPrompt] = React.useState("")
    const [negativePrompt, setNegativePrompt] = React.useState("")
    const [model, setModel] = React.useState<ImageModel>("flux")
    const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("1:1")
    const [width, setWidth] = React.useState(1024)
    const [height, setHeight] = React.useState(1024)
    const [seed, setSeed] = React.useState(-1)
    const [seedLocked, setSeedLocked] = React.useState(false)
    const [options, setOptions] = React.useState<GenerationOptions>({
        enhance: false,
        private: false,
        safe: false,
    })

    // UI state
    const [showLeftSidebar, setShowLeftSidebar] = React.useState(true)
    const [showGallery, setShowGallery] = React.useState(true)
    const [selectionMode, setSelectionMode] = React.useState(false)
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

    // Image state
    const [images, setImages] = React.useState<GeneratedImage[]>([])
    const [currentImage, setCurrentImage] = React.useState<GeneratedImage | null>(
        null
    )
    const [promptHistory, setPromptHistory] = React.useState<string[]>([])
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [referenceImage, setReferenceImage] = React.useState<string | undefined>(undefined)

    // Random seed generation hook
    const { generateSeed, isRandomMode } = useRandomSeed()

    // TanStack Query hooks
    const { generate, isGenerating } = useGenerateImage({
        onSuccess: (image) => {
            // Add to images list
            setImages((prev) => [image, ...prev])
            setCurrentImage(image)

            // Generate new random seed if not locked and not in random mode
            // (Random mode generates a new seed on each request anyway)
            if (!seedLocked && !isRandomMode(seed)) {
                setSeed(generateSeed())
            }
        },
        onError: (error) => {
            // Show appropriate toast based on error type
            if (error.code === "UNAUTHORIZED") {
                showAuthRequiredToast()
            } else {
                showErrorToast(error)
            }
        },
    })

    const { download, isDownloading } = useDownloadImage({
        onSuccess: () => {
            // Could show a toast notification here
        },
        onError: (error) => {
            showErrorToast(error)
        },
    })

    // Handle aspect ratio change with dimensions update
    const handleAspectRatioChange = React.useCallback(
        (ratio: AspectRatio, dimensions: { width: number; height: number }) => {
            setAspectRatio(ratio)
            setWidth(dimensions.width)
            setHeight(dimensions.height)
        },
        []
    )

    // Handle custom dimension changes
    const handleWidthChange = React.useCallback((newWidth: number) => {
        setWidth(newWidth)
        setAspectRatio("custom")
    }, [])

    const handleHeightChange = React.useCallback((newHeight: number) => {
        setHeight(newHeight)
        setAspectRatio("custom")
    }, [])

    // Handle model change with dimension reset for pixel-limited models or fixed-size models
    const handleModelChange = React.useCallback((newModel: ImageModel) => {
        setModel(newModel)

        const constraints = getModelConstraints(newModel)
        const currentPixels = width * height

        // GPT Image Large (HD) requires fixed dimensions - map to nearest supported size
        // Check this first since it's more specific than GPT Image
        if (isGPTImageLargeModel(newModel)) {
            const nearest = findNearestGPTImageLargeSize(aspectRatio, width, height)
            setWidth(nearest.width)
            setHeight(nearest.height)
            setAspectRatio(nearest.ratio)
            return
        }

        // GPT Image requires fixed dimensions - map to nearest supported size
        if (isGPTImageModel(newModel)) {
            const nearest = findNearestGPTImageSize(aspectRatio, width, height)
            setWidth(nearest.width)
            setHeight(nearest.height)
            setAspectRatio(nearest.ratio)
            return
        }

        // For other models, reset to defaults if current dimensions exceed model limit
        // Check both pixel count AND individual dimension limits (important for Turbo's 768px max)
        const exceedsPixelLimit = currentPixels >= constraints.maxPixels
        const exceedsDimensionLimit = width > constraints.maxDimension || height > constraints.maxDimension

        if (exceedsPixelLimit || exceedsDimensionLimit) {
            setWidth(constraints.defaultDimensions.width)
            setHeight(constraints.defaultDimensions.height)
            setAspectRatio("1:1")
        }
    }, [width, height, aspectRatio])

    // Get model-specific aspect ratios for the selector
    const aspectRatios = React.useMemo(
        () => getModelAspectRatios(model),
        [model]
    )

    // Refs for values that shouldn't trigger handleGenerate recreation
    // This prevents the keyboard shortcut effect from re-running on every keystroke
    const promptRef = React.useRef(prompt)
    const negativePromptRef = React.useRef(negativePrompt)
    const promptHistoryRef = React.useRef(promptHistory)
    const modelRef = React.useRef(model)
    const widthRef = React.useRef(width)
    const heightRef = React.useRef(height)
    const seedRef = React.useRef(seed)
    const optionsRef = React.useRef(options)
    const referenceImageRef = React.useRef(referenceImage)

    // Keep refs in sync with state
    React.useEffect(() => {
        promptRef.current = prompt
    }, [prompt])
    React.useEffect(() => {
        negativePromptRef.current = negativePrompt
    }, [negativePrompt])
    React.useEffect(() => {
        promptHistoryRef.current = promptHistory
    }, [promptHistory])
    React.useEffect(() => {
        modelRef.current = model
    }, [model])
    React.useEffect(() => {
        widthRef.current = width
    }, [width])
    React.useEffect(() => {
        heightRef.current = height
    }, [height])
    React.useEffect(() => {
        seedRef.current = seed
    }, [seed])
    React.useEffect(() => {
        optionsRef.current = options
    }, [options])
    React.useEffect(() => {
        referenceImageRef.current = referenceImage
    }, [referenceImage])

    // Generate image using TanStack Query
    // Uses refs to avoid recreating the callback on every state change
    const handleGenerate = React.useCallback(() => {
        const currentPrompt = promptRef.current
        const currentNegativePrompt = negativePromptRef.current
        const currentPromptHistory = promptHistoryRef.current
        const currentModel = modelRef.current
        const currentWidth = widthRef.current
        const currentHeight = heightRef.current
        const currentSeed = seedRef.current
        const currentOptions = optionsRef.current
        const currentReferenceImage = referenceImageRef.current

        if (!currentPrompt.trim() || isGenerating) return

        // Add to prompt history
        if (!currentPromptHistory.includes(currentPrompt.trim())) {
            setPromptHistory((prev) => [currentPrompt.trim(), ...prev.slice(0, 9)])
        }

        // When seed is -1 (random mode), generate a fresh random seed for this request
        // This ensures each generation gets a unique seed, preventing cached results
        const effectiveSeed = currentSeed === -1 ? generateSeed() : currentSeed

        const params: ImageGenerationParams = {
            prompt: currentPrompt.trim(),
            negativePrompt: currentNegativePrompt.trim() || undefined,
            model: currentModel,
            width: currentWidth,
            height: currentHeight,
            seed: effectiveSeed,
            enhance: currentOptions.enhance,
            private: currentOptions.private,
            safe: currentOptions.safe,
            image: currentReferenceImage,
        }

        generate(params)
    }, [isGenerating, generate, generateSeed])

    const deleteMutation = useDeleteGeneratedImage()

    // Handle image removal
    const handleRemoveImage = React.useCallback(async (id: string) => {
        const imageToDelete = images.find(img => img.id === id)

        // If image has a Convex ID, delete it from the server
        if (imageToDelete?._id) {
            try {
                await deleteMutation.mutateAsync(imageToDelete._id as Id<"generatedImages">)
            } catch (error) {
                console.error("Failed to delete image from server:", error)
                // Mutation hook already shows toast, but we should stop here
                return
            }
        }

        setImages((prev) => prev.filter((img) => img.id !== id))
        setCurrentImage((curr) => {
            if (curr?.id === id) {
                return null
            }
            return curr
        })
    }, [images, deleteMutation])

    // Update currentImage when removed image was selected
    React.useEffect(() => {
        if (currentImage && !images.find((img) => img.id === currentImage.id)) {
            setCurrentImage(images[0] || null)
        }
    }, [images, currentImage])

    // Handle bulk delete
    const handleDeleteSelected = React.useCallback(async () => {
        const idsToDelete = Array.from(selectedIds)
        const imagesToDelete = images.filter(img => selectedIds.has(img.id))

        // Delete all persistent images
        const persistentIds = imagesToDelete
            .filter(img => img._id)
            .map(img => img._id as Id<"generatedImages">)

        if (persistentIds.length > 0) {
            try {
                // Batch delete not available in hook, do them sequentially or concurrently
                // For simplicity and toast handling, we'll do them concurrently
                await Promise.all(persistentIds.map(dbId => deleteMutation.mutateAsync(dbId)))
                toast.success(`Deleted ${persistentIds.length} images`)
            } catch (error) {
                console.error("Bulk delete partially failed:", error)
            }
        }

        setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)))
        setSelectedIds(new Set())
        setSelectionMode(false)
    }, [selectedIds, images, deleteMutation])

    // Download image using TanStack Query
    const handleDownload = React.useCallback(
        (image: GeneratedImage) => {
            download({
                url: image.url,
                filename: `pixelstream-${image.id}.jpg`,
            })
        },
        [download]
    )

    // Copy URL to clipboard
    const handleCopyUrl = React.useCallback(
        async (image: GeneratedImage) => {
            await navigator.clipboard.writeText(image.url)
        },
        []
    )

    // Regenerate current image
    const [shouldGenerate, setShouldGenerate] = React.useState(false)
    const triggerRegenerate = React.useCallback(() => {
        if (currentImage) {
            setPrompt(currentImage.prompt)
            setShouldGenerate(true)
        }
    }, [currentImage])

    React.useEffect(() => {
        if (shouldGenerate && !isGenerating) {
            handleGenerate()
            setShouldGenerate(false)
        }
    }, [shouldGenerate, isGenerating, handleGenerate])

    // Open in new tab
    const handleOpenInNewTab = React.useCallback(() => {
        if (currentImage) {
            window.open(currentImage.url, "_blank")
        }
    }, [currentImage])

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + Enter to generate
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isGenerating) {
                e.preventDefault()
                handleGenerate()
            }
            // Cmd/Ctrl + B to toggle sidebar
            if ((e.metaKey || e.ctrlKey) && e.key === "b") {
                e.preventDefault()
                setShowLeftSidebar((prev) => !prev)
            }
            // Cmd/Ctrl + G to toggle gallery
            if ((e.metaKey || e.ctrlKey) && e.key === "g") {
                e.preventDefault()
                setShowGallery((prev) => !prev)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isGenerating, handleGenerate])

    return {
        // State
        prompt,
        setPrompt,
        negativePrompt,
        setNegativePrompt,
        model,
        setModel,
        aspectRatio,
        setAspectRatio,
        width,
        setWidth,
        height,
        setHeight,
        seed,
        setSeed,
        seedLocked,
        setSeedLocked,
        options,
        setOptions,
        isGenerating,
        showLeftSidebar,
        setShowLeftSidebar,
        showGallery,
        setShowGallery,
        selectionMode,
        setSelectionMode,
        selectedIds,
        setSelectedIds,
        images,
        currentImage,
        setCurrentImage,
        promptHistory,
        isFullscreen,
        setIsFullscreen,
        isDownloading,

        // Handlers
        handleAspectRatioChange,
        handleWidthChange,
        handleHeightChange,
        handleModelChange,
        handleGenerate,
        handleRemoveImage,
        handleDeleteSelected,
        handleDownload,
        handleCopyUrl,
        handleRegenerate: triggerRegenerate,
        handleOpenInNewTab,
        referenceImage,
        setReferenceImage,

        // Model-specific data
        aspectRatios,
    }
}
