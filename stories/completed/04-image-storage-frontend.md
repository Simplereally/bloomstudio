# Story: Frontend Integration & UI Components

> **Epic:** Image Persistence & Storage  
> **Priority:** High  
> **Status:** Completed ✅
> **Phase:** 4 of 5

## Overview

Build the frontend hooks and UI components to integrate with the image storage system, including image history, reference image uploads, and visibility controls.

## Background

With API routes in place (Phase 3), the frontend needs to:
1. Display user's generated image history
2. Enable reference image uploads for image-to-image
3. Provide visibility toggle for generated images
4. Store image metadata in Convex after generation

---

## Acceptance Criteria

### 1. Image History Hook
- [x] Create `hooks/queries/use-image-history.ts`
- [x] Fetch user's generated images from Convex (paginated)
- [x] Support filtering by type (generated only for now)
- [x] Enable infinite scroll / load more functionality

### 2. Public Feed Hook
- [x] Create `hooks/queries/use-public-feed.ts`
- [x] Fetch public images for community feed
- [x] Support pagination

### 3. Reference Images Hook
- [x] Create `hooks/queries/use-reference-images.ts`
- [x] Fetch user's uploaded reference images
- [x] Limit to reasonable count (50) for picker UI

### 4. Upload Reference Hook
- [x] Create `hooks/mutations/use-upload-reference.ts`
- [x] Upload file via `/api/upload`
- [x] Store metadata in Convex after successful upload
- [x] Handle loading and error states

### 5. Update useGenerateImage Hook
- [x] Modify to store image metadata in Convex after generation
- [x] Extract r2Key, sizeBytes, contentType from response
- [x] Call Convex mutation to persist metadata

### 6. Image History UI Component
- [x] Create `components/gallery/image-history.tsx`
- [x] Grid layout for image thumbnails
- [x] Click to view full size
- [x] Load more pagination
- [x] Empty state when no images

### 7. Visibility Toggle Component
- [x] Create `components/gallery/visibility-toggle.tsx`
- [x] Switch between public/unlisted
- [x] Show current state with icon
- [x] Call Convex mutation on toggle

---

## Implementation

### Image History Hook (`hooks/queries/use-image-history.ts`)

```typescript
"use client"

import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useImageHistory() {
    return usePaginatedQuery(
        api.generatedImages.getMyImages,
        {},
        { initialNumItems: 20 }
    )
}

export function usePublicFeed() {
    return usePaginatedQuery(
        api.generatedImages.getPublicFeed,
        {},
        { initialNumItems: 20 }
    )
}
```

### Reference Images Hook (`hooks/queries/use-reference-images.ts`)

```typescript
"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useReferenceImages() {
    return useQuery(api.referenceImages.getMyImages)
}
```

### Upload Reference Hook (`hooks/mutations/use-upload-reference.ts`)

```typescript
"use client"

import { useMutation as useConvexMutation } from "convex/react"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/convex/_generated/api"

interface UploadResult {
    url: string
    r2Key: string
    contentType: string
    sizeBytes: number
}

export function useUploadReference() {
    const createImage = useConvexMutation(api.referenceImages.create)

    return useMutation({
        mutationFn: async (file: File): Promise<UploadResult> => {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()
            if (!data.success) {
                throw new Error(data.error.message)
            }

            // Store metadata in Convex
            await createImage({
                r2Key: data.data.r2Key,
                url: data.data.url,
                filename: file.name,
                contentType: data.data.contentType,
                sizeBytes: data.data.sizeBytes,
            })

            return data.data
        },
    })
}
```

### Updated useGenerateImage Integration

```typescript
// In the onSuccess callback of useGenerateImage:
onSuccess: async (image, params) => {
    // Existing query invalidation...
    
    // Store in Convex if r2Key is present
    if (image.r2Key) {
        await createGeneratedImage({
            visibility: "unlisted", // Default to unlisted
            r2Key: image.r2Key,
            url: image.url,
            filename: image.id,
            contentType: image.contentType || "image/jpeg",
            sizeBytes: image.sizeBytes || 0,
            prompt: image.prompt,
            model: params.model,
            seed: params.seed,
            generationParams: params,
        })
    }
    
    options.onSuccess?.(image, params)
}
```

### Image History Component (`components/gallery/image-history.tsx`)

```tsx
"use client"

import { useImageHistory } from "@/hooks/queries/use-image-history"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

export function ImageHistory() {
    const { results, status, loadMore, isLoading } = useImageHistory()

    if (status === "LoadingFirstPage") {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
            </div>
        )
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No images yet. Start generating!</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((image) => (
                    <div
                        key={image._id}
                        className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                        <Image
                            src={image.url}
                            alt={image.prompt || "Generated image"}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <p className="text-white text-xs line-clamp-2">
                                {image.prompt}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            
            {status === "CanLoadMore" && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={() => loadMore(20)}
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Load More"}
                    </Button>
                </div>
            )}
        </div>
    )
}
```

### Visibility Toggle Component (`components/gallery/visibility-toggle.tsx`)

```tsx
"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

interface VisibilityToggleProps {
    imageId: Id<"generatedImages">
    currentVisibility: "public" | "unlisted"
}

export function VisibilityToggle({ imageId, currentVisibility }: VisibilityToggleProps) {
    const setVisibility = useMutation(api.generatedImages.setVisibility)

    const handleToggle = async () => {
        const newVisibility = currentVisibility === "public" ? "unlisted" : "public"
        await setVisibility({ id: imageId, visibility: newVisibility })
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            title={currentVisibility === "public" ? "Make unlisted" : "Make public"}
        >
            {currentVisibility === "public" ? (
                <Eye className="h-4 w-4" />
            ) : (
                <EyeOff className="h-4 w-4" />
            )}
        </Button>
    )
}
```

---

## UI/UX Considerations

### Image Grid
- Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop
- Lazy load images with blur placeholder
- Hover overlay shows prompt preview

### Loading States
- Skeleton grid during initial load
- Inline loading indicator for "Load More"
- Optimistic updates for visibility toggle

### Empty States
- Friendly message encouraging first generation
- Quick action button to start generating

---

## Testing Checklist

- [x] View image history → verify images load
- [x] Scroll to bottom → verify load more works
- [x] Empty state → verify message when no images
- [x] Click image → verify opens full view
- [x] Toggle visibility → verify updates immediately
- [x] Upload reference → verify appears in reference picker
- [x] Generate image → verify appears in history

---

## Related Documents

- [Image Storage Implementation Plan](./image-storage-implementation.md)
- [Phase 3: API Routes](./03-image-storage-api-routes.md)
