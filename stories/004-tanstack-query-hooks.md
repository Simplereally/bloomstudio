# Story 004: Update TanStack Query Hooks

## Overview
Update existing TanStack Query hooks to use the new Zod-validated types and enhanced API functions, ensuring proper integration with the migrated service layer.

## Priority: High
## Estimated Effort: 3 hours
## Dependencies: Story 001 (Zod Schemas), Story 002 (API Service)

---

## Background

The existing hooks in `hooks/queries/` work well but need updates for:
- New Zod-validated types
- Enhanced error handling with `PollinationsApiError`
- New generation parameters (quality, transparent, guidance_scale)
- Query key updates for proper caching

---

## Technical Specification

### Stack Requirements
- **TanStack Query**: v5.9
- **React**: 19.2
- **Zod**: v4.2.1

### Files to Modify

#### [MODIFY] `hooks/queries/use-generate-image.ts`
Update types and error handling.

#### [MODIFY] `hooks/queries/use-download-image.ts`
Update error types.

#### [MODIFY] `hooks/queries/index.ts`
Update exports with new types.

#### [MODIFY] `lib/query/query-keys.ts`
Add new query keys for generation history.

---

## Implementation Details

### 1. Update useGenerateImage Hook

```typescript
// hooks/queries/use-generate-image.ts
"use client"

/**
 * useGenerateImage Hook
 *
 * TanStack Query mutation hook for image generation using gen.pollinations.ai.
 * Provides optimistic updates, error handling, and cache management.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { generateImage, PollinationsApiError } from "@/lib/api"
import { queryKeys } from "@/lib/query"
import type {
  ImageGenerationParams,
  GeneratedImage,
  Quality,
} from "@/lib/schemas/pollinations.schema"

/**
 * Options for the useGenerateImage hook
 */
export interface UseGenerateImageOptions {
  /** Callback fired when generation starts */
  onMutate?: (params: ImageGenerationParams) => void | Promise<void>

  /** Callback fired on successful generation */
  onSuccess?: (image: GeneratedImage, params: ImageGenerationParams) => void

  /** Callback fired on generation error */
  onError?: (error: PollinationsApiError, params: ImageGenerationParams) => void

  /** Callback fired after mutation settles (success or error) */
  onSettled?: (
    image: GeneratedImage | undefined,
    error: PollinationsApiError | null,
    params: ImageGenerationParams
  ) => void
}

/**
 * Return type for useGenerateImage hook
 */
export interface UseGenerateImageReturn {
  /** Trigger image generation */
  generate: (params: ImageGenerationParams) => void

  /** Trigger image generation and return a promise */
  generateAsync: (params: ImageGenerationParams) => Promise<GeneratedImage>

  /** Whether generation is in progress */
  isGenerating: boolean

  /** Whether the last generation was successful */
  isSuccess: boolean

  /** Whether the last generation failed */
  isError: boolean

  /** Error from the last failed generation */
  error: PollinationsApiError | null

  /** The last successfully generated image */
  data: GeneratedImage | undefined

  /** Reset the mutation state */
  reset: () => void

  /** Generation progress percentage (for UI feedback) */
  progress: number
}

/**
 * Hook for generating images with TanStack Query.
 *
 * Provides:
 * - Automatic loading state management
 * - Error handling with typed PollinationsApiError
 * - Optional callbacks for side effects
 * - Integration with the query cache
 *
 * @example
 * ```tsx
 * const { generate, isGenerating, error } = useGenerateImage({
 *   onSuccess: (image) => {
 *     console.log('Generated:', image.url)
 *   }
 * })
 *
 * // Trigger generation with new quality param
 * generate({
 *   prompt: 'A beautiful sunset',
 *   model: 'flux',
 *   quality: 'hd',
 *   transparent: false
 * })
 * ```
 */
export function useGenerateImage(
  options: UseGenerateImageOptions = {}
): UseGenerateImageReturn {
  const queryClient = useQueryClient()

  const mutation = useMutation<
    GeneratedImage,
    PollinationsApiError,
    ImageGenerationParams
  >({
    mutationFn: generateImage,

    onMutate: async (params) => {
      await options.onMutate?.(params)
    },

    onSuccess: (image, params) => {
      // Invalidate image-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.images.all,
      })

      // Add to generation history cache
      queryClient.setQueryData<GeneratedImage[]>(
        queryKeys.images.history,
        (old = []) => [image, ...old].slice(0, 50) // Keep last 50
      )

      options.onSuccess?.(image, params)
    },

    onError: (error, params) => {
      options.onError?.(error, params)
    },

    onSettled: (image, error, params) => {
      options.onSettled?.(image, error, params)
    },
  })

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    progress: mutation.isPending ? -1 : mutation.isSuccess ? 100 : 0,
  }
}

// Re-export types for convenience
export type { ImageGenerationParams, GeneratedImage }
```

### 2. Update useDownloadImage Hook

```typescript
// hooks/queries/use-download-image.ts
"use client"

/**
 * useDownloadImage Hook
 *
 * TanStack Query mutation hook for downloading images.
 * Handles blob creation and browser download trigger.
 */

import { useMutation } from "@tanstack/react-query"
import { downloadImage as downloadImageApi, PollinationsApiError } from "@/lib/api"

/**
 * Parameters for download operation
 */
export interface DownloadImageParams {
  /** URL of the image to download */
  url: string
  /** Filename for the downloaded image */
  filename: string
  /** Optional format conversion */
  format?: "jpg" | "png" | "webp"
}

/**
 * Options for the useDownloadImage hook
 */
export interface UseDownloadImageOptions {
  /** Callback fired on successful download */
  onSuccess?: (params: DownloadImageParams) => void
  /** Callback fired on download error */
  onError?: (error: PollinationsApiError, params: DownloadImageParams) => void
}

/**
 * Return type for useDownloadImage hook
 */
export interface UseDownloadImageReturn {
  /** Trigger image download */
  download: (params: DownloadImageParams) => void
  /** Trigger image download and return a promise */
  downloadAsync: (params: DownloadImageParams) => Promise<void>
  /** Whether download is in progress */
  isDownloading: boolean
  /** Whether the last download was successful */
  isSuccess: boolean
  /** Whether the last download failed */
  isError: boolean
  /** Error from the last failed download */
  error: PollinationsApiError | null
}

/**
 * Hook for downloading images with TanStack Query.
 *
 * @example
 * ```tsx
 * const { download, isDownloading } = useDownloadImage({
 *   onSuccess: () => toast.success('Image downloaded!')
 * })
 *
 * download({ url: image.url, filename: 'my-image.jpg' })
 * ```
 */
export function useDownloadImage(
  options: UseDownloadImageOptions = {}
): UseDownloadImageReturn {
  const mutation = useMutation<void, PollinationsApiError, DownloadImageParams>({
    mutationFn: async ({ url, filename, format }) => {
      const blob = await downloadImageApi(url)

      // Convert format if needed
      let finalBlob = blob
      if (format && format !== getExtension(filename)) {
        // Use canvas for format conversion
        const img = await createImageBitmap(blob)
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0)
        
        const mimeType = format === "png" ? "image/png" : 
                         format === "webp" ? "image/webp" : "image/jpeg"
        finalBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), mimeType, 0.92)
        })
      }

      // Create download link and trigger browser download
      const blobUrl = window.URL.createObjectURL(finalBlob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Cleanup
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(link)
    },

    onSuccess: (_, params) => {
      options.onSuccess?.(params)
    },

    onError: (error, params) => {
      options.onError?.(error, params)
    },
  })

  return {
    download: mutation.mutate,
    downloadAsync: mutation.mutateAsync,
    isDownloading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  }
}

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || ""
}
```

### 3. Add Generation History Query

```typescript
// hooks/queries/use-generation-history.ts
"use client"

/**
 * useGenerationHistory Hook
 *
 * TanStack Query hook for accessing generated image history.
 * Reads from the client-side cache populated by useGenerateImage.
 */

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query"
import type { GeneratedImage } from "@/lib/schemas/pollinations.schema"

export interface UseGenerationHistoryReturn {
  /** List of generated images (newest first) */
  history: GeneratedImage[]
  /** Number of images in history */
  count: number
  /** Get a specific image by ID */
  getById: (id: string) => GeneratedImage | undefined
  /** Clear all history */
  clear: () => void
}

export function useGenerationHistory(): UseGenerationHistoryReturn {
  const { data: history = [] } = useQuery<GeneratedImage[]>({
    queryKey: queryKeys.images.history,
    initialData: [],
    staleTime: Infinity, // Client-only cache, never stale
  })

  return {
    history,
    count: history.length,
    getById: (id) => history.find((img) => img.id === id),
    clear: () => {
      // Implementation would use queryClient.setQueryData
    },
  }
}
```

### 4. Update Query Keys

```typescript
// lib/query/query-keys.ts
/**
 * Query Key Factory
 *
 * Centralized query keys for TanStack Query.
 * Ensures consistent cache key structure.
 */

export const queryKeys = {
  images: {
    all: ["images"] as const,
    history: ["images", "history"] as const,
    detail: (id: string) => ["images", "detail", id] as const,
    byPrompt: (prompt: string) => ["images", "prompt", prompt] as const,
  },
  
  models: {
    all: ["models"] as const,
    image: ["models", "image"] as const,
    text: ["models", "text"] as const,
    detail: (name: string) => ["models", "detail", name] as const,
  },
  
  generation: {
    all: ["generation"] as const,
    pending: ["generation", "pending"] as const,
  },
} as const

export type QueryKeys = typeof queryKeys

/**
 * Patterns for bulk invalidation
 */
export const invalidationPatterns = {
  allImages: { queryKey: queryKeys.images.all },
  allModels: { queryKey: queryKeys.models.all },
  allGeneration: { queryKey: queryKeys.generation.all },
} as const
```

### 5. Update Index Exports

```typescript
// hooks/queries/index.ts
export {
  useGenerateImage,
  type UseGenerateImageOptions,
  type UseGenerateImageReturn,
} from "./use-generate-image"

export {
  useDownloadImage,
  type UseDownloadImageOptions,
  type UseDownloadImageReturn,
  type DownloadImageParams,
} from "./use-download-image"

export {
  useImageModels,
  type UseImageModelsOptions,
  type UseImageModelsReturn,
} from "./use-image-models"

export {
  useGenerationHistory,
  type UseGenerationHistoryReturn,
} from "./use-generation-history"

// Re-export commonly used types
export type {
  ImageGenerationParams,
  GeneratedImage,
} from "@/lib/schemas/pollinations.schema"
```

---

## Acceptance Criteria

- [ ] `useGenerateImage` uses `PollinationsApiError` type
- [ ] All hooks use Zod-inferred types from schemas
- [ ] Generation history is cached in TanStack Query
- [ ] Query keys are properly structured
- [ ] Download hook supports optional format conversion
- [ ] All existing tests pass with updated types
- [ ] New hooks are properly exported

---

## Testing Requirements

### Update Existing Tests

```typescript
// hooks/queries/use-generate-image.test.ts
// Update mock to use PollinationsApiError
import { PollinationsApiError } from "@/lib/api"

// Update error test
it("handles generation error with proper type", async () => {
  const error = new PollinationsApiError(
    "Generation failed",
    "GENERATION_FAILED",
    500
  )
  mockGenerateImage.mockRejectedValueOnce(error)

  const onError = vi.fn()
  const { result } = renderHook(
    () => useGenerateImage({ onError }),
    { wrapper: createWrapper() }
  )

  act(() => {
    result.current.generate({ prompt: "test" })
  })

  await waitFor(() => {
    expect(result.current.isError).toBe(true)
  })

  expect(result.current.error).toBeInstanceOf(PollinationsApiError)
  expect(result.current.error?.code).toBe("GENERATION_FAILED")
})
```

### Run Command
```bash
bun test hooks/queries/
```

---

## Related Stories
- Story 001: Zod Schemas (provides types)
- Story 002: API Service (provides functions)
- Story 005: UI Components (uses these hooks)
