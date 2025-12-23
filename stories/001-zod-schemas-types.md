# Story 001: Update Zod Schemas & TypeScript Types

## Overview
Migrate all Pollinations API types to use Zod v4.2.1 for runtime validation with updated schemas matching the new `gen.pollinations.ai` API specification.

## Priority: High
## Estimated Effort: 4 hours
## Dependencies: None

---

## Background

The current implementation in `types/pollinations.ts` uses plain TypeScript interfaces without runtime validation. The new `gen.pollinations.ai` API introduces:
- New image models (gptimage, kontext, seedream, zimage, etc.)
- Video models (veo, seedance, seedance-pro)
- New parameters (quality, transparent, guidance_scale, nologo, nofeed, etc.)
- Authentication support
- Comprehensive error response schemas

---

## Technical Specification

### Stack Requirements
- **Zod**: v4.2.1 (already installed)
- **TypeScript**: v5.9.3
- **Next.js**: 16.1.0

### Files to Modify

#### [MODIFY] `types/pollinations.ts`
Complete rewrite using Zod schemas.

### Files to Create

#### [NEW] `lib/schemas/pollinations.schema.ts`
New Zod schema definitions file.

---

## Implementation Details

### 1. Create Zod Schemas for Image Generation

```typescript
// lib/schemas/pollinations.schema.ts
import { z } from "zod/v4"

// Quality levels enum
export const QualitySchema = z.enum(["low", "medium", "high", "hd"])

// Image models from the new API
export const ImageModelSchema = z.enum([
  "flux",
  "turbo", 
  "gptimage",
  "kontext",
  "seedream",
  "seedream-pro",
  "nanobanana",
  "nanobanana-pro",
  "zimage"
])

// Video models
export const VideoModelSchema = z.enum([
  "veo",
  "seedance",
  "seedance-pro"
])

// Combined model schema
export const GenerationModelSchema = z.union([ImageModelSchema, VideoModelSchema])

// Aspect ratio for videos
export const VideoAspectRatioSchema = z.enum(["16:9", "9:16"])

// Image generation parameters matching gen.pollinations.ai API
export const ImageGenerationParamsSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  negativePrompt: z.string().optional(),
  model: ImageModelSchema.optional().default("flux"),
  width: z.number().int().min(64).max(2048).optional().default(1024),
  height: z.number().int().min(64).max(2048).optional().default(1024),
  seed: z.number().int().min(0).max(1844674407370955).optional(),
  enhance: z.boolean().optional().default(false),
  quality: QualitySchema.optional().default("medium"),
  negative_prompt: z.string().optional(),
  private: z.boolean().optional().default(false),
  nologo: z.boolean().optional().default(false),
  nofeed: z.boolean().optional().default(false),
  safe: z.boolean().optional().default(false),
  transparent: z.boolean().optional().default(false),
  guidance_scale: z.number().min(1).max(20).optional(),
  image: z.string().optional(), // Reference image URL(s)
})

// Video generation extends image with video-specific params
export const VideoGenerationParamsSchema = ImageGenerationParamsSchema.extend({
  model: VideoModelSchema,
  duration: z.number().int().min(2).max(10).optional(),
  aspectRatio: VideoAspectRatioSchema.optional(),
  audio: z.boolean().optional().default(false), // veo only
})

// Generated image result
export const GeneratedImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  prompt: z.string(),
  params: ImageGenerationParamsSchema,
  timestamp: z.number(),
})
```

### 2. Add Model Information Schemas

```typescript
// Model pricing schema
export const ModelPricingSchema = z.object({
  currency: z.literal("pollen"),
  input_token_price: z.number().optional(),
  output_token_price: z.number().optional(),
  cached_token_price: z.number().optional(),
  image_price: z.number().optional(),
  audio_input_price: z.number().optional(),
  audio_output_price: z.number().optional(),
})

// Image model info from /image/models endpoint
export const ImageModelInfoSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()),
  pricing: ModelPricingSchema,
  description: z.string().optional(),
  input_modalities: z.array(z.string()).optional(),
  output_modalities: z.array(z.string()).optional(),
  tools: z.boolean().optional(),
  reasoning: z.boolean().optional(),
  context_window: z.number().optional(),
  voices: z.array(z.string()).optional(),
  is_specialized: z.boolean().optional(),
})

// Response array
export const ImageModelsResponseSchema = z.array(ImageModelInfoSchema)
```

### 3. Add API Error Schemas

```typescript
// Validation error details
export const ValidationErrorDetailsSchema = z.object({
  name: z.string(),
  stack: z.string().optional(),
  formErrors: z.array(z.string()),
  fieldErrors: z.record(z.string(), z.array(z.string())),
})

// Base error schema
const BaseApiErrorSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  cause: z.unknown().optional(),
})

// 400 Bad Request
export const BadRequestErrorSchema = z.object({
  status: z.literal(400),
  success: z.literal(false),
  error: BaseApiErrorSchema.extend({
    code: z.literal("BAD_REQUEST"),
    details: ValidationErrorDetailsSchema,
  }),
})

// 401 Unauthorized
export const UnauthorizedErrorSchema = z.object({
  status: z.literal(401),
  success: z.literal(false),
  error: BaseApiErrorSchema.extend({
    code: z.literal("UNAUTHORIZED"),
    details: z.object({
      name: z.string(),
      stack: z.string().optional(),
    }),
  }),
})

// 500 Internal Error
export const InternalErrorSchema = z.object({
  status: z.literal(500),
  success: z.literal(false),
  error: BaseApiErrorSchema.extend({
    code: z.literal("INTERNAL_ERROR"),
    details: z.object({
      name: z.string(),
      stack: z.string().optional(),
    }),
  }),
})

// Union of all API errors
export const ApiErrorSchema = z.union([
  BadRequestErrorSchema,
  UnauthorizedErrorSchema, 
  InternalErrorSchema,
])
```

### 4. Export Type Inferences

```typescript
// Infer TypeScript types from Zod schemas
export type Quality = z.infer<typeof QualitySchema>
export type ImageModel = z.infer<typeof ImageModelSchema>
export type VideoModel = z.infer<typeof VideoModelSchema>
export type GenerationModel = z.infer<typeof GenerationModelSchema>
export type VideoAspectRatio = z.infer<typeof VideoAspectRatioSchema>
export type ImageGenerationParams = z.infer<typeof ImageGenerationParamsSchema>
export type VideoGenerationParams = z.infer<typeof VideoGenerationParamsSchema>
export type GeneratedImage = z.infer<typeof GeneratedImageSchema>
export type ModelPricing = z.infer<typeof ModelPricingSchema>
export type ImageModelInfo = z.infer<typeof ImageModelInfoSchema>
export type ImageModelsResponse = z.infer<typeof ImageModelsResponseSchema>
export type BadRequestError = z.infer<typeof BadRequestErrorSchema>
export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>
export type InternalError = z.infer<typeof InternalErrorSchema>
export type ApiError = z.infer<typeof ApiErrorSchema>
```

### 5. Update Existing Types File

```typescript
// types/pollinations.ts
// Re-export everything from the new schema file for backwards compatibility
export * from "@/lib/schemas/pollinations.schema"

// Keep UI-specific types that don't need runtime validation
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9" | "custom"

export interface AspectRatioOption {
  label: string
  value: AspectRatio
  width: number
  height: number
  icon: string
}

// Deprecated - keep for backwards compatibility, remove in future
/** @deprecated Use ImageModel from schemas instead */
export interface ModelInfo {
  id: string
  name: string
  description: string
  style: string
}
```

---

## Acceptance Criteria

- [ ] All existing TypeScript interfaces are migrated to Zod schemas
- [ ] Zod v4.2.1 syntax is used correctly (using `z.enum`, not deprecated patterns)
- [ ] All new API parameters from `endpoint_refactor.md` are included
- [ ] Type inference (`z.infer`) is used to derive TypeScript types
- [ ] Backwards compatibility is maintained via re-exports
- [ ] Video generation parameters are properly typed
- [ ] Error response schemas match API documentation
- [ ] All schemas have appropriate validation constraints

---

## Testing Requirements

### Unit Tests
Create `lib/schemas/pollinations.schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import {
  ImageGenerationParamsSchema,
  ImageModelSchema,
  QualitySchema,
  GeneratedImageSchema,
} from "./pollinations.schema"

describe("pollinations.schema", () => {
  describe("ImageGenerationParamsSchema", () => {
    it("validates valid params", () => {
      const result = ImageGenerationParamsSchema.safeParse({
        prompt: "A beautiful sunset",
        model: "flux",
        width: 1024,
        height: 1024,
      })
      expect(result.success).toBe(true)
    })

    it("rejects empty prompt", () => {
      const result = ImageGenerationParamsSchema.safeParse({
        prompt: "",
      })
      expect(result.success).toBe(false)
    })

    it("rejects invalid model", () => {
      const result = ImageGenerationParamsSchema.safeParse({
        prompt: "test",
        model: "invalid-model",
      })
      expect(result.success).toBe(false)
    })

    it("applies defaults correctly", () => {
      const result = ImageGenerationParamsSchema.parse({
        prompt: "test",
      })
      expect(result.model).toBe("flux")
      expect(result.width).toBe(1024)
      expect(result.height).toBe(1024)
      expect(result.enhance).toBe(false)
    })
  })

  describe("QualitySchema", () => {
    it.each(["low", "medium", "high", "hd"])("accepts '%s'", (quality) => {
      expect(QualitySchema.safeParse(quality).success).toBe(true)
    })

    it("rejects invalid quality", () => {
      expect(QualitySchema.safeParse("ultra").success).toBe(false)
    })
  })
})
```

### Run Command
```bash
bun test lib/schemas/pollinations.schema.test.ts
```

---

## Migration Notes

1. **Zod v4 Syntax**: Use `z.enum()` for string literals, not `z.literal().or()`
2. **Schema-First Approach**: Define schemas, then infer types
3. **Validation at Boundaries**: Use `.safeParse()` at API response boundaries
4. **Error Messages**: Customize error messages for better UX

---

## Related Stories
- Story 002: Migrate Pollinations API Service Layer (depends on this)
- Story 004: Update TanStack Query Hooks (uses these types)
