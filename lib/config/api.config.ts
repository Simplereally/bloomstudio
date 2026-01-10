/**
 * Pollinations API Configuration
 *
 * Centralized configuration derived from Zod schemas for type safety.
 * Supports environment-based API key configuration.
 */

import type { Quality, VideoModel } from "@/lib/schemas/pollinations.schema";
import { ImageGenerationParamsSchema, QualitySchema, VideoModelSchema } from "@/lib/schemas/pollinations.schema";

// Extract defaults from the Zod schema - single source of truth
const schemaDefaults = ImageGenerationParamsSchema.parse({ prompt: "placeholder" });

/**
 * API Defaults derived from the Zod schema
 * These are type-safe and stay in sync with the schema automatically
 */
export const API_DEFAULTS = {
  model: schemaDefaults.model,
  quality: schemaDefaults.quality,
  width: schemaDefaults.width,
  height: schemaDefaults.height,
  enhance: schemaDefaults.enhance,
  safe: schemaDefaults.safe,
  private: schemaDefaults.private,
  nologo: schemaDefaults.nologo,
  nofeed: schemaDefaults.nofeed,
  transparent: schemaDefaults.transparent,
} as const;

/**
 * API Constraints - these should stay in sync with schema.
 * For constraints embedded in Zod, we extract the shape def.
 *
 * Note: Zod doesn't expose min/max values directly, so we define
 * these as constants that match what's in the schema. The schema
 * is still the runtime enforcer.
 */
export const API_CONSTRAINTS = {
  dimensions: {
    min: 64,
    max: 2048,
    step: 64,
  },
  seed: {
    min: 0,
    max: 2147483647, // int32 max - Pollinations API limit
  },
  guidanceScale: {
    min: 1,
    max: 20,
  },
  videoDuration: {
    veo: { min: 4, max: 8 },
    seedance: { min: 2, max: 10 },
    "seedance-pro": { min: 2, max: 10 },
  } satisfies Record<VideoModel, { min: number; max: number }>,
} as const;

/**
 * Quality options derived from the Zod enum
 */
export const QUALITY_OPTIONS = QualitySchema.options satisfies readonly Quality[];

/**
 * Video model options derived from the Zod enum
 */
export const VIDEO_MODEL_OPTIONS = VideoModelSchema.options satisfies readonly VideoModel[];

/**
 * API Configuration
 */
export const API_CONFIG = {
  /** Base URL for the gen.pollinations.ai API */
  baseUrl: "https://gen.pollinations.ai",
  /** API version for reference */
  version: "0.3.0",
} as const;

/**
 * Get API key from environment (client-side only)
 * Returns undefined if no key is configured (anonymous access)
 *
 * Note: Server-side generation uses user-specific keys stored in Convex,
 * not environment variables. This function is only for client-side operations
 * like model fetching where a publishable key may be used.
 */
export function getApiKey(): string | undefined {
  // Only return the publishable key for client-side use
  // Server-side generation uses user-specific keys from Convex
  return process.env.NEXT_PUBLIC_POLLINATIONS_KEY;
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  return !!getApiKey();
}
