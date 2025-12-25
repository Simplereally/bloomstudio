"use client"

import { useReferenceImages } from "@/hooks/queries/use-reference-images"
import { useUploadReference } from "@/hooks/mutations/use-upload-reference"
import { useDeleteReferenceImage } from "@/hooks/mutations/use-delete-image"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, X, Image as ImageIcon, Upload } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { UploadProgress } from "@/components/studio/upload-progress"
import { DeleteImageDialog } from "@/components/studio/delete-image-dialog"

interface ReferenceImagePickerProps {
    selectedImage?: string
    onSelect: (url: string | undefined) => void
    disabled?: boolean
}

/**
 * Component to manage and select reference images for image-to-image generation.
 */
export function ReferenceImagePicker({ selectedImage, onSelect, disabled }: ReferenceImagePickerProps) {
    const recentImages = useReferenceImages()
    const isLoadingRecent = recentImages === undefined
    const deleteMutation = useDeleteReferenceImage()

    const [uploadProgress, setUploadProgress] = useState<number | null>(null)
    const [uploadFilename, setUploadFilename] = useState<string>("")

    const uploadMutation = useUploadReference({
        onProgress: (progress) => setUploadProgress(progress)
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadFilename(file.name)
        setUploadProgress(0)

        try {
            const result = await uploadMutation.mutateAsync(file)
            onSelect(result.url)
            toast.success("Reference image uploaded")
        } catch (error) {
            console.error("Upload failed:", error)
            toast.error("Failed to upload reference image")
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = ""
            setUploadProgress(null)
        }
    }

    return (
        <div className="space-y-3">
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
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || uploadMutation.isPending}
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
                {!isLoadingRecent && recentImages && recentImages.length > 0 && (
                    <div className="flex gap-2 pb-1 scrollbar-none flex-wrap">
                        {recentImages
                            .filter(img => img.url !== selectedImage)
                            .slice(0, 5) // Increased limit to 5 thumbnails
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

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
            />

            <p className="text-[10px] text-muted-foreground italic">
                {selectedImage
                    ? "Used as visual guide for generation"
                    : "Upload an image to use as a style or structure reference"}
            </p>
        </div>
    )
}
