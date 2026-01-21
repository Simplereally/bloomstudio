/**
 * Model Accessors
 *
 * Helper functions and derived lists for accessing model configuration.
 */

import type { AspectRatioOption, ModelConstraints } from "@/types/pollinations";
import type { ModelDefinition } from "./model-types";
import { MODEL_REGISTRY } from "./model-registry";

// ============================================================================
// Accessors
// ============================================================================

/**
 * Get a model by ID. Returns undefined if not found.
 */
export function getModel(modelId: string): ModelDefinition | undefined {
  return MODEL_REGISTRY[modelId.toLowerCase()];
}

/**
 * Get model constraints. Returns undefined if model not found.
 */
export function getModelConstraints(modelId: string): ModelConstraints | undefined {
  return getModel(modelId)?.constraints;
}

/**
 * Get model aspect ratios. Returns undefined if model not found.
 */
export function getModelAspectRatios(modelId: string): readonly AspectRatioOption[] | undefined {
  return getModel(modelId)?.aspectRatios;
}

/**
 * Get model display name. Returns undefined if model not found.
 */
export function getModelDisplayName(modelId: string): string | undefined {
  return getModel(modelId)?.displayName;
}

/**
 * Check if a model supports negative prompts. Returns false if model not found or doesn't support it.
 */
export function getModelSupportsNegativePrompt(modelId: string): boolean {
  return getModel(modelId)?.supportsNegativePrompt ?? false;
}

/**
 * Check if a model supports reference image input. Returns false if model not found or doesn't support it.
 */
export function getModelSupportsReferenceImage(modelId: string): boolean {
  return getModel(modelId)?.supportsReferenceImage ?? false;
}

// ============================================================================
// Model Lists
// ============================================================================

/** All model IDs */
export const ALL_MODEL_IDS = Object.keys(MODEL_REGISTRY);

/** Image model IDs only */
export const IMAGE_MODEL_IDS = Object.values(MODEL_REGISTRY)
  .filter((m) => m.type === "image")
  .map((m) => m.id);

/** Video model IDs only */
export const VIDEO_MODEL_IDS = Object.values(MODEL_REGISTRY)
  .filter((m) => m.type === "video")
  .map((m) => m.id);
