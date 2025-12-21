import { useState, useEffect } from "react"
import type { GeneratedImage } from "@/types/pollinations"

export function useImageDisplay(currentImage: GeneratedImage | null) {
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
    const [isImageLoading, setIsImageLoading] = useState(false)

    // Reset loading state when the image changes
    useEffect(() => {
        if (currentImage) {
            setIsImageLoading(true)
        }
    }, [currentImage?.id])

    const handleDownload = async (image: GeneratedImage) => {
        try {
            const response = await fetch(image.url)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `pollinations-${image.id}.jpg`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error("[v0] Download error:", error)
        }
    }

    const handleCopyUrl = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url)
            setCopiedUrl(url)
            setTimeout(() => setCopiedUrl(null), 2000)
        } catch (error) {
            console.error("[v0] Copy error:", error)
        }
    }

    return {
        copiedUrl,
        isImageLoading,
        setIsImageLoading,
        handleDownload,
        handleCopyUrl,
    }
}
