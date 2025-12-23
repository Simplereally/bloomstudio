// Type definitions for Pollinations API following SRP

export type ImageModel = "flux" | "turbo" | "flux-realism" | "flux-anime" | "flux-3d" | "any-dark"

export interface ImageGenerationParams {
  prompt: string
  negativePrompt?: string
  model?: ImageModel
  width?: number
  height?: number
  seed?: number
  enhance?: boolean
  private?: boolean
  safe?: boolean
}

export interface ModelInfo {
  id: ImageModel
  name: string
  description: string
  style: string
}

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  params: ImageGenerationParams
  timestamp: number
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9" | "custom"

export interface AspectRatioOption {
  label: string
  value: AspectRatio
  width: number
  height: number
  icon: string
}
