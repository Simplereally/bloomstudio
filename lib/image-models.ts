/**
 * Image Generation Constants
 *
 * UI-specific constants for image generation that are not API-dependent.
 * Default aspect ratios use dimensions that are safe for most models.
 */

import type { AspectRatioOption } from "@/types/pollinations"

/**
 * Aspect ratio options for image generation.
 * These are UI-specific presets with dimensions that work across most models.
 * For model-specific presets (like Flux with 1MP limit), use getModelAspectRatios().
 *
 * Note: These dimensions are designed to be generally safe but may be
 * adjusted dynamically based on model constraints.
 */
export const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
  { label: "Landscape", value: "16:9", width: 1344, height: 768, icon: "rectangle-horizontal", category: "landscape" },
  { label: "Portrait", value: "9:16", width: 768, height: 1344, icon: "rectangle-vertical", category: "portrait" },
  { label: "Photo", value: "4:3", width: 1152, height: 896, icon: "image", category: "landscape" },
  { label: "Portrait Photo", value: "3:4", width: 896, height: 1152, icon: "frame", category: "portrait" },
  { label: "Photo Wide", value: "3:2", width: 1248, height: 832, icon: "image", category: "landscape" },
  { label: "Photo Tall", value: "2:3", width: 832, height: 1248, icon: "frame", category: "portrait" },
  { label: "Social", value: "4:5", width: 896, height: 1120, icon: "smartphone", category: "portrait" },
  { label: "Social Wide", value: "5:4", width: 1120, height: 896, icon: "monitor", category: "landscape" },
  { label: "Ultrawide", value: "21:9", width: 1536, height: 640, icon: "monitor", category: "ultrawide" },
  { label: "Ultra Tall", value: "9:21", width: 640, height: 1536, icon: "smartphone", category: "ultrawide" },
  { label: "Custom", value: "custom", width: 1024, height: 1024, icon: "sliders", category: "square" },
]

/**
 * Default dimension constraints for image generation.
 * These match the API constraints from api.config.ts but are kept here
 * for backwards compatibility with existing UI code.
 *
 * @see API_CONSTRAINTS in @/lib/config/api.config for the canonical source
 * @see getModelConstraints in @/lib/config/models for model-specific constraints
 */
export const DEFAULT_DIMENSIONS = {
  MIN: 64,
  MAX: 2048,
  STEP: 64,
  DEFAULT: 1024,
}
