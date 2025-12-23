# Story 002: Migrate Pollinations API Service Layer

## Overview
Update the `PollinationsAPI` service class and `lib/api/image-api.ts` to use the new `gen.pollinations.ai` endpoint with updated URL structure and parameters.

## Priority: High
## Estimated Effort: 3 hours
## Dependencies: Story 001 (Zod Schemas & Types)

---

## Background

The current implementation uses:
- **Base URL**: `https://image.pollinations.ai`
- **Path**: `/prompt/{encodedPrompt}`

The new API uses:
- **Base URL**: `https://gen.pollinations.ai`
- **Path**: `/image/{encodedPrompt}`

Additionally, new query parameters are available and some defaults have changed.

---

## Technical Specification

### Stack Requirements
- **Next.js**: 16.1.0
- **TypeScript**: v5.9.3
- **Zod**: v4.2.1 (for type imports)

### Files to Modify

#### [MODIFY] `lib/pollinations-api.ts`
Update base URL, path structure, and parameter handling.

#### [MODIFY] `lib/api/image-api.ts`  
Update API functions to use new Zod-validated types and support authentication.

### Files to Create

#### [NEW] `lib/config/api.config.ts`
Centralized API configuration.

---

## Implementation Details

### 1. Create API Configuration

```typescript
// lib/config/api.config.ts
/**
 * Pollinations API Configuration
 * 
 * Centralized configuration for the gen.pollinations.ai API.
 * Supports environment-based API key configuration.
 */

export const POLLINATIONS_CONFIG = {
  /** Base URL for the gen.pollinations.ai API */
  BASE_URL: "https://gen.pollinations.ai",
  
  /** API version for reference */
  API_VERSION: "0.3.0",
  
  /** Default values matching API spec */
  DEFAULTS: {
    MODEL: "flux",
    WIDTH: 1024,
    HEIGHT: 1024,
    SEED: 42,
    QUALITY: "medium" as const,
    ENHANCE: false,
    SAFE: false,
    PRIVATE: false,
    NOLOGO: false,
    NOFEED: false,
    TRANSPARENT: false,
    NEGATIVE_PROMPT: "worst quality, blurry",
  },
  
  /** Dimension constraints */
  DIMENSIONS: {
    MIN: 64,
    MAX: 2048,
    STEP: 64,
    DEFAULT: 1024,
  },
  
  /** Seed constraints */
  SEED: {
    MIN: 0,
    MAX: 1844674407370955,
  },
  
  /** Guidance scale constraints */
  GUIDANCE_SCALE: {
    MIN: 1,
    MAX: 20,
  },
  
  /** Video duration constraints by model */
  VIDEO_DURATION: {
    veo: { min: 4, max: 8 },
    seedance: { min: 2, max: 10 },
    "seedance-pro": { min: 2, max: 10 },
  },
} as const

/**
 * Get API key from environment
 * Returns undefined if no key is configured (anonymous access)
 */
export function getApiKey(): string | undefined {
  if (typeof window === "undefined") {
    // Server-side: use secret key
    return process.env.POLLINATIONS_SECRET_KEY
  }
  // Client-side: use publishable key
  return process.env.NEXT_PUBLIC_POLLINATIONS_KEY
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  return !!getApiKey()
}
```

### 2. Update PollinationsAPI Service

```typescript
// lib/pollinations-api.ts
/**
 * Pollinations API Service Layer
 * 
 * Handles URL construction and API interactions for gen.pollinations.ai.
 * Following SRP - Single responsibility: API communication.
 */

import { POLLINATIONS_CONFIG, getApiKey } from "@/lib/config/api.config"
import type { ImageGenerationParams, VideoGenerationParams } from "@/lib/schemas/pollinations.schema"

export class PollinationsAPI {
  private static readonly BASE_URL = POLLINATIONS_CONFIG.BASE_URL

  /**
   * Builds the image generation URL with all parameters.
   * Uses the new /image/{prompt} path structure.
   */
  static buildImageUrl(params: ImageGenerationParams): string {
    const { prompt, negativePrompt, ...options } = params
    const encodedPrompt = encodeURIComponent(prompt)

    const queryParams = new URLSearchParams()

    // Model (default: flux)
    if (options.model && options.model !== POLLINATIONS_CONFIG.DEFAULTS.MODEL) {
      queryParams.append("model", options.model)
    }

    // Dimensions
    if (options.width && options.width !== POLLINATIONS_CONFIG.DEFAULTS.WIDTH) {
      queryParams.append("width", options.width.toString())
    }
    if (options.height && options.height !== POLLINATIONS_CONFIG.DEFAULTS.HEIGHT) {
      queryParams.append("height", options.height.toString())
    }

    // Seed (only if explicitly set, not using random)
    if (options.seed !== undefined && options.seed >= 0) {
      queryParams.append("seed", options.seed.toString())
    }

    // Negative prompt
    if (negativePrompt?.trim()) {
      queryParams.append("negative_prompt", negativePrompt.trim())
    }

    // Quality (new parameter)
    if (options.quality && options.quality !== POLLINATIONS_CONFIG.DEFAULTS.QUALITY) {
      queryParams.append("quality", options.quality)
    }

    // Guidance scale (new parameter)
    if (options.guidance_scale !== undefined) {
      queryParams.append("guidance_scale", options.guidance_scale.toString())
    }

    // Boolean flags - only append if true (defaults are false)
    if (options.enhance) queryParams.append("enhance", "true")
    if (options.transparent) queryParams.append("transparent", "true")
    if (options.nologo) queryParams.append("nologo", "true")
    if (options.nofeed) queryParams.append("nofeed", "true")
    if (options.safe) queryParams.append("safe", "true")
    if (options.private) queryParams.append("private", "true")

    // Reference image(s) for image-to-image
    if (options.image) {
      queryParams.append("image", options.image)
    }

    // Add API key if available
    const apiKey = getApiKey()
    if (apiKey) {
      queryParams.append("key", apiKey)
    }

    const query = queryParams.toString()
    return `${this.BASE_URL}/image/${encodedPrompt}${query ? `?${query}` : ""}`
  }

  /**
   * Builds video generation URL with video-specific parameters.
   */
  static buildVideoUrl(params: VideoGenerationParams): string {
    const { duration, aspectRatio, audio, ...imageParams } = params
    const baseUrl = this.buildImageUrl(imageParams as ImageGenerationParams)
    
    const additionalParams = new URLSearchParams()
    
    if (duration !== undefined) {
      additionalParams.append("duration", duration.toString())
    }
    if (aspectRatio) {
      additionalParams.append("aspectRatio", aspectRatio)
    }
    if (audio) {
      additionalParams.append("audio", "true")
    }

    const additional = additionalParams.toString()
    if (!additional) return baseUrl

    return baseUrl.includes("?")
      ? `${baseUrl}&${additional}`
      : `${baseUrl}?${additional}`
  }

  /**
   * Validates dimension value (must be 64-2048 and divisible by 64)
   */
  static validateDimension(value: number): boolean {
    const { MIN, MAX, STEP } = POLLINATIONS_CONFIG.DIMENSIONS
    return value >= MIN && value <= MAX && value % STEP === 0
  }

  /**
   * Rounds dimension to nearest valid value
   */
  static roundDimension(value: number): number {
    const { MIN, MAX, STEP } = POLLINATIONS_CONFIG.DIMENSIONS
    const clamped = Math.max(MIN, Math.min(MAX, value))
    return Math.round(clamped / STEP) * STEP
  }

  /**
   * Generates a random seed within valid range
   */
  static generateRandomSeed(): number {
    // Use safe integer range for JavaScript
    return Math.floor(Math.random() * 2147483647)
  }

  /**
   * Validates guidance scale value
   */
  static validateGuidanceScale(value: number): boolean {
    const { MIN, MAX } = POLLINATIONS_CONFIG.GUIDANCE_SCALE
    return value >= MIN && value <= MAX
  }

  /**
   * Get request headers with optional authentication
   */
  static getHeaders(): HeadersInit {
    const headers: HeadersInit = {}
    const apiKey = getApiKey()
    
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    }
    
    return headers
  }
}
```

### 3. Update Image API Functions

```typescript
// lib/api/image-api.ts
/**
 * Image API Service
 *
 * Centralized API functions for image operations.
 * Designed to be used with TanStack Query hooks.
 * Following SRP: handles only image-related API operations.
 */

import { PollinationsAPI } from "@/lib/pollinations-api"
import { POLLINATIONS_CONFIG } from "@/lib/config/api.config"
import {
  ImageGenerationParamsSchema,
  GeneratedImageSchema,
  type ImageGenerationParams,
  type GeneratedImage,
  type ApiError,
} from "@/lib/schemas/pollinations.schema"

/**
 * Custom error class for API errors with typed details
 */
export class PollinationsApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "PollinationsApiError"
  }
}

/**
 * Generates an image using the Pollinations API.
 *
 * @param params - Image generation parameters (validated with Zod)
 * @returns Promise resolving to the generated image data
 * @throws PollinationsApiError if generation fails
 */
export async function generateImage(
  params: ImageGenerationParams
): Promise<GeneratedImage> {
  // Validate params with Zod schema
  const validatedParams = ImageGenerationParamsSchema.parse(params)
  const url = PollinationsAPI.buildImageUrl(validatedParams)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: PollinationsAPI.getHeaders(),
      // No-store to ensure we trigger generation, not hit cache
      cache: "no-store",
    })

    if (!response.ok) {
      // Try to parse error response
      let errorData: ApiError | undefined
      try {
        errorData = await response.json()
      } catch {
        // Response is not JSON
      }

      throw new PollinationsApiError(
        errorData?.error?.message ?? 
          `Image generation failed with status ${response.status}`,
        errorData?.error?.code ?? "GENERATION_FAILED",
        response.status,
        errorData?.error?.details
      )
    }

    // Build and validate the generated image object
    const generatedImage: GeneratedImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      url,
      prompt: validatedParams.prompt,
      params: validatedParams,
      timestamp: Date.now(),
    }

    return GeneratedImageSchema.parse(generatedImage)
  } catch (error) {
    // Re-throw PollinationsApiError as-is
    if (error instanceof PollinationsApiError) {
      throw error
    }

    // Wrap Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      throw new PollinationsApiError(
        "Invalid image generation parameters",
        "VALIDATION_ERROR",
        400
      )
    }

    // Wrap unknown errors
    throw new PollinationsApiError(
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during image generation",
      "UNKNOWN_ERROR"
    )
  }
}

/**
 * Downloads an image as a blob.
 *
 * @param imageUrl - URL of the image to download
 * @returns Promise resolving to the image blob
 */
export async function downloadImage(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl, {
    headers: PollinationsAPI.getHeaders(),
  })

  if (!response.ok) {
    throw new PollinationsApiError(
      "Failed to download image",
      "DOWNLOAD_FAILED",
      response.status
    )
  }

  return response.blob()
}

/**
 * Type guard for PollinationsApiError
 */
export function isApiError(error: unknown): error is PollinationsApiError {
  return error instanceof PollinationsApiError
}

// Re-export for backwards compatibility
export type { ApiError }
```

---

## Acceptance Criteria

- [ ] Base URL updated to `https://gen.pollinations.ai`
- [ ] Path structure changed from `/prompt/{prompt}` to `/image/{prompt}`
- [ ] All new query parameters are supported (quality, transparent, guidance_scale, etc.)
- [ ] API configuration is centralized in `lib/config/api.config.ts`
- [ ] Authentication headers are properly handled
- [ ] Zod validation is applied to input parameters
- [ ] Error handling uses the new error schemas
- [ ] Video URL building is supported for future video generation
- [ ] Backwards compatibility maintained (existing hooks should work)

---

## Testing Requirements

### Unit Tests
Update `lib/pollinations-api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PollinationsAPI } from "./pollinations-api"

describe("PollinationsAPI", () => {
  describe("buildImageUrl", () => {
    it("uses correct base URL and path", () => {
      const url = PollinationsAPI.buildImageUrl({ prompt: "test" })
      expect(url).toContain("https://gen.pollinations.ai/image/")
    })

    it("encodes prompt correctly", () => {
      const url = PollinationsAPI.buildImageUrl({ prompt: "a cat & dog" })
      expect(url).toContain("/image/a%20cat%20%26%20dog")
    })

    it("includes model parameter when not default", () => {
      const url = PollinationsAPI.buildImageUrl({ 
        prompt: "test", 
        model: "turbo" 
      })
      expect(url).toContain("model=turbo")
    })

    it("excludes model parameter when flux (default)", () => {
      const url = PollinationsAPI.buildImageUrl({ 
        prompt: "test", 
        model: "flux" 
      })
      expect(url).not.toContain("model=")
    })

    it("includes quality parameter", () => {
      const url = PollinationsAPI.buildImageUrl({ 
        prompt: "test", 
        quality: "hd" 
      })
      expect(url).toContain("quality=hd")
    })

    it("includes guidance_scale parameter", () => {
      const url = PollinationsAPI.buildImageUrl({ 
        prompt: "test", 
        guidance_scale: 7.5 
      })
      expect(url).toContain("guidance_scale=7.5")
    })

    it("includes transparent parameter when true", () => {
      const url = PollinationsAPI.buildImageUrl({ 
        prompt: "test", 
        transparent: true 
      })
      expect(url).toContain("transparent=true")
    })

    it("excludes transparent parameter when false", () => {
      const url = PollinationsAPI.buildImageUrl({ 
        prompt: "test", 
        transparent: false 
      })
      expect(url).not.toContain("transparent")
    })
  })

  describe("validateDimension", () => {
    it("accepts valid dimensions", () => {
      expect(PollinationsAPI.validateDimension(1024)).toBe(true)
      expect(PollinationsAPI.validateDimension(512)).toBe(true)
      expect(PollinationsAPI.validateDimension(64)).toBe(true)
      expect(PollinationsAPI.validateDimension(2048)).toBe(true)
    })

    it("rejects invalid dimensions", () => {
      expect(PollinationsAPI.validateDimension(63)).toBe(false)
      expect(PollinationsAPI.validateDimension(2049)).toBe(false)
      expect(PollinationsAPI.validateDimension(100)).toBe(false)
    })
  })

  describe("roundDimension", () => {
    it("rounds to nearest 64", () => {
      expect(PollinationsAPI.roundDimension(100)).toBe(128)
      expect(PollinationsAPI.roundDimension(1000)).toBe(1024)
      expect(PollinationsAPI.roundDimension(1050)).toBe(1024)
    })

    it("clamps to min/max", () => {
      expect(PollinationsAPI.roundDimension(10)).toBe(64)
      expect(PollinationsAPI.roundDimension(3000)).toBe(2048)
    })
  })
})
```

### Run Command
```bash
bun test lib/pollinations-api.test.ts lib/api/image-api.test.ts
```

---

## Migration Notes

1. **Base URL**: Changed from `image.pollinations.ai` → `gen.pollinations.ai`
2. **Path Structure**: Changed from `/prompt/{prompt}` → `/image/{prompt}`
3. **Authentication**: Bearer token support added via headers
4. **Query Param Optimization**: Only non-default values are included in URL
5. **Error Handling**: Enhanced with typed errors and status codes

---

## Related Stories
- Story 001: Zod Schemas & Types (prerequisite)
- Story 004: Update TanStack Query Hooks (uses this)
- Story 006: Authentication Support (extends this)
