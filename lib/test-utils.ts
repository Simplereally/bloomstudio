import type { GeneratedImage } from "@/types/pollinations";

/**
 * DeepPartial type helper for nested partial objects
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Creates a mock GeneratedImage object for testing.
 * Includes all required parameters with sensible defaults.
 */
export function createMockImage(overrides: DeepPartial<GeneratedImage> = {}): GeneratedImage {
    const prompt = overrides.prompt || "A beautiful sunset";
    const id = overrides.id || "test-image-1";

    const defaultParams = {
        prompt,
        model: "zimage",
        width: 1024,
        height: 1024,
        enhance: false,
        quality: "medium",
        private: false,
        nologo: false,
        nofeed: false,
        safe: false,
        transparent: false,
    };

    // Merge default params with any overrides provided in params
    const mergedParams = {
        ...defaultParams,
        ...(overrides.params || {}),
    };

    return {
        id,
        url: overrides.url || "https://example.com/image.jpg",
        prompt,
        timestamp: overrides.timestamp || Date.now(),
        params: mergedParams as any,
        ...(overrides as any),
    };
}
