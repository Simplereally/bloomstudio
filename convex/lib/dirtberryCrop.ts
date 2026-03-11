"use node"

export const DIRTBERRY_TRIM_FRACTION = 0.03
export const DIRTBERRY_SOURCE_WIDTH = 832
export const DIRTBERRY_SOURCE_HEIGHT = 1216
export const DIRTBERRY_OUTPUT_HEIGHT =
    DIRTBERRY_SOURCE_HEIGHT - Math.round(DIRTBERRY_SOURCE_HEIGHT * DIRTBERRY_TRIM_FRACTION) * 2

const JIMP_ENCODABLE_MIME_TYPES = new Set([
    "image/bmp",
    "image/x-ms-bmp",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/tiff",
] as const)

type JimpEncodableMime = "image/bmp" | "image/x-ms-bmp" | "image/gif" | "image/jpeg" | "image/png" | "image/tiff"

type DirtberryCropRegion = {
    top: number
    height: number
}

export type DirtberryCropResult = {
    buffer: Buffer
    width: number
    height: number
    wasCropped: boolean
    inputWidth: number
    inputHeight: number
    trimPixels: number
    processor: "jimp" | "none"
}

export function getDirtberrySourceDimensions(): { width: number; height: number } {
    return {
        width: DIRTBERRY_SOURCE_WIDTH,
        height: DIRTBERRY_SOURCE_HEIGHT,
    }
}

export function isDirtberryModel(model?: string): boolean {
    const normalized = model?.trim().toLowerCase()
    if (!normalized) {
        return false
    }
    return normalized === "dirtberry" || normalized.includes("dirtberry")
}

/**
 * Calculate Dirtberry's watermark-removal crop region.
 * Trims 3% from top and bottom when the resulting crop is valid.
 */
export function calculateDirtberryCropRegion(height: number): DirtberryCropRegion | null {
    if (!Number.isFinite(height) || height <= 0) return null

    const trimPixels = Math.round(height * DIRTBERRY_TRIM_FRACTION)
    const croppedHeight = height - trimPixels * 2

    if (trimPixels <= 0 || croppedHeight <= 0) {
        return null
    }

    return {
        top: trimPixels,
        height: croppedHeight,
    }
}

/**
 * Crop Dirtberry images to remove corner watermarks before persistence.
 * Returns original data if crop is not applicable.
 */
export async function cropDirtberryImageBuffer(
    imageBuffer: Buffer
): Promise<DirtberryCropResult> {
    // Use jimp only (pure JS) so Convex linux-arm64 deployments don't fail
    // on native sharp module loading.
    const { Jimp } = await import("jimp")
    const image = await Jimp.read(imageBuffer)
    const width = image.bitmap.width
    const height = image.bitmap.height

    if (!width || !height) {
        throw new Error("Unable to read Dirtberry image dimensions")
    }

    const region = calculateDirtberryCropRegion(height)
    if (!region) {
        return {
            buffer: imageBuffer,
            width,
            height,
            wasCropped: false,
            inputWidth: width,
            inputHeight: height,
            trimPixels: 0,
            processor: "none",
        }
    }

    image.crop({
        x: 0,
        y: region.top,
        w: width,
        h: region.height,
    })

    const inputMime = image.mime
    const outputMime: JimpEncodableMime =
        inputMime && JIMP_ENCODABLE_MIME_TYPES.has(inputMime as JimpEncodableMime)
            ? (inputMime as JimpEncodableMime)
            : "image/jpeg"
    const croppedBuffer =
        outputMime === "image/jpeg"
            ? Buffer.from(await image.getBuffer(outputMime, { quality: 100 }))
            : Buffer.from(await image.getBuffer(outputMime))

    return {
        buffer: croppedBuffer,
        width,
        height: region.height,
        wasCropped: true,
        inputWidth: width,
        inputHeight: height,
        trimPixels: region.top,
        processor: "jimp",
    }
}
