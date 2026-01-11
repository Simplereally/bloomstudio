"use client"

/**
 * ReferenceImagesBrowserModal - Modal for browsing and selecting reference images
 * 
 * Displays all uploaded reference images with search/filter capability.
 * Used by VideoReferenceImagePicker to allow users to browse through
 * their full library of reference images.
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useReferenceImages } from "@/hooks/queries/use-reference-images"
import { useDeleteReferenceImage } from "@/hooks/mutations/use-delete-image"
import { DeleteImageDialog } from "@/components/studio/delete-image-dialog"
import { cn } from "@/lib/utils"
import { Search, Loader2, Image as ImageIcon, X } from "lucide-react"
import Image from "next/image"
import { useState, useMemo } from "react"

interface ReferenceImagesBrowserModalProps {
    /** Whether the modal is open */
    open: boolean
    /** Callback when the modal closes */
    onOpenChange: (open: boolean) => void
    /** Callback when an image is selected */
    onSelect: (url: string) => void
    /** Title for the modal */
    title?: string
    /** Description for the modal */
    description?: string
    /** Currently selected image URLs to highlight */
    selectedUrls?: string[]
}

/**
 * Modal component for browsing all reference images with search functionality.
 */
export function ReferenceImagesBrowserModal({
    open,
    onOpenChange,
    onSelect,
    title = "Browse Reference Images",
    description = "Select an image from your library",
    selectedUrls = [],
}: ReferenceImagesBrowserModalProps) {
    const recentImages = useReferenceImages()
    const isLoading = recentImages === undefined
    const deleteMutation = useDeleteReferenceImage()
    const [searchQuery, setSearchQuery] = useState("")

    // Filter images based on search query (by filename or date)
    const filteredImages = useMemo(() => {
        if (!recentImages) return []
        if (!searchQuery.trim()) return recentImages
        
        const query = searchQuery.toLowerCase()
        return recentImages.filter((img) => {
            // Search by URL (filename portion)
            const filename = img.url.split("/").pop()?.toLowerCase() ?? ""
            return filename.includes(query)
        })
    }, [recentImages, searchQuery])

    const handleSelect = (url: string) => {
        onSelect(url)
    }

    const handleClearSearch = () => {
        setSearchQuery("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {/* Search input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search images..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9"
                        data-testid="reference-images-search"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            data-testid="clear-search-button"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Images grid */}
                <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? "No images match your search"
                                    : "No reference images uploaded yet"}
                            </p>
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearSearch}
                                    className="mt-2"
                                >
                                    Clear search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div
                            className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 p-1"
                            data-testid="reference-images-grid"
                        >
                            {filteredImages.map((img) => {
                                const isSelected = selectedUrls.includes(img.url)
                                return (
                                    <div
                                        key={img._id}
                                        className={cn(
                                            "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                                            isSelected
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-border hover:border-primary/50"
                                        )}
                                        data-testid="reference-image-item"
                                    >
                                        <button
                                            onClick={() => handleSelect(img.url)}
                                            className="w-full h-full relative"
                                            data-testid={`select-image-${img._id}`}
                                        >
                                            <Image
                                                src={img.url}
                                                alt="Reference image"
                                                fill
                                                className="object-cover"
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                        {/* Delete button overlay */}
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DeleteImageDialog
                                                title="Delete Reference"
                                                onConfirm={async () => {
                                                    await deleteMutation.mutateAsync(img._id)
                                                }}
                                                isDeleting={deleteMutation.isPending}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer with count */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                        {isLoading
                            ? "Loading..."
                            : `${filteredImages.length} image${filteredImages.length !== 1 ? "s" : ""}`}
                    </span>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
