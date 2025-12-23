/**
 * Pollinations Types
 *
 * Re-exports all types from the Zod schema file for convenience.
 * UI-specific types that don't need runtime validation are defined here.
 */

// Re-export everything from the schema file
export * from "@/lib/schemas/pollinations.schema"

// UI-specific types that don't need runtime validation

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9" | "custom"

export interface AspectRatioOption {
  label: string
  value: AspectRatio
  width: number
  height: number
  icon: string
}
