# Story: Polish, Error Handling & Testing

> **Epic:** Image Persistence & Storage  
> **Priority:** Medium  
> **Status:** Draft  
> **Phase:** 5 of 5

## Overview

Add polish, comprehensive error handling, loading states, and end-to-end testing to ensure the image storage system is production-ready.

## Background

With core functionality complete (Phases 1-4), this final phase focuses on:
1. Robust error handling and retry logic
2. Smooth loading and progress states
3. Image deletion flow
4. End-to-end testing
5. Edge case handling

---

## Acceptance Criteria

### 1. Error Handling
- [ ] Add retry logic to R2 uploads (3 attempts with exponential backoff)
- [ ] Handle network failures gracefully in upload hooks
- [ ] Display user-friendly error messages via toast notifications
- [ ] Log errors with context for debugging
- [ ] Handle Convex connection issues

### 2. Loading States
- [ ] Show upload progress for reference images
- [ ] Add skeleton loaders for image grids
- [ ] Show saving indicator when storing to Convex
- [ ] Disable actions during pending operations

### 3. Image Deletion Flow
- [ ] Add delete button to image cards
- [ ] Confirm before deletion (optional setting)
- [ ] Delete from R2 first, then Convex
- [ ] Handle partial deletion failures
- [ ] Optimistic UI update with rollback on error

### 4. End-to-End Testing
- [ ] Test full generation → storage → display flow
- [ ] Test upload → storage → picker flow
- [ ] Test visibility toggle updates feed
- [ ] Test deletion removes from both R2 and Convex
- [ ] Test error states show appropriate UI

### 5. Edge Cases
- [ ] Handle duplicate uploads (same file name)
- [ ] Handle very large images (optimize/warn)
- [ ] Handle unsupported formats gracefully
- [ ] Handle quota exceeded (future)
- [ ] Handle concurrent operations

---

## Implementation

### Retry Logic (`lib/storage/retry.ts`)

```typescript
/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
    maxAttempts?: number
    initialDelayMs?: number
    maxDelayMs?: number
    shouldRetry?: (error: unknown) => boolean
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelayMs = 1000,
        maxDelayMs = 10000,
        shouldRetry = () => true,
    } = options

    let lastError: unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            
            if (attempt === maxAttempts || !shouldRetry(error)) {
                throw error
            }

            const delay = Math.min(
                initialDelayMs * Math.pow(2, attempt - 1),
                maxDelayMs
            )
            
            console.warn(
                `[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`,
                error
            )
            
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    throw lastError
}

/**
 * Check if an error is retryable (network errors, 5xx responses)
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        // Network errors
        if (error.message.includes("fetch") || error.message.includes("network")) {
            return true
        }
    }
    
    // R2/S3 errors with status codes
    if (typeof error === "object" && error !== null && "$metadata" in error) {
        const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        const status = metadata?.httpStatusCode
        return status !== undefined && status >= 500
    }
    
    return false
}
```

### Updated Upload with Retry

```typescript
// In lib/storage/r2-client.ts

import { withRetry, isRetryableError } from "./retry"

export async function uploadImage(options: UploadImageOptions): Promise<UploadResult> {
    return withRetry(
        async () => {
            const { data, contentType, key, cacheControl = "public, max-age=31536000, immutable" } = options

            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME(),
                Key: key,
                Body: data,
                ContentType: contentType,
                CacheControl: cacheControl,
            })

            await getClient().send(command)

            return {
                key,
                url: `${PUBLIC_URL()}/${key}`,
                sizeBytes: data.length,
            }
        },
        {
            maxAttempts: 3,
            shouldRetry: isRetryableError,
        }
    )
}
```

### Delete Image Hook (`hooks/mutations/use-delete-image.ts`)

```typescript
"use client"

import { useMutation as useConvexMutation } from "convex/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"

export function useDeleteGeneratedImage() {
    const removeImage = useConvexMutation(api.generatedImages.remove)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (imageId: Id<"generatedImages">) => {
            // Delete from Convex (returns r2Key)
            const result = await removeImage({ id: imageId })
            
            // Delete from R2 via API route
            if (result.r2Key) {
                const response = await fetch("/api/images/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ r2Key: result.r2Key }),
                })
                
                if (!response.ok) {
                    console.error("Failed to delete from R2, orphaned object:", result.r2Key)
                    // Don't throw - Convex record is already deleted
                }
            }
            
            return result
        },
        onSuccess: () => {
            toast.success("Image deleted")
            queryClient.invalidateQueries({ queryKey: ["images"] })
        },
        onError: (error) => {
            toast.error("Failed to delete image", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        },
    })
}

export function useDeleteReferenceImage() {
    const removeImage = useConvexMutation(api.referenceImages.remove)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (imageId: Id<"referenceImages">) => {
            const result = await removeImage({ id: imageId })
            
            if (result.r2Key) {
                await fetch("/api/images/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ r2Key: result.r2Key }),
                })
            }
            
            return result
        },
        onSuccess: () => {
            toast.success("Reference image deleted")
            queryClient.invalidateQueries({ queryKey: ["referenceImages"] })
        },
        onError: (error) => {
            toast.error("Failed to delete image", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        },
    })
}
```

### R2 Delete API Route (`app/api/images/delete/route.ts`)

```typescript
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { deleteImage } from "@/lib/storage"

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { r2Key } = await request.json()
        
        if (!r2Key || typeof r2Key !== "string") {
            return NextResponse.json({ error: "Missing r2Key" }, { status: 400 })
        }

        // Verify the key belongs to this user (path should include userId)
        if (!r2Key.includes(`/${userId}/`)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await deleteImage(r2Key)
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[/api/images/delete] Error:", error)
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}
```

### Upload Progress Component

```tsx
"use client"

import { Progress } from "@/components/ui/progress"

interface UploadProgressProps {
    progress: number
    filename: string
}

export function UploadProgress({ progress, filename }: UploadProgressProps) {
    return (
        <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex justify-between text-sm">
                <span className="truncate max-w-[200px]">{filename}</span>
                <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
        </div>
    )
}
```

### Delete Confirmation Dialog

```tsx
"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteImageDialogProps {
    onConfirm: () => void
    isDeleting?: boolean
}

export function DeleteImageDialog({ onConfirm, isDeleting }: DeleteImageDialogProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Image</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. The image will be permanently deleted from your gallery.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
```

---

## Testing Checklist

### Happy Path
- [ ] Generate image → appears in history
- [ ] Upload reference → appears in picker
- [ ] Toggle visibility → feed updates correctly
- [ ] Delete image → removed from gallery and R2
- [ ] Share public URL → accessible to anyone

### Error Cases
- [ ] Upload with no network → shows retry message
- [ ] Generate with API down → shows error toast
- [ ] Delete fails → shows error, image remains
- [ ] Invalid file type → shows validation error

### Edge Cases
- [ ] Upload same file twice → both stored with unique keys
- [ ] Very large file → rejected with size error
- [ ] Rapid toggling visibility → no race conditions
- [ ] Delete while generating → handled gracefully

---

## Performance Considerations

- Use `react-query` caching to avoid refetching
- Implement virtual scrolling for large galleries
- Lazy load images with `loading="lazy"` or Intersection Observer
- Optimize image sizes for thumbnails (consider R2 transforms)

---

## Related Documents

- [Image Storage Implementation Plan](./image-storage-implementation.md)
- [Phase 4: Frontend Integration](./04-image-storage-frontend.md)
