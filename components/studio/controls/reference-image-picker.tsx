"use client"

import { DeleteImageDialog } from "@/components/studio/delete-image-dialog"
import { UploadProgress } from "@/components/studio/upload-progress"
import { ReferenceImagesBrowserModal } from "@/components/studio/controls/reference-images-browser-modal"
import { Button } from "@/components/ui/button"
import { useDeleteReferenceImage } from "@/hooks/mutations/use-delete-image"
import { useUploadReference } from "@/hooks/mutations/use-upload-reference"
import { useReferenceImages } from "@/hooks/queries/use-reference-images"
import { cn } from "@/lib/utils"
import type { ThumbnailData } from "@/components/studio/gallery/types"
import { Image as ImageIcon, Loader2, Upload, X, MoreHorizontal } from "lucide-react"
import Image from "next/image"
import { useRef, useMemo, useState } from "react"
import { toast } from "sonner"

interface ReferenceImagePickerProps {
    selectedImage?: string
    onSelect: (url: string | undefined) => void
    disabled?: boolean
    /** Hide the header (when wrapped in CollapsibleSection) */
    hideHeader?: boolean
    /** Pre-loaded history images from the gallery (passed to browser modal) */
    historyImages?: ThumbnailData[]
}

/**
 * Component to manage and select reference images for image-to-image generation.
 */
export function ReferenceImagePicker({ selectedImage, onSelect, disabled, hideHeader = false, historyImages }: ReferenceImagePickerProps) {
    const recentImages = useReferenceImages()
    const deleteMutation = useDeleteReferenceImage()

    const [uploadProgress, setUploadProgress] = useState<number | null>(null)
    const [uploadFilename, setUploadFilename] = useState<string>("")
    const [browserOpen, setBrowserOpen] = useState(false)

    const uploadMutation = useUploadReference({
        onProgress: (progress) => setUploadProgress(progress)
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Client-side validation for file size (10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File is too large. Maximum size is 10MB.")
            if (fileInputRef.current) fileInputRef.current.value = ""
            return
        }

        setUploadFilename(file.name)
        setUploadProgress(0)

        try {
            const result = await uploadMutation.mutateAsync(file)
            onSelect(result.url)
            toast.success("Reference image uploaded")
        } catch (error) {
            console.error("Upload failed:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to upload reference image"
            toast.error(errorMessage)
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = ""
            setUploadProgress(null)
        }
    }

    const handleBrowserSelect = (url: string) => {
        onSelect(url)
        setBrowserOpen(false)
    }

    const selectedUrls = useMemo(
        () => selectedImage ? [selectedImage] : [],
        [selectedImage],
    )

    return (
        <div className="space-y-3">
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Reference Image</span>
                    </div>
                    {selectedImage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelect(undefined)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear
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

            {/* Selected Image Preview / Upload Button */}
            <div className="flex gap-2 flex-wrap">
                {selectedImage ? (
                    <div className="relative group aspect-square w-20 rounded-lg overflow-hidden border border-primary/50 ring-2 ring-primary/20">
                        <Image
                            src={selectedImage}
                            alt="Selected reference"
                            fill
                            className="object-cover"
                        />
                        <button
                            onClick={() => onSelect(undefined)}
                            aria-label="Remove selected image"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || uploadMutation.isPending}
                        aria-label="Upload reference image"
                        className={cn(
                            "aspect-square w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center transition-colors hover:border-primary/50 hover:bg-primary/5",
                            (disabled || uploadMutation.isPending) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {uploadMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground mt-1 font-medium">Upload</span>
                            </>
                        )}
                    </button>
                )}

                {/* Recent Images List */}
                {recentImages && recentImages.length > 0 && (
                    <div className="flex gap-2 pb-1 scrollbar-none flex-wrap">
                        {recentImages
                            .filter(img => img.url !== selectedImage)
                            .slice(0, 5)
                            .map((img) => (
                                <div key={img._id} className="relative group aspect-square w-20 rounded-lg overflow-hidden border border-border">
                                    <button
                                        onClick={() => onSelect(img.url)}
                                        className="w-full h-full relative opacity-70 group-hover:opacity-100 transition-all"
                                    >
                                        <Image
                                            src={img.url}
                                            alt="Reference image"
                                            fill
                                            className="object-cover"
                                        />
                                    </button>
                                    <div className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-bl-lg">
                                        <DeleteImageDialog
                                            title="Delete Reference"
                                            onConfirm={async () => {
                                                await deleteMutation.mutateAsync(img._id)
                                            }}
                                            isDeleting={deleteMutation.isPending}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Browse button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setBrowserOpen(true)}
                disabled={disabled}
                className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
                data-testid="browse-references-button"
            >
                <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                Browse Library
            </Button>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
                aria-label="Upload reference image file"
            />

            <p className="text-[12px] text-muted-foreground italic">
                {selectedImage
                    ? "Used as visual guide for generation"
                    : "Upload an image to use as a style or structure reference"}
            </p>

            {/* Browser Modal */}
            <ReferenceImagesBrowserModal
                open={browserOpen}
                onOpenChange={setBrowserOpen}
                onSelect={handleBrowserSelect}
                title="Browse Reference Images"
                description="Select an image from your uploads or generation history"
                selectedUrls={selectedUrls}
                allowVideo={false}
                historyImages={historyImages}
            />
        </div>
    )
}
