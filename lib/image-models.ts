// Model definitions following SOC - Separated from API logic

import type { ModelInfo, AspectRatioOption } from "@/types/pollinations"

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
    id: "flux-realism",
    name: "Flux Realism",
    description: "Photorealistic images with high detail",
    style: "Photorealistic",
  },
  {
    id: "flux-anime",
    name: "Flux Anime",
    description: "Anime and manga style illustrations",
    style: "Anime",
  },
  {
    id: "flux-3d",
    name: "Flux 3D",
    description: "3D rendered style with depth",
    style: "3D Render",
  },
  {
    id: "any-dark",
    name: "Any Dark",
    description: "Dark aesthetic with moody atmosphere",
    style: "Dark",
  },
]

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "Square", value: "1:1", width: 1024, height: 1024 },
  { label: "Landscape", value: "16:9", width: 1344, height: 768 },
  { label: "Portrait", value: "9:16", width: 768, height: 1344 },
  { label: "Photo", value: "4:3", width: 1152, height: 896 },
  { label: "Portrait Photo", value: "3:4", width: 896, height: 1152 },
  { label: "Ultrawide", value: "21:9", width: 1536, height: 640 },
  { label: "Custom", value: "custom", width: 1024, height: 1024 },
]

export const DEFAULT_DIMENSIONS = {
  MIN: 64,
  MAX: 2048,
  STEP: 64,
  DEFAULT: 1024,
}
