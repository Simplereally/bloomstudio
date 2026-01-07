import type { GeneratedImage } from "@/types/pollinations";

/**
 * Creates a mock GeneratedImage object for testing.
 * Includes all required parameters with sensible defaults.
 */
export function createMockImage(overrides: Partial<GeneratedImage> = {}): GeneratedImage {
    const prompt = overrides.prompt || "A beautiful sunset";
    const id = overrides.id || "test-image-1";

    return {
        id,
        url: overrides.url || "https://example.com/image.jpg",
        prompt,
        timestamp: overrides.timestamp || Date.now(),
        params: {
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
            ...overrides.params,
        },
        ...overrides,
    };
}
