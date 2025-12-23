"use client"

/**
 * useStudioClientShell Hook
 *
 * Main state management hook for the Studio page.
 * Integrates TanStack Query for image generation with local UI state.
 */

import * as React from "react"
import type {
    ImageGenerationParams,
    GeneratedImage,
    AspectRatio,
    ImageModel,
} from "@/types/pollinations"
import { PollinationsAPI } from "@/lib/pollinations-api"
import { useGenerateImage, useDownloadImage } from "@/hooks/queries"
import type { GenerationOptions } from "@/components/studio"

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

    // Handlers
    handleAspectRatioChange: (
        ratio: AspectRatio,
        dimensions: { width: number; height: number }
    ) => void
    handleWidthChange: (newWidth: number) => void
    handleHeightChange: (newHeight: number) => void
    handleGenerate: () => void
    handleRemoveImage: (id: string) => void
    handleDeleteSelected: () => void
    handleDownload: (image: GeneratedImage) => void
    handleCopyUrl: (image: GeneratedImage) => Promise<void>
    handleRegenerate: () => void
    handleOpenInNewTab: () => void
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

    // TanStack Query hooks
    const { generate, isGenerating } = useGenerateImage({
        onSuccess: (image) => {
            // Add to images list
            setImages((prev) => [image, ...prev])
            setCurrentImage(image)

            // Generate new random seed if not locked
            if (!seedLocked && seed !== -1) {
                setSeed(PollinationsAPI.generateRandomSeed())
            }
        },
        onError: (error) => {
            console.error("Generation error:", error.message)
        },
    })

    const { download, isDownloading } = useDownloadImage({
        onSuccess: () => {
            // Could show a toast notification here
        },
        onError: (error) => {
            console.error("Download error:", error.message)
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

    // Generate image using TanStack Query
    const handleGenerate = React.useCallback(() => {
        if (!prompt.trim() || isGenerating) return

        // Add to prompt history
        if (!promptHistory.includes(prompt.trim())) {
            setPromptHistory((prev) => [prompt.trim(), ...prev.slice(0, 9)])
        }

        const params: ImageGenerationParams = {
            prompt: prompt.trim(),
            negativePrompt: negativePrompt.trim() || undefined,
            model,
            width,
            height,
            seed: seed === -1 ? undefined : seed,
            enhance: options.enhance,
            private: options.private,
            safe: options.safe,
        }

        generate(params)
    }, [
        prompt,
        negativePrompt,
        isGenerating,
        promptHistory,
        model,
        width,
        height,
        seed,
        options,
        generate,
    ])

    // Handle image removal
    const handleRemoveImage = React.useCallback((id: string) => {
        setImages((prev) => prev.filter((img) => img.id !== id))
        setCurrentImage((curr) => {
            if (curr?.id === id) {
                return null
            }
            return curr
        })
    }, [])

    // Update currentImage when removed image was selected
    React.useEffect(() => {
        if (currentImage && !images.find((img) => img.id === currentImage.id)) {
            setCurrentImage(images[0] || null)
        }
    }, [images, currentImage])

    // Handle bulk delete
    const handleDeleteSelected = React.useCallback(() => {
        setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)))
        setSelectedIds(new Set())
        setSelectionMode(false)
    }, [selectedIds])

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
        handleGenerate,
        handleRemoveImage,
        handleDeleteSelected,
        handleDownload,
        handleCopyUrl,
        handleRegenerate: triggerRegenerate,
        handleOpenInNewTab,
    }
}
