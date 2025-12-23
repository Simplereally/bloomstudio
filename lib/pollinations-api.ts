// API service layer following SRP - Single responsibility: API communication

import type { ImageGenerationParams } from "@/types/pollinations"

const BASE_URL = "https://image.pollinations.ai"

export class PollinationsAPI {
  /**
   * Builds the image generation URL with all parameters
   */
  static buildImageUrl(params: ImageGenerationParams): string {
    const { prompt, negativePrompt, ...options } = params
    const encodedPrompt = encodeURIComponent(prompt)

    const queryParams = new URLSearchParams()

    // negative_prompt should be the first query param (2nd param after prompt)
    if (negativePrompt?.trim()) {
      queryParams.append("negative_prompt", negativePrompt.trim())
    }

    if (options.model) queryParams.append("model", options.model)
    if (options.width) queryParams.append("width", options.width.toString())
    if (options.height) queryParams.append("height", options.height.toString())
    if (options.seed !== undefined && options.seed !== -1) {

      queryParams.append("seed", options.seed.toString())
    }
    queryParams.append("enhance", "false")
    queryParams.append("private", "true")
    queryParams.append("safe", "false")
    queryParams.append("quality", "hd")
    queryParams.append("nologo", "true")

    const query = queryParams.toString()
    return `${BASE_URL}/prompt/${encodedPrompt}${query ? `?${query}` : ""}`
  }

  /**
   * Validates dimension value (must be 64-2048 and divisible by 64)
   */
  static validateDimension(value: number): boolean {
    return value >= 64 && value <= 2048 && value % 64 === 0
  }

  /**
   * Rounds dimension to nearest valid value
   */
  static roundDimension(value: number): number {
    const clamped = Math.max(64, Math.min(2048, value))
    return Math.round(clamped / 64) * 64
  }

  /**
   * Generates a random seed
   */
  static generateRandomSeed(): number {
    return Math.floor(Math.random() * 2147483647)
  }
}
