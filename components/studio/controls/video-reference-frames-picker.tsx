"use client"

/**
 * VideoReferenceFramesPicker - Reference frames for non-interpolating video models
 *
 * For video models (like Grok Video) that use reference images stylistically
 * rather than interpolating between them. Supports N selectable frames
 * (configurable via maxFrames prop).
 *
 * Unlike VideoReferenceImagePicker which has fixed "Start"/"End" slots for
 * interpolation, this component supports a dynamic list of frames that can
 * be added/removed individually.
 *
 * Layout: Flex-wrap grid of square upload areas with an "Add Reference" button.
 */

import { UploadProgress } from "@/components/studio/upload-progress"
import { ReferenceImagesBrowserModal } from "@/components/studio/controls/reference-images-browser-modal"
import { Button } from "@/components/ui/button"

import { useUploadReference } from "@/hooks/mutations/use-upload-reference"
import { useReferenceImages } from "@/hooks/queries/use-reference-images"
import { cn } from "@/lib/utils"
import type { ThumbnailData } from "@/components/studio/gallery/types"
import { Image as ImageIcon, Loader2, X, Plus, MoreHorizontal } from "lucide-react"
import Image from "next/image"
import { useRef, useState, useCallback, useMemo } from "react"
import { toast } from "sonner"

export interface VideoReferenceFrames {
    /** Array of reference frame URLs */
    frames: string[]
}

interface VideoReferenceFramesPickerProps {
    /** Currently selected reference frame URLs */
    frames: string[]
    /** Callback when frames change */
    onFramesChange: (frames: string[]) => void
    /** Maximum number of reference frames allowed (default 2) */
    maxFrames?: number
    /** Whether the picker is disabled */
    disabled?: boolean
    /** Hide the header (when wrapped in CollapsibleSection) */
    hideHeader?: boolean
    /** Pre-loaded history images from the gallery (passed to browser modal) */
    historyImages?: ThumbnailData[]
}

/** Maximum number of recent images to show inline */
const MAX_INLINE_RECENT_IMAGES = 3

/** Maximum upload file size in bytes (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Component to manage reference frames for non-interpolating video models.
 * Supports a dynamic number of frames with add/remove capabilities.
 */
export function VideoReferenceFramesPicker({
    frames,
    onFramesChange,
    maxFrames = 2,
    disabled,
    hideHeader = false,
    historyImages,
}: VideoReferenceFramesPickerProps) {
    const recentImages = useReferenceImages()
    const isLoadingRecent = recentImages === undefined

    const [uploadProgress, setUploadProgress] = useState<number | null>(null)
    const [uploadFilename, setUploadFilename] = useState<string>("")
    /** Index of the frame slot being uploaded to, or "new" for a new frame */
    const [uploadingFor, setUploadingFor] = useState<number | "new" | null>(null)
    const [browserOpen, setBrowserOpen] = useState(false)
    /** Index of the frame slot the browser is selecting for, or "new" for adding */
    const [browserTargetIndex, setBrowserTargetIndex] = useState<number | "new" | null>(null)

    const uploadMutation = useUploadReference({
        onProgress: (progress) => setUploadProgress(progress),
    })

    /** Refs for file inputs — one per existing frame + one for the "add" button */
    const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

    const setFileInputRef = useCallback((key: string, el: HTMLInputElement | null) => {
        if (el) {
            fileInputRefs.current.set(key, el)
        } else {
            fileInputRefs.current.delete(key)
        }
    }, [])

    const triggerFileInput = useCallback((key: string) => {
        fileInputRefs.current.get(key)?.click()
    }, [])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetIndex: number | "new") => {
        const file = e.target.files?.[0]
        if (!file) return

        // Client-side validation for file size (10MB limit)
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File is too large. Maximum size is 10MB.")
            const key = targetIndex === "new" ? "new" : `frame-${targetIndex}`
            const input = fileInputRefs.current.get(key)
            if (input) input.value = ""
            return
        }

        setUploadFilename(file.name)
        setUploadProgress(0)
        setUploadingFor(targetIndex)

        try {
            const result = await uploadMutation.mutateAsync(file)
            if (targetIndex === "new") {
                onFramesChange([...frames, result.url])
            } else {
                const updated = [...frames]
                updated[targetIndex] = result.url
                onFramesChange(updated)
            }
            toast.success("Reference frame uploaded")
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : String(error)
            console.error("Upload failed:", message)
            toast.error(`Failed to upload reference frame: ${message}`)
        } finally {
            const key = targetIndex === "new" ? "new" : `frame-${targetIndex}`
            const input = fileInputRefs.current.get(key)
            if (input) input.value = ""
            setUploadProgress(null)
            setUploadingFor(null)
        }
    }

    const handleRemoveFrame = useCallback((index: number) => {
        onFramesChange(frames.filter((_, i) => i !== index))
    }, [frames, onFramesChange])

    const handleClearAll = useCallback(() => {
        onFramesChange([])
    }, [onFramesChange])

    const handleSelectFromRecent = useCallback((url: string) => {
        if (frames.length < maxFrames) {
            onFramesChange([...frames, url])
        }
    }, [frames, maxFrames, onFramesChange])

    const handleOpenBrowser = useCallback((targetIndex: number | "new") => {
        setBrowserTargetIndex(targetIndex)
        setBrowserOpen(true)
    }, [])

    const handleBrowserSelect = useCallback((url: string) => {
        if (browserTargetIndex === "new") {
            if (frames.length < maxFrames) {
                onFramesChange([...frames, url])
            }
        } else if (browserTargetIndex !== null) {
            const updated = [...frames]
            updated[browserTargetIndex] = url
            onFramesChange(updated)
        }
        setBrowserOpen(false)
        setBrowserTargetIndex(null)
    }, [browserTargetIndex, frames, maxFrames, onFramesChange])

    // Memoize selected URLs to avoid unnecessary re-renders of the browser modal
    const selectedUrls = useMemo(() => frames.filter(Boolean), [frames])

    const canAddMore = frames.length < maxFrames

    // Get available recent images (excluding already selected ones)
    const availableRecentImages = recentImages?.filter(
        img => !frames.includes(img.url)
    ) ?? []
    const hasMoreImages = availableRecentImages.length > MAX_INLINE_RECENT_IMAGES

    // Render a single existing frame slot
    const renderFrameSlot = (url: string, index: number) => {
        const label = `Reference ${index + 1}`
        const isUploading = uploadingFor === index

        return (
            <div
                key={`frame-${index}`}
                className="flex flex-col items-center gap-2"
                data-testid={`frame-${index}-slot`}
            >
                {/* Label */}
                <span className="text-sm font-medium text-muted-foreground">{label}</span>

                {/* Frame preview */}
                <div className="relative group aspect-square w-32 rounded-lg overflow-hidden border-2 border-primary/50 ring-2 ring-primary/20 bg-muted">
                    {isUploading ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Image
                            src={url}
                            alt={`${label} image`}
                            fill
                            sizes="128px"
                            className="object-cover"
                        />
                    )}
                    <button
                        onClick={() => handleRemoveFrame(index)}
                        aria-label={`Remove ${label.toLowerCase()} image`}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        data-testid={`remove-frame-${index}-button`}
                    >
                        <X className="h-6 w-6 text-white" />
                    </button>
                </div>

                {/* Browse button for replacing this frame */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenBrowser(index)}
                    className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
                    data-testid={`browse-frame-${index}-button`}
                >
                    <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                    Replace
                </Button>

                <input
                    type="file"
                    ref={(el) => setFileInputRef(`frame-${index}`, el)}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, index)}
                    aria-label={`Upload ${label.toLowerCase()} image file`}
                />
            </div>
        )
    }

    // Render the "Add Reference" button slot
    const renderAddSlot = () => {
        const isUploading = uploadingFor === "new"
        const nextIndex = frames.length
        const label = `Reference ${nextIndex + 1}`

        return (
            <div
                className="flex flex-col items-center gap-2"
                data-testid="add-frame-slot"
            >
                {/* Label */}
                <span className="text-sm font-medium text-muted-foreground">{label}</span>

                {/* Upload area */}
                <button
                    onClick={() => triggerFileInput("new")}
                    disabled={disabled || isUploading}
                    className={cn(
                        "aspect-square w-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center transition-colors hover:border-primary/50 hover:bg-primary/5",
                        (disabled || isUploading) && "opacity-50 cursor-not-allowed"
                    )}
                    data-testid="add-frame-upload-button"
                >
                    {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                        <>
                            <Plus className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground mt-1.5 font-medium">
                                Add
                            </span>
                        </>
                    )}
                </button>

                {/* Browse button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenBrowser("new")}
                    className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
                    data-testid="browse-add-frame-button"
                >
                    <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                    Browse
                </Button>

                <input
                    type="file"
                    ref={(el) => setFileInputRef("new", el)}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, "new")}
                    aria-label={`Upload ${label.toLowerCase()} image file`}
                />
            </div>
        )
    }

    const browserTitle = browserTargetIndex === "new"
        ? "Select Reference Frame"
        : `Replace Reference ${typeof browserTargetIndex === "number" ? browserTargetIndex + 1 : ""}`

    return (
        <div className="space-y-4">
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Reference Frames</span>
                    </div>
                    {frames.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAll}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                            data-testid="clear-all-frames-button"
                        >
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Clear All
                        </Button>
                    )}
                </div>
            )}

            {/* Upload Progress */}
            {uploadProgress !== null && (
                <UploadProgress
                    progress={uploadProgress}
                    filename={uploadFilename}
                />
            )}

            {/* Frame slots in a flex-wrap layout */}
            <div className="flex items-start gap-6 flex-wrap" data-testid="frames-container">
                {/* Existing frames */}
                {frames.map((url, index) => renderFrameSlot(url, index))}

                {/* Add button (if below maxFrames) */}
                {canAddMore && renderAddSlot()}
            </div>

            {/* Recent images */}
            {!isLoadingRecent && availableRecentImages.length > 0 && canAddMore && (
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                            Recent uploads
                        </span>
                        {hasMoreImages && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenBrowser("new")}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                data-testid="view-all-images-button"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                                View All ({availableRecentImages.length})
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2.5 flex-wrap" data-testid="recent-images-container">
                        {availableRecentImages
                            .slice(0, MAX_INLINE_RECENT_IMAGES)
                            .map((img) => (
                                <div
                                    key={img._id}
                                    className="relative group aspect-square w-16 rounded-md overflow-hidden border border-border cursor-pointer ring-offset-background transition-all hover:ring-2 hover:ring-primary/20 bg-muted"
                                    data-testid="recent-image-thumbnail"
                                >
                                    <button
                                        onClick={() => handleSelectFromRecent(img.url)}
                                        className="w-full h-full relative"
                                        data-testid={`select-recent-${img._id}`}
                                    >
                                        <Image
                                            src={img.url}
                                            alt="Reference image"
                                            fill
                                            sizes="64px"
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            <p className="text-sm text-muted-foreground italic">
                {frames.length === 0
                    ? "Upload reference frames to guide video generation"
                    : frames.length === 1
                        ? "1 reference frame selected"
                        : `${frames.length} reference frames selected`}
            </p>

            {/* Browser Modal */}
            <ReferenceImagesBrowserModal
                open={browserOpen}
                onOpenChange={setBrowserOpen}
                onSelect={handleBrowserSelect}
                title={browserTitle}
                description="Choose a reference image from your library"
                selectedUrls={selectedUrls}
                allowVideo={false}
                historyImages={historyImages}
            />
        </div>
    )
}
