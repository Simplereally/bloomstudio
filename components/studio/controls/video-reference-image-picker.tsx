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
 */

import { DeleteImageDialog } from "@/components/studio/delete-image-dialog"
import { UploadProgress } from "@/components/studio/upload-progress"
import { Button } from "@/components/ui/button"
import { useDeleteReferenceImage } from "@/hooks/mutations/use-delete-image"
import { useUploadReference } from "@/hooks/mutations/use-upload-reference"
import { useReferenceImages } from "@/hooks/queries/use-reference-images"
import { cn } from "@/lib/utils"
import { Image as ImageIcon, Loader2, Upload, X, Play, Target } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
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

/**
 * Component to manage reference images for video frame interpolation.
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

    const handleClearFrame = (frameType: FrameType) => {
        onImagesChange({
            ...selectedImages,
            [frameType]: undefined,
        })
    }

    const handleSelectFromRecent = (url: string, frameType: FrameType) => {
        onImagesChange({
            ...selectedImages,
            [frameType]: url,
        })
    }

    // Get count of selected frames for display
    const frameCount = (selectedImages.firstFrame ? 1 : 0) + (selectedImages.lastFrame ? 1 : 0)

    // Render a frame slot (first or last)
    const renderFrameSlot = (
        frameType: FrameType,
        label: string,
        icon: React.ReactNode,
        inputRef: React.RefObject<HTMLInputElement | null>,
    ) => {
        const selectedUrl = selectedImages[frameType]
        const isUploading = uploadingFor === frameType

        return (
            <div className="space-y-2" data-testid={`${frameType}-slot`}>
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    {selectedUrl && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearFrame(frameType)}
                            className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive ml-auto"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                <div className="flex gap-2 flex-wrap">
                    {selectedUrl ? (
                        <div className="relative group aspect-video w-24 rounded-lg overflow-hidden border border-primary/50 ring-2 ring-primary/20">
                            <Image
                                src={selectedUrl}
                                alt={`${label} image`}
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={() => handleClearFrame(frameType)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => inputRef.current?.click()}
                            disabled={disabled || isUploading}
                            className={cn(
                                "aspect-video w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center transition-colors hover:border-primary/50 hover:bg-primary/5",
                                (disabled || isUploading) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isUploading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground mt-1 font-medium">Upload</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Recent images for this slot */}
                    {!isLoadingRecent && recentImages && recentImages.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                            {recentImages
                                .filter(img => img.url !== selectedUrl && img.url !== selectedImages.firstFrame && img.url !== selectedImages.lastFrame)
                                .slice(0, 3)
                                .map((img) => (
                                    <div key={img._id} className="relative group aspect-video w-16 rounded-md overflow-hidden border border-border">
                                        <button
                                            onClick={() => handleSelectFromRecent(img.url, frameType)}
                                            className="w-full h-full relative opacity-60 group-hover:opacity-100 transition-all"
                                        >
                                            <Image
                                                src={img.url}
                                                alt="Reference image"
                                                fill
                                                className="object-cover"
                                            />
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

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
                            <X className="h-3 w-3 mr-1" />
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

            {/* First Frame (always shown) */}
            {renderFrameSlot(
                "firstFrame",
                "First Frame (Start)",
                <Play className="h-3 w-3 text-muted-foreground" />,
                firstFrameInputRef,
            )}

            {/* Last Frame (only if interpolation is supported) */}
            {supportsInterpolation && (
                <>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-px flex-1 bg-border" />
                        <span>Interpolation</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                    {renderFrameSlot(
                        "lastFrame",
                        "Last Frame (End)",
                        <Target className="h-3 w-3 text-muted-foreground" />,
                        lastFrameInputRef,
                    )}
                </>
            )}

            <p className="text-[12px] text-muted-foreground italic">
                {selectedImages.firstFrame && selectedImages.lastFrame
                    ? "Video will interpolate between first and last frames"
                    : selectedImages.firstFrame
                        ? "Video will start from the first frame"
                        : supportsInterpolation
                            ? "Upload frames to guide video generation"
                            : "Upload a starting frame for the video"}
            </p>
        </div>
    )
}
