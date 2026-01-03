"use server"

import { PollinationsAPI } from "@/lib/pollinations-api"
import type { GeneratedImage, ImageGenerationParams } from "@/types/pollinations"

import { ImageGenerationParamsSchema } from "@/lib/schemas/pollinations.schema"

export async function generateImageAction(params: ImageGenerationParams): Promise<GeneratedImage> {
    // Validate and fill defaults
    const resolvedParams = ImageGenerationParamsSchema.parse(params)
    const url = PollinationsAPI.buildImageUrl(resolvedParams)
 
    try {
        // We fetch the image on the server to trigger the generation.
        // This ensures that the server action hangs until Pollinations has finished rendering.
        const response = await fetch(url, {
            method: "GET",
            // Add a cache-busting or specific headers if needed, but Pollinations prompt is unique enough
        })

        if (!response.ok) {
            throw new Error(`Pollinations API responded with ${response.status}`)
        }

        // Return the image metadata. Since we've already fetched it, 
        // the client request for the same URL will likely hit the CDN/Cache immediately.
        return {
            id: Date.now().toString(),
            url,
            prompt: resolvedParams.prompt,
            params: resolvedParams, // Now matches strict type
            timestamp: Date.now(),
        }
    } catch (error) {
        console.error("Error in generateImageAction:", error)
        throw new Error("Failed to generate image. Please try again.")
    }
}
