/**
 * Image Generation Constants
 *
 * UI-specific constants for image generation that are not API-dependent.
 */

import type { AspectRatioOption } from "@/types/pollinations"

/**
 * Aspect ratio options for image generation.
 * These are UI-specific presets, not determined by the API.
 */
export const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square" },
  { label: "Landscape", value: "16:9", width: 1344, height: 768, icon: "rectangle-horizontal" },
  { label: "Portrait", value: "9:16", width: 768, height: 1344, icon: "rectangle-vertical" },
  { label: "Photo", value: "4:3", width: 1152, height: 896, icon: "image" },
  { label: "Portrait Photo", value: "3:4", width: 896, height: 1152, icon: "frame" },
  { label: "Ultrawide", value: "21:9", width: 1536, height: 640, icon: "monitor" },
  { label: "Custom", value: "custom", width: 1024, height: 1024, icon: "sliders" },
]

/**
 * Default dimension constraints for image generation.
 * These match the API constraints from api.config.ts but are kept here
 * for backwards compatibility with existing UI code.
 * 
 * @see API_CONSTRAINTS in @/lib/config/api.config for the canonical source
 */
export const DEFAULT_DIMENSIONS = {
  MIN: 64,
  MAX: 2048,
  STEP: 64,
  DEFAULT: 1024,
}
