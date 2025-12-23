/**
 * Server-side Image Generation API Schema
 *
 * Zod schemas for validating server-side generation requests and responses.
 * Used by the /api/generate route.
 */

import { z } from "zod"
import { ImageGenerationParamsSchema, GeneratedImageSchema } from "@/lib/schemas/pollinations.schema"

/**
 * Request body schema for server-side generation
 */
export const ServerGenerateRequestSchema = ImageGenerationParamsSchema

/**
 * Success response schema
 */
export const ServerGenerateSuccessSchema = z.object({
    success: z.literal(true),
    data: GeneratedImageSchema,
})

/**
 * Error response schema
 */
export const ServerGenerateErrorSchema = z.object({
    success: z.literal(false),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.unknown()).optional(),
    }),
})

/**
 * Combined response schema
 */
export const ServerGenerateResponseSchema = z.union([
    ServerGenerateSuccessSchema,
    ServerGenerateErrorSchema,
])

// Infer types from schemas
export type ServerGenerateRequest = z.infer<typeof ServerGenerateRequestSchema>
export type ServerGenerateSuccess = z.infer<typeof ServerGenerateSuccessSchema>
export type ServerGenerateError = z.infer<typeof ServerGenerateErrorSchema>
export type ServerGenerateResponse = z.infer<typeof ServerGenerateResponseSchema>
