/**
 * Pollinations API Service Layer
 *
 * Handles URL construction and API interactions for gen.pollinations.ai.
 * Following SRP - Single responsibility: API communication.
 */

import { API_CONFIG, API_CONSTRAINTS, API_DEFAULTS, getApiKey } from "@/lib/config/api.config"
import type {
  ResolvedImageGenerationParams,
  ResolvedVideoGenerationParams,
} from "@/lib/schemas/pollinations.schema"

export class PollinationsAPI {
  private static readonly BASE_URL = API_CONFIG.baseUrl

  /**
   * Builds shared query parameters common to both image and video endpoints.
   * Encodes model, dimensions, seed, quality, guidance scale, boolean flags, and reference images.
   */
  private static buildCommonQueryParams(
    options: Omit<ResolvedImageGenerationParams, "prompt" | "negativePrompt"> & {
      negativePrompt?: string
    }
  ): URLSearchParams {
    const queryParams = new URLSearchParams()

    // Negative prompt
    if (options.negativePrompt?.trim()) {
      queryParams.append("negative_prompt", options.negativePrompt.trim())
    }

    // Model - always include (upstream API requires explicit model selection)
    if (options.model) {
      queryParams.append("model", options.model)
    }

    // Dimensions - only include if different from defaults
    if (options.width) {
      queryParams.append("width", options.width.toString())
    }
    if (options.height) {
      queryParams.append("height", options.height.toString())
    }

    // Seed (only if explicitly set)
    if (options.seed !== undefined && options.seed >= 0) {
      queryParams.append("seed", options.seed.toString())
    }

    // Quality - just hardcode to highest
    queryParams.append("quality", "high")

    // Guidance scale
    if (options.guidance_scale !== undefined) {
      queryParams.append("guidance_scale", options.guidance_scale.toString())
    }

    // Boolean flags - only append if different from defaults (which are all false)
    if (options.enhance !== API_DEFAULTS.enhance) queryParams.append("enhance", "true")
    if (options.transparent !== API_DEFAULTS.transparent) queryParams.append("transparent", "true")
    if (options.nologo !== API_DEFAULTS.nologo) queryParams.append("nologo", "true")
    if (options.nofeed !== API_DEFAULTS.nofeed) queryParams.append("nofeed", "true")
    if (options.safe !== API_DEFAULTS.safe) queryParams.append("safe", "true")
    if (options.private !== API_DEFAULTS.private) queryParams.append("private", "true")

    // Reference image(s) for image-to-image / video-to-video
    if (options.image) {
      queryParams.append("image", options.image)
    }

    return queryParams
  }

  /**
   * Constructs a full endpoint URL from a path segment, encoded prompt, and query params.
   */
  private static buildEndpointUrl(
    endpoint: "image" | "video",
    encodedPrompt: string,
    queryParams: URLSearchParams
  ): string {
    const query = queryParams.toString()
    return `${this.BASE_URL}/${endpoint}/${encodedPrompt}${query ? `?${query}` : ""}`
  }

  /**
   * Builds the image generation URL with all parameters.
   * Uses the /image/{prompt} path structure.
   */
  static buildImageUrl(params: ResolvedImageGenerationParams): string {
    const { prompt, negativePrompt, ...options } = params
    const encodedPrompt = encodeURIComponent(prompt)
    const queryParams = this.buildCommonQueryParams({ ...options, negativePrompt })

    // Note: API key is sent via Authorization header in getHeaders(), not in URL
    return this.buildEndpointUrl("image", encodedPrompt, queryParams)
  }

  /**
   * Builds video generation URL with video-specific parameters.
   * Uses the /video/{prompt} path structure (separate from the image endpoint).
   */
  static buildVideoUrl(params: ResolvedVideoGenerationParams): string {
    const { prompt, negativePrompt, duration, aspectRatio, audio, lastFrameImage, ...options } = params
    const encodedPrompt = encodeURIComponent(prompt)
    const queryParams = this.buildCommonQueryParams({ ...options, negativePrompt })

    // Video-specific parameters
    if (duration !== undefined) {
      queryParams.append("duration", duration.toString())
    }
    if (aspectRatio) {
      queryParams.append("aspectRatio", aspectRatio)
    }
    if (audio) {
      queryParams.append("audio", "true")
    }
    if (lastFrameImage) {
      queryParams.append("lastFrameImage", lastFrameImage)
    }

    return this.buildEndpointUrl("video", encodedPrompt, queryParams)
  }

  /**
   * Validates dimension value (must be within range and divisible by step)
   */
  static validateDimension(value: number): boolean {
    const { min, max, step } = API_CONSTRAINTS.dimensions
    return value >= min && value <= max && value % step === 0
  }

  /**
   * Rounds dimension to nearest valid value
   */
  static roundDimension(value: number): number {
    const { min, max, step } = API_CONSTRAINTS.dimensions
    const clamped = Math.max(min, Math.min(max, value))
    return Math.round(clamped / step) * step
  }

  /**
     * Generates a random seed for reproducible generations.
     * 
     * @returns A random integer between 0 and MAX_SEED.
     */
  static generateRandomSeed(): number {
    // Generate a random integer between 0 and the max seed value (inclusive)
    return Math.floor(Math.random() * (API_CONSTRAINTS.seed.max + 1))
  }

  /**
   * Validates guidance scale value
   */
  static validateGuidanceScale(value: number): boolean {
    const { min, max } = API_CONSTRAINTS.guidanceScale
    return value >= min && value <= max
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
