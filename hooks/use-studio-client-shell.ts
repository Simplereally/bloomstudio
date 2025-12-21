"use client"

import * as React from "react"
import type { ImageGenerationParams, GeneratedImage, AspectRatio, ImageModel } from "@/types/pollinations"
import { PollinationsAPI } from "@/lib/pollinations-api"
import type { GenerationOptions } from "@/components/studio"

export function useStudioClientShell() {
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
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [showLeftSidebar, setShowLeftSidebar] = React.useState(true)
    const [showGallery, setShowGallery] = React.useState(true)
    const [selectionMode, setSelectionMode] = React.useState(false)
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

    // Image state
    const [images, setImages] = React.useState<GeneratedImage[]>([])
    const [currentImage, setCurrentImage] = React.useState<GeneratedImage | null>(null)
    const [promptHistory, setPromptHistory] = React.useState<string[]>([])
    const [isFullscreen, setIsFullscreen] = React.useState(false)

    // Handle aspect ratio change with dimensions update
    const handleAspectRatioChange = React.useCallback((
        ratio: AspectRatio,
        dimensions: { width: number; height: number }
    ) => {
        setAspectRatio(ratio)
        setWidth(dimensions.width)
        setHeight(dimensions.height)
    }, [])

    // Handle custom dimension changes
    const handleWidthChange = React.useCallback((newWidth: number) => {
        setWidth(newWidth)
        setAspectRatio("custom")
    }, [])

    const handleHeightChange = React.useCallback((newHeight: number) => {
        setHeight(newHeight)
        setAspectRatio("custom")
    }, [])

    // Generate image
    const handleGenerate = React.useCallback(async () => {
        if (!prompt.trim() || isGenerating) return

        setIsGenerating(true)

        // Add to prompt history
        if (!promptHistory.includes(prompt.trim())) {
            setPromptHistory((prev) => [prompt.trim(), ...prev.slice(0, 9)])
        }

        const params: ImageGenerationParams = {
            prompt: prompt.trim(),
            model,
            width,
            height,
            seed: seed === -1 ? undefined : seed,
            enhance: options.enhance,
            private: options.private,
            safe: options.safe,
        }

        const url = PollinationsAPI.buildImageUrl(params)
        const newImage: GeneratedImage = {
            id: Date.now().toString(),
            url,
            prompt: prompt.trim(),
            params,
            timestamp: Date.now(),
        }

        // Simulate processing delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 800))

        setImages((prev) => [newImage, ...prev])
        setCurrentImage(newImage)
        setIsGenerating(false)

        // Generate new random seed if not locked
        if (!seedLocked && seed !== -1) {
            setSeed(PollinationsAPI.generateRandomSeed())
        }
    }, [prompt, isGenerating, promptHistory, model, width, height, seed, options, seedLocked])

    // Handle image removal
    const handleRemoveImage = React.useCallback((id: string) => {
        setImages((prev) => prev.filter((img) => img.id !== id))
        setCurrentImage((curr) => {
            if (curr?.id === id) {
                // We need to use the previous state of images here or handle it after setImages
                // But since setImages is async, we might want to calculate the new current image differently
                return null // This is a bit tricky with nested updates, let's keep it simple for now
            }
            return curr
        })
    }, [])

    // Improved handleRemoveImage to handle currentImage selection
    React.useEffect(() => {
        if (currentImage && !images.find(img => img.id === currentImage.id)) {
            setCurrentImage(images[0] || null)
        }
    }, [images, currentImage])

    // Handle bulk delete
    const handleDeleteSelected = React.useCallback(() => {
        setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)))
        setSelectedIds(new Set())
        setSelectionMode(false)
    }, [selectedIds])

    // Download image
    const handleDownload = React.useCallback(async (image: GeneratedImage) => {
        try {
            const response = await fetch(image.url)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `pixelstream-${image.id}.jpg`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error("Download error:", error)
        }
    }, [])

    // Copy URL to clipboard
    const handleCopyUrl = React.useCallback(async (image: GeneratedImage) => {
        await navigator.clipboard.writeText(image.url)
    }, [])

    // Special effect for regeneration after prompt update
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
