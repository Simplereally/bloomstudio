"use node"

/**
 * Cloudflare R2 storage utilities
 * 
 * Provides functions for uploading images to R2 storage.
 * Requires R2 environment variables to be set in Convex.
 */

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { NodeHttpHandler } from "@smithy/node-http-handler"
import { Agent as HttpsAgent } from "https"
import crypto from "crypto"
import { extractVideoThumbnail } from "./videoThumbnail"
import { generateVideoPreview, shouldGeneratePreview } from "./videoPreview"

// ============================================================
// S3 Client (cached for connection reuse)
// ============================================================

let s3ClientPromise: Promise<S3Client> | null = null

/**
 * HTTPS agent with connection pooling
 * 
 * Critical for performance: without keepAlive, each upload establishes
 * a new TLS connection (~1-3s overhead). With keepAlive, subsequent
 * requests reuse warm connections (<100ms overhead).
 * 
 * Cloudflare R2's idle timeout is 400 seconds for client connections.
 * We use 360s (6 min) to stay safely below this limit while maximizing
 * connection reuse across Convex function invocations.
 * 
 * @see https://developers.cloudflare.com/fundamentals/reference/connection-limits/
 */
const httpsAgent = new HttpsAgent({
    keepAlive: true,           // Reuse TCP connections
    maxSockets: 25,            // Connection pool size
    keepAliveMsecs: 360000,    // Keep idle connections alive for 6 min (R2 idle timeout is 400s)
})

function getS3Client(): Promise<S3Client> {
    if (!s3ClientPromise) {
        s3ClientPromise = (async () => {

            const accountId = process.env.R2_ACCOUNT_ID
            const accessKeyId = process.env.R2_ACCESS_KEY_ID
            const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

            if (!accountId || !accessKeyId || !secretAccessKey) {
                throw new Error("R2 configuration incomplete. Check environment variables.")
            }

            const client = new S3Client({
                region: "auto",
                endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
                requestHandler: new NodeHttpHandler({
                    httpsAgent,
                    connectionTimeout: 5000,   // 5s to establish connection
                    socketTimeout: 60000,      // 60s for large uploads
                }),
            })

            return client
        })()
    } else {

    }
    return s3ClientPromise
}

// ============================================================
// Types
// ============================================================

/** Result of an R2 upload operation */
export interface R2UploadResult {
    /** Public URL of the uploaded object */
    url: string
    /** Size of the uploaded object in bytes */
    sizeBytes: number
}

// ============================================================
// Key Generation
// ============================================================

/**
 * Generate a unique R2 object key for an image
 * 
 * @param userId - Owner's user ID (Clerk subject)
 * @param contentType - MIME type of the image
 * @returns Unique object key in the format: generated/{hash(userId)}/{timestamp}-{uuid}.{ext}
 */
export function generateR2Key(userId: string, contentType: string): string {
    const ext = contentType.split("/")[1] || "jpg"
    const timestamp = Date.now()
    const randomId = crypto.randomUUID()
    const userHash = crypto.createHash("sha256").update(userId).digest("hex")
    return `generated/${userHash}/${timestamp}-${randomId}.${ext}`
}

// ============================================================
// Upload
// ============================================================

/**
 * Upload an image buffer to R2 storage
 * 
 * @param imageBuffer - Image data as a Buffer
 * @param key - R2 object key (path within bucket)
 * @param contentType - MIME type of the image
 * @returns Upload result with URL and size
 * @throws Error if R2 configuration is incomplete
 */
export async function uploadToR2(
    imageBuffer: Buffer,
    key: string,
    contentType: string
): Promise<R2UploadResult> {

    const bucketName = process.env.R2_BUCKET_NAME
    const publicUrl = process.env.R2_PUBLIC_URL

    if (!bucketName || !publicUrl) {
        throw new Error("R2 configuration incomplete. Check R2_BUCKET_NAME and R2_PUBLIC_URL.")
    }

    const client = await getS3Client()


    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
    })

    await client.send(command)


    return {
        url: `${publicUrl}/${key}`,
        sizeBytes: imageBuffer.length,
    }
}

// ============================================================
// Deletion
// ============================================================

/**
 * Best-effort delete one or more R2 objects by key.
 * Failures are logged but never thrown — this is designed for
 * cleanup paths where we must not mask the primary error.
 *
 * @param keys - R2 object keys to delete
 */
export async function deleteR2Objects(keys: string[]): Promise<void> {
    if (keys.length === 0) return
    try {
        const bucketName = process.env.R2_BUCKET_NAME
        if (!bucketName) {
            console.error("[R2 Cleanup] R2_BUCKET_NAME not configured, skipping delete")
            return
        }
        const client = await getS3Client()
        await Promise.allSettled(
            keys.map(async (key) => {
                try {
                    await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))
                } catch (err) {
                    console.error(`[R2 Cleanup] Failed to delete ${key}:`, err)
                }
            })
        )
    } catch (err) {
        console.error("[R2 Cleanup] Failed to initialise R2 client, skipping delete:", err)
    }
}

// ============================================================
// Thumbnail Generation
// ============================================================

/** Thumbnail configuration */
const THUMBNAIL_SIZE = 128 // pixels (square)
const THUMBNAIL_QUALITY = 80 // JPEG quality (0-100)

/**
 * Generate a thumbnail R2 key from an original key
 * 
 * @param originalKey - Original image R2 key
 * @returns Thumbnail key with "thumbnails/" prefix instead of "generated/"
 */
export function generateThumbnailKey(originalKey: string): string {
    return originalKey.replace(/^generated\//, "thumbnails/").replace(/\.[^.]+$/, ".jpg")
}

/**
 * Generate a preview R2 key from an original key
 * 
 * @param originalKey - Original media R2 key
 * @returns Preview key with "previews/" prefix instead of "generated/"
 */
export function generatePreviewKey(originalKey: string): string {
    return originalKey.replace(/^generated\//, "previews/")
}

/**
 * Generate and upload a thumbnail version of an image or video
 * 
 * For images: Creates a 128x128 center-cropped JPEG at 80% quality (~3-5KB typical size).
 * Uses jimp for pure JS image processing.
 * 
 * For videos: Extracts a frame at 0.5s using ffmpeg, center-crops, and resizes to 128x128.
 * Uses fluent-ffmpeg with ffmpeg-static (external packages in convex.json).
 * 
 * @param buffer - Original media data as a Buffer (image or video)
 * @param originalKey - R2 key of the original (used to derive thumbnail key)
 * @param contentType - MIME type of the original
 * @returns Upload result with thumbnail URL and size, or null if generation fails
 */
export async function generateAndUploadThumbnail(
    buffer: Buffer,
    originalKey: string,
    contentType: string
): Promise<R2UploadResult | null> {
    try {
        let thumbnailBuffer: Buffer | null = null

        if (contentType.startsWith("video/")) {
            // For videos, use ffmpeg to extract a frame
            console.log("[Thumbnail] Extracting video thumbnail with ffmpeg...")
            thumbnailBuffer = await extractVideoThumbnail(buffer)

            if (!thumbnailBuffer) {
                console.log("[Thumbnail] Video thumbnail extraction failed")
                return null
            }
        } else {
            // For images, use jimp (pure JS, works in Convex runtime)
            const { Jimp } = await import("jimp")

            const image = await Jimp.read(buffer)

            // Calculate crop dimensions for center-crop "cover" behavior
            const width = image.width
            const height = image.height
            const minDim = Math.min(width, height)

            // Center crop to square
            const cropX = Math.floor((width - minDim) / 2)
            const cropY = Math.floor((height - minDim) / 2)

            // Process: center-crop to square, then resize to thumbnail size
            image.crop({ x: cropX, y: cropY, w: minDim, h: minDim })
            image.resize({ w: THUMBNAIL_SIZE, h: THUMBNAIL_SIZE })

            // Export as JPEG buffer
            thumbnailBuffer = Buffer.from(
                await image.getBuffer("image/jpeg", { quality: THUMBNAIL_QUALITY })
            )
        }

        // Generate thumbnail key and upload
        const thumbnailKey = generateThumbnailKey(originalKey)

        return await uploadToR2(thumbnailBuffer, thumbnailKey, "image/jpeg")
    } catch (error) {
        // Log but don't throw - thumbnail generation is non-critical
        console.error("[Thumbnail] Failed to generate thumbnail:", error)
        return null
    }
}

// ============================================================
// Parallel Upload with Thumbnail
// ============================================================

/** Result of media upload with optional thumbnail (synchronous assets only) */
export interface MediaUploadResult {
    /** Main media upload result */
    media: R2UploadResult
    /** Thumbnail upload result (null for videos — handled asynchronously) */
    thumbnail: R2UploadResult | null
    /** Video preview upload result (always null here — handled asynchronously for videos) */
    preview: R2UploadResult | null
}

/**
 * Upload media to R2 with thumbnail generation
 * 
 * **Videos:** Only the R2 upload is awaited (critical path). Thumbnail extraction
 * and preview generation are NOT performed here — they are deferred to a scheduled
 * background action (`secondaryAssets.processSecondaryAssets`) to avoid blocking
 * the generation completion by ~30-40s of ffmpeg transcoding.
 * 
 * **Images:** Thumbnail is generated synchronously (jimp is fast, <1s).
 * 
 * @param buffer - Media data as a Buffer
 * @param r2Key - R2 key for the main media file
 * @param contentType - MIME type of the media
 * @returns Upload result for media (and thumbnail for images only)
 */
export async function uploadMediaWithThumbnail(
    buffer: Buffer,
    r2Key: string,
    contentType: string
): Promise<MediaUploadResult> {

    const isVideo = contentType.startsWith("video/")

    if (isVideo) {
        // For videos: ONLY upload the video to R2.
        // Thumbnail and preview are deferred to a background action
        // (scheduled by the caller) to avoid blocking generation completion.
        const mediaResult = await uploadToR2(buffer, r2Key, contentType)
        console.log(`[Upload] Video uploaded: ${mediaResult.url} — thumbnail/preview deferred to background`)

        return { media: mediaResult, thumbnail: null, preview: null }
    } else {
        // For images: sequential is fine (jimp is fast), no preview needed
        
        const mediaResult = await uploadToR2(buffer, r2Key, contentType)
        
        const thumbnailResult = await generateAndUploadThumbnail(buffer, r2Key, contentType)
        
        return { media: mediaResult, thumbnail: thumbnailResult, preview: null }
    }
}

// ============================================================
// Secondary Asset Generation (for background processing)
// ============================================================

/**
 * Generate and upload all secondary assets for a video.
 * 
 * Called by the `secondaryAssets.processSecondaryAssets` action after
 * the generation has already been marked as completed. Failures here
 * are logged but never propagate — they cannot fail a generation.
 * 
 * @param buffer - Video data as a Buffer
 * @param r2Key - R2 key of the original video
 * @returns Object with thumbnail and preview upload results (each may be null)
 */
export async function generateAndUploadVideoSecondaryAssets(
    buffer: Buffer,
    r2Key: string,
): Promise<{ thumbnail: R2UploadResult | null; preview: R2UploadResult | null }> {
    let thumbnailUploadResult: R2UploadResult | null = null
    let previewUploadResult: R2UploadResult | null = null

    // --- Thumbnail ---
    try {
        const thumbnailBuffer = await extractVideoThumbnail(buffer)
        if (thumbnailBuffer) {
            const thumbnailKey = generateThumbnailKey(r2Key)
            thumbnailUploadResult = await uploadToR2(thumbnailBuffer, thumbnailKey, "image/jpeg")
            console.log(`[SecondaryAssets] Thumbnail uploaded: ${thumbnailUploadResult.url}`)
        } else {
            console.warn("[SecondaryAssets] Thumbnail extraction returned null")
        }
    } catch (error) {
        console.error("[SecondaryAssets] Thumbnail extraction/upload failed (non-fatal):", error)
    }

    // --- Preview ---
    try {
        if (shouldGeneratePreview(buffer.length)) {
            const previewResult = await generateVideoPreview(buffer)
            if (previewResult?.buffer) {
                const previewKey = generatePreviewKey(r2Key)
                previewUploadResult = await uploadToR2(previewResult.buffer, previewKey, "video/mp4")
                console.log(`[SecondaryAssets] Preview uploaded: ${previewUploadResult.url} (${previewResult.compressionRatio.toFixed(1)}% reduction)`)
            } else {
                console.warn("[SecondaryAssets] Preview generation returned null")
            }
        } else {
            console.log(`[SecondaryAssets] Video too small for preview (${(buffer.length / 1024 / 1024).toFixed(2)}MB < 5MB threshold)`)
        }
    } catch (error) {
        console.error("[SecondaryAssets] Preview generation/upload failed (non-fatal):", error)
    }

    return { thumbnail: thumbnailUploadResult, preview: previewUploadResult }
}
