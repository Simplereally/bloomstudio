/**
 * Models API Service
 *
 * Functions for fetching available models from gen.pollinations.ai.
 * Designed to be used with TanStack Query hooks.
 * Following SRP: handles only model-related API operations.
 */

import { API_CONFIG } from "@/lib/config/api.config";
import { PollinationsAPI } from "@/lib/pollinations-api";
import { ImageModelsResponseSchema, type ImageModelInfo } from "@/lib/schemas/pollinations.schema";
import { PollinationsApiError, ClientErrorCodeConst } from "./image-api";

/**
 * Fetches available image models from the API.
 *
 * @returns Promise resolving to array of image model info
 * @throws PollinationsApiError if fetch fails
 */
export async function fetchImageModels(): Promise<ImageModelInfo[]> {
  const url = `${API_CONFIG.baseUrl}/image/models`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...PollinationsAPI.getHeaders(),
        Accept: "application/json",
      },
      // Cache for 5 minutes - models don't change frequently
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new PollinationsApiError(
        `Failed to fetch image models: ${response.status}`,
        ClientErrorCodeConst.GENERATION_FAILED,
        response.status
      );
    }

    const data = await response.json();

    // Validate response with Zod
    return ImageModelsResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof PollinationsApiError) {
      throw error;
    }

    throw new PollinationsApiError(
      error instanceof Error ? error.message : "Failed to fetch image models",
      ClientErrorCodeConst.UNKNOWN_ERROR
    );
  }
}

/**
 * Get a single model's info by name or alias
 *
 * @param modelName - The model name or alias to find
 * @returns Promise resolving to model info or undefined if not found
 */
export async function fetchImageModel(modelName: string): Promise<ImageModelInfo | undefined> {
  const models = await fetchImageModels();
  return models.find((m) => m.name === modelName || m.aliases.includes(modelName));
}
