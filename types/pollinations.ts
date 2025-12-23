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
