# Story 003: Add Dynamic Models Query Hook

## Overview
Replace hardcoded image models with a TanStack Query hook that fetches available models from the `/image/models` endpoint, enabling real-time model availability and pricing information.

## Priority: Medium
## Estimated Effort: 4 hours
## Dependencies: Story 001 (Zod Schemas), Story 002 (API Service)
## Status: Completed

---

## Background

The current implementation has hardcoded models in `lib/image-models.ts`:
- flux, turbo, flux-realism, flux-anime, flux-3d, any-dark

The new API provides a `/image/models` endpoint that returns:
- Available models with descriptions
- Pricing information (in "pollen" currency)
- Model capabilities and metadata

This enables dynamic model discovery and future-proofs the application.

---

## Technical Specification

### Stack Requirements
- **TanStack Query**: v5.9
- **Zod**: v4.2.1
- **React**: 19.2
- **Next.js**: 16.1.0

### Files to Create

#### [NEW] `hooks/queries/use-image-models.ts`
TanStack Query hook for fetching image models.

#### [NEW] `hooks/queries/use-image-models.test.ts`
Test suite for the hook.

#### [NEW] `lib/api/models-api.ts`
API functions for model endpoints.

### Files to Modify

#### [MODIFY] `lib/image-models.ts`
Keep as fallback, mark as deprecated.

#### [MODIFY] `hooks/queries/index.ts`
Export new hook.

---

## Implementation Details

### 1. Create Models API Functions

```typescript
// lib/api/models-api.ts
/**
 * Models API Service
 *
 * Functions for fetching available models from gen.pollinations.ai.
 * Designed to be used with TanStack Query hooks.
 */

import { POLLINATIONS_CONFIG } from "@/lib/config/api.config"
import { PollinationsAPI } from "@/lib/pollinations-api"
import {
  ImageModelsResponseSchema,
  type ImageModelInfo,
} from "@/lib/schemas/pollinations.schema"
import { PollinationsApiError } from "./image-api"

/**
 * Fetches available image models from the API.
 *
 * @returns Promise resolving to array of image model info
 * @throws PollinationsApiError if fetch fails
 */
export async function fetchImageModels(): Promise<ImageModelInfo[]> {
  const url = `${POLLINATIONS_CONFIG.BASE_URL}/image/models`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...PollinationsAPI.getHeaders(),
        Accept: "application/json",
      },
      // Cache for 5 minutes - models don't change frequently
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new PollinationsApiError(
        `Failed to fetch image models: ${response.status}`,
        "MODELS_FETCH_FAILED",
        response.status
      )
    }

    const data = await response.json()
    
    // Validate response with Zod
    return ImageModelsResponseSchema.parse(data)
  } catch (error) {
    if (error instanceof PollinationsApiError) {
      throw error
    }

    throw new PollinationsApiError(
      error instanceof Error
        ? error.message
        : "Failed to fetch image models",
      "MODELS_FETCH_ERROR"
    )
  }
}

/**
 * Get a single model's info by name
 */
export async function fetchImageModel(
  modelName: string
): Promise<ImageModelInfo | undefined> {
  const models = await fetchImageModels()
  return models.find(
    (m) => m.name === modelName || m.aliases.includes(modelName)
  )
}
```

### 2. Create Image Models Query Hook

```typescript
// hooks/queries/use-image-models.ts
"use client"

/**
 * useImageModels Hook
 *
 * TanStack Query hook for fetching available image models.
 * Provides caching, automatic refetching, and error handling.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { fetchImageModels } from "@/lib/api/models-api"
import { queryKeys } from "@/lib/query"
import type { ImageModelInfo } from "@/lib/schemas/pollinations.schema"
import type { PollinationsApiError } from "@/lib/api/image-api"
import { IMAGE_MODELS } from "@/lib/image-models"

/**
 * Options for the useImageModels hook
 */
export interface UseImageModelsOptions {
  /**
   * Whether to fetch models on mount
   * @default true
   */
  enabled?: boolean

  /**
   * Use fallback data if API fails
   * @default true
   */
  useFallback?: boolean

  /**
   * Stale time in milliseconds
   * @default 5 minutes
   */
  staleTime?: number
}

/**
 * Return type for useImageModels hook
 */
export interface UseImageModelsReturn {
  /**
   * List of available image models
   */
  models: ImageModelInfo[]

  /**
   * Whether the query is loading
   */
  isLoading: boolean

  /**
   * Whether there was an error fetching models
   */
  isError: boolean

  /**
   * Error object if fetch failed
   */
  error: PollinationsApiError | null

  /**
   * Whether using fallback data
   */
  isFallback: boolean

  /**
   * Refetch models
   */
  refetch: () => Promise<void>

  /**
   * Get a model by name or alias
   */
  getModel: (nameOrAlias: string) => ImageModelInfo | undefined
}

/**
 * Convert legacy ModelInfo to ImageModelInfo format
 */
function convertLegacyModels(): ImageModelInfo[] {
  return IMAGE_MODELS.map((model) => ({
    name: model.id,
    aliases: [],
    pricing: { currency: "pollen" as const },
    description: model.description,
  }))
}

/**
 * Hook for fetching available image models.
 *
 * @example
 * ```tsx
 * const { models, isLoading, getModel } = useImageModels()
 *
 * // In a select component
 * models.map(model => (
 *   <option key={model.name} value={model.name}>
 *     {model.name} - {model.description}
 *   </option>
 * ))
 * ```
 */
export function useImageModels(
  options: UseImageModelsOptions = {}
): UseImageModelsReturn {
  const {
    enabled = true,
    useFallback = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options

  const fallbackModels = useFallback ? convertLegacyModels() : []

  const query = useQuery<ImageModelInfo[], PollinationsApiError>({
    queryKey: queryKeys.models.image,
    queryFn: fetchImageModels,
    enabled,
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    // Use fallback data if query fails
    placeholderData: fallbackModels,
  })

  const models = query.data ?? fallbackModels
  const isFallback = query.isError && useFallback

  const getModel = (nameOrAlias: string): ImageModelInfo | undefined => {
    return models.find(
      (m) => m.name === nameOrAlias || m.aliases.includes(nameOrAlias)
    )
  }

  const refetch = async () => {
    await query.refetch()
  }

  return {
    models,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFallback,
    refetch,
    getModel,
  }
}
```

### 3. Update Query Keys

```typescript
// lib/query/query-keys.ts (add to existing)
export const queryKeys = {
  // ... existing keys
  
  models: {
    all: ["models"] as const,
    image: ["models", "image"] as const,
    text: ["models", "text"] as const,
    detail: (name: string) => ["models", "detail", name] as const,
  },
} as const
```

### 4. Update Hook Exports

```typescript
// hooks/queries/index.ts
export { useGenerateImage, type UseGenerateImageOptions, type UseGenerateImageReturn } from "./use-generate-image"
export { useDownloadImage, type UseDownloadImageOptions, type UseDownloadImageReturn } from "./use-download-image"
export { useImageModels, type UseImageModelsOptions, type UseImageModelsReturn } from "./use-image-models"
```

### 5. Deprecate Static Models

```typescript
// lib/image-models.ts
/**
 * @deprecated Use useImageModels hook instead for dynamic model fetching.
 * This file is kept for fallback purposes only.
 */

import type { AspectRatioOption } from "@/types/pollinations"

/** @deprecated Use ImageModelInfo from schemas */
export interface ModelInfo {
  id: string
  name: string
  description: string
  style: string
}

/**
 * @deprecated Use useImageModels hook to fetch models dynamically.
 * These are fallback values used when API is unavailable.
 */
export const IMAGE_MODELS: ModelInfo[] = [
  {
    id: "flux",
    name: "Flux",
    description: "Default balanced model for speed and quality",
    style: "Versatile",
  },
  {
    id: "turbo",
    name: "Turbo",
    description: "Fastest generation with good quality",
    style: "Fast",
  },
  {
    id: "gptimage",
    name: "GPT Image",
    description: "OpenAI-powered image generation",
    style: "Photorealistic",
  },
  {
    id: "kontext",
    name: "Kontext",
    description: "Context-aware image editing and generation",
    style: "Editing",
  },
  {
    id: "seedream",
    name: "Seedream",
    description: "Creative dream-like image generation",
    style: "Creative",
  },
]

// ASPECT_RATIOS remains unchanged - UI-specific, not API-dependent
export const ASPECT_RATIOS: AspectRatioOption[] = [
  // ... existing aspect ratios
]

export const DEFAULT_DIMENSIONS = {
  MIN: 64,
  MAX: 2048,
  STEP: 64,
  DEFAULT: 1024,
}
```

---

## Acceptance Criteria

- [x] `useImageModels` hook fetches models from `/image/models` endpoint
- [x] Models are cached with appropriate stale time (5 minutes)
- [x] Fallback to static models when API fails
- [x] `getModel` helper finds models by name or alias
- [x] Query keys are properly structured for cache invalidation
- [x] Hook exposes loading, error, and fallback states
- [x] Existing model references are deprecated with JSDoc
- [x] Response is validated with Zod schema

---

## Testing Requirements

### Unit Tests

```typescript
// hooks/queries/use-image-models.test.ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { useImageModels } from "./use-image-models"

// Mock the API module
vi.mock("@/lib/api/models-api", () => ({
  fetchImageModels: vi.fn(),
}))

import { fetchImageModels } from "@/lib/api/models-api"

const mockFetchImageModels = fetchImageModels as unknown as ReturnType<typeof vi.fn>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe("useImageModels", () => {
  const mockModels = [
    {
      name: "flux",
      aliases: ["default"],
      pricing: { currency: "pollen" as const },
      description: "Test model",
    },
    {
      name: "turbo",
      aliases: ["fast"],
      pricing: { currency: "pollen" as const },
      description: "Fast model",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("fetches models on mount", async () => {
    mockFetchImageModels.mockResolvedValueOnce(mockModels)

    const { result } = renderHook(() => useImageModels(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.models).toEqual(mockModels)
    expect(result.current.isFallback).toBe(false)
  })

  it("uses fallback models when API fails", async () => {
    mockFetchImageModels.mockRejectedValueOnce(new Error("API Error"))

    const { result } = renderHook(() => useImageModels({ useFallback: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.isFallback).toBe(true)
    expect(result.current.models.length).toBeGreaterThan(0)
  })

  it("finds model by name", async () => {
    mockFetchImageModels.mockResolvedValueOnce(mockModels)

    const { result } = renderHook(() => useImageModels(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.getModel("flux")).toEqual(mockModels[0])
  })

  it("finds model by alias", async () => {
    mockFetchImageModels.mockResolvedValueOnce(mockModels)

    const { result } = renderHook(() => useImageModels(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.getModel("fast")).toEqual(mockModels[1])
  })

  it("respects enabled option", () => {
    const { result } = renderHook(() => useImageModels({ enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(mockFetchImageModels).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })
})
```

### Run Command
```bash
bun test hooks/queries/use-image-models.test.ts lib/api/models-api.test.ts
```

---

## UI Integration Example

```tsx
// Example usage in a component
"use client"

import { useImageModels } from "@/hooks/queries"

export function ModelSelector({ 
  value, 
  onChange 
}: { 
  value: string
  onChange: (model: string) => void 
}) {
  const { models, isLoading, isFallback } = useImageModels()

  if (isLoading) {
    return <div>Loading models...</div>
  }

  return (
    <div>
      {isFallback && (
        <p className="text-yellow-500 text-sm">Using cached models</p>
      )}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {models.map((model) => (
          <option key={model.name} value={model.name}>
            {model.name} {model.description && `- ${model.description}`}
          </option>
        ))}
      </select>
    </div>
  )
}
```

---

## Related Stories
- Story 001: Zod Schemas & Types (provides ImageModelInfo type)
- Story 002: API Service Layer (provides API config)
- Story 005: UI Components (uses this hook)
