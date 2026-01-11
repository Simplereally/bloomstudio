"use client"

/**
 * VideoReferenceImagePicker - Reference images for video frame interpolation
 * 
 * For video models that support interpolation (like veo), allows users to:
 * - Set a first frame (starting image) as image[0]
 * - Set a last frame (ending image) as image[1] for interpolation
 * 
 * When only first frame is provided, video starts from that image.
 * When both first and last frames are provided, video interpolates between them.
 * 
 * Layout: Horizontal (left-to-right) with square upload areas for compactness.
 */

import { DeleteImageDialog } from "@/components/studio/delete-image-dialog"
import { UploadProgress } from "@/components/studio/upload-progress"
import { ReferenceImagesBrowserModal } from "@/components/studio/controls/reference-images-browser-modal"
import { Button } from "@/components/ui/button"
import { useDeleteReferenceImage } from "@/hooks/mutations/use-delete-image"
import { useUploadReference } from "@/hooks/mutations/use-upload-reference"
import { useReferenceImages } from "@/hooks/queries/use-reference-images"
import { cn } from "@/lib/utils"
import { Image as ImageIcon, Loader2, Upload, X, Play, Target, MoreHorizontal, ArrowRight } from "lucide-react"
import Image from "next/image"
import { useRef, useState, useCallback } from "react"
import { toast } from "sonner"

export interface VideoReferenceImages {
    /** First frame (starting image) - image[0] */
    firstFrame?: string
    /** Last frame (ending image for interpolation) - image[1] */
    lastFrame?: string
}

interface VideoReferenceImagePickerProps {
    /** Currently selected reference images */
    selectedImages: VideoReferenceImages
    /** Callback when images change */
    onImagesChange: (images: VideoReferenceImages) => void
    /** Whether interpolation is supported */
    supportsInterpolation?: boolean
    /** Whether the picker is disabled */
    disabled?: boolean
    /** Hide the header (when wrapped in CollapsibleSection) */
    hideHeader?: boolean
}

type FrameType = "firstFrame" | "lastFrame"

/** Maximum number of recent images to show inline */
const MAX_INLINE_RECENT_IMAGES = 3

/**
 * Component to manage reference images for video frame interpolation.
 * Uses a horizontal layout with square upload areas for a more compact design.
 */
export function VideoReferenceImagePicker({
    selectedImages,
    onImagesChange,
    supportsInterpolation = false,
    disabled,
    hideHeader = false,
}: VideoReferenceImagePickerProps) {
    const recentImages = useReferenceImages()
    const isLoadingRecent = recentImages === undefined
    const deleteMutation = useDeleteReferenceImage()

    const [uploadProgress, setUploadProgress] = useState<number | null>(null)
    const [uploadFilename, setUploadFilename] = useState<string>("")
    const [uploadingFor, setUploadingFor] = useState<FrameType | null>(null)
    const [browserOpen, setBrowserOpen] = useState(false)
    const [browserFrameType, setBrowserFrameType] = useState<FrameType | null>(null)

    const uploadMutation = useUploadReference({
        onProgress: (progress) => setUploadProgress(progress),
    })

    const firstFrameInputRef = useRef<HTMLInputElement>(null)
    const lastFrameInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, frameType: FrameType) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadFilename(file.name)
        setUploadProgress(0)
        setUploadingFor(frameType)

        try {
            const result = await uploadMutation.mutateAsync(file)
            onImagesChange({
                ...selectedImages,
                [frameType]: result.url,
            })
            toast.success(`${frameType === "firstFrame" ? "First" : "Last"} frame uploaded`)
        } catch (error) {
            console.error("Upload failed:", error)
            toast.error(`Failed to upload ${frameType === "firstFrame" ? "first" : "last"} frame`)
        } finally {
            if (frameType === "firstFrame" && firstFrameInputRef.current) {
                firstFrameInputRef.current.value = ""
            }
            if (frameType === "lastFrame" && lastFrameInputRef.current) {
                lastFrameInputRef.current.value = ""
            }
            setUploadProgress(null)
            setUploadingFor(null)
        }
    }

    const handleClearFrame = useCallback((frameType: FrameType) => {
        onImagesChange({
            ...selectedImages,
            [frameType]: undefined,
        })
    }, [selectedImages, onImagesChange])

    const handleSelectFromRecent = useCallback((url: string, frameType: FrameType) => {
        onImagesChange({
            ...selectedImages,
            [frameType]: url,
        })
    }, [selectedImages, onImagesChange])

    const handleOpenBrowser = useCallback((frameType: FrameType) => {
        setBrowserFrameType(frameType)
        setBrowserOpen(true)
    }, [])

    const handleBrowserSelect = useCallback((url: string) => {
        if (browserFrameType) {
            onImagesChange({
                ...selectedImages,
                [browserFrameType]: url,
            })
            setBrowserOpen(false)
            setBrowserFrameType(null)
        }
    }, [browserFrameType, selectedImages, onImagesChange])

    // Get count of selected frames for display
    const frameCount = (selectedImages.firstFrame ? 1 : 0) + (selectedImages.lastFrame ? 1 : 0)

    // Get available recent images (excluding already selected ones)
    const availableRecentImages = recentImages?.filter(
        img => img.url !== selectedImages.firstFrame && img.url !== selectedImages.lastFrame
    ) ?? []
    const hasMoreImages = availableRecentImages.length > MAX_INLINE_RECENT_IMAGES

    // Render a single frame upload area (square)
    const renderFrameUpload = (
        frameType: FrameType,
        label: string,
        icon: React.ReactNode,
        inputRef: React.RefObject<HTMLInputElement | null>,
    ) => {
        const selectedUrl = selectedImages[frameType]
        const isUploading = uploadingFor === frameType

        return (
            <div className="flex flex-col items-center gap-2" data-testid={`${frameType}-slot`}>
                {/* Label */}
                <div className="flex items-center gap-1.5">
                    {icon}
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                </div>

                {/* Upload area - square aspect ratio */}
                {selectedUrl ? (
                    <div className="relative group aspect-square w-32 rounded-lg overflow-hidden border-2 border-primary/50 ring-2 ring-primary/20">
                        <Image
                            src={selectedUrl}
                            alt={`${label} image`}
                            fill
                            className="object-cover"
                        />
                        <button
                            onClick={() => handleClearFrame(frameType)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            data-testid={`clear-${frameType}-button`}
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled || isUploading}
                        className={cn(
                            "aspect-square w-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center transition-colors hover:border-primary/50 hover:bg-primary/5",
                            (disabled || isUploading) && "opacity-50 cursor-not-allowed"
                        )}
                        data-testid={`upload-${frameType}-button`}
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground mt-1.5 font-medium">Upload</span>
                            </>
                        )}
                    </button>
                )}

                {/* More button to open browser */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenBrowser(frameType)}
                    className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
                    data-testid={`browse-${frameType}-button`}
                >
                    <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                    Browse
                </Button>

                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, frameType)}
                />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Video Frames</span>
                    </div>
                    {frameCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onImagesChange({ firstFrame: undefined, lastFrame: undefined })}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
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

            {/* Horizontal layout for frame slots */}
            <div className="flex items-start gap-6" data-testid="frames-container">
                {/* First Frame */}
                {renderFrameUpload(
                    "firstFrame",
                    "Start",
                    <Play className="h-3.5 w-3.5 text-muted-foreground" />,
                    firstFrameInputRef,
                )}

                {/* Arrow indicator (only when interpolation is supported) */}
                {supportsInterpolation && (
                    <div className="flex items-center justify-center h-32 mt-7">
                        <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                )}

                {/* Last Frame (only if interpolation is supported) */}
                {supportsInterpolation && (
                    renderFrameUpload(
                        "lastFrame",
                        "End",
                        <Target className="h-3.5 w-3.5 text-muted-foreground" />,
                        lastFrameInputRef,
                    )
                )}
            </div>

            {/* Recent images with More button */}
            {!isLoadingRecent && availableRecentImages.length > 0 && (
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                            Recent uploads
                        </span>
                        {hasMoreImages && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenBrowser("firstFrame")}
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
                                    className="relative group aspect-square w-16 rounded-md overflow-hidden border border-border cursor-pointer ring-offset-background transition-all hover:ring-2 hover:ring-primary/20"
                                    data-testid="recent-image-thumbnail"
                                >
                                    <button
                                        onClick={() => handleSelectFromRecent(img.url, "firstFrame")}
                                        className="w-full h-full relative"
                                        data-testid={`select-recent-${img._id}`}
                                    >
                                        <Image
                                            src={img.url}
                                            alt="Reference image"
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                    </button>
                                    {/* Quick select for last frame (if interpolation supported) */}
                                    {supportsInterpolation && (
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleSelectFromRecent(img.url, "firstFrame")
                                                }}
                                                className="flex-1 py-1.5 text-[10px] uppercase font-medium text-white hover:bg-white/20 transition-colors border-r border-white/10"
                                                title="Set as start frame"
                                            >
                                                Start
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleSelectFromRecent(img.url, "lastFrame")
                                                }}
                                                className="flex-1 py-1.5 text-[10px] uppercase font-medium text-white hover:bg-white/20 transition-colors"
                                                title="Set as end frame"
                                            >
                                                End
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            <p className="text-sm text-muted-foreground italic">
                {selectedImages.firstFrame && selectedImages.lastFrame
                    ? "Video will interpolate between first and last frames"
                    : selectedImages.firstFrame
                        ? "Video will start from the first frame"
                        : supportsInterpolation
                            ? "Upload frames to guide video generation"
                            : "Upload a starting frame for the video"}
            </p>

            {/* Browser Modal */}
            <ReferenceImagesBrowserModal
                open={browserOpen}
                onOpenChange={setBrowserOpen}
                onSelect={handleBrowserSelect}
                title={`Select ${browserFrameType === "lastFrame" ? "Last" : "First"} Frame`}
                description="Choose a reference image from your library"
                selectedUrls={[selectedImages.firstFrame, selectedImages.lastFrame].filter(Boolean) as string[]}
            />
        </div>
    )
}
