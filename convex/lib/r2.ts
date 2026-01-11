"use node"

/**
 * Cloudflare R2 storage utilities
 * 
 * Provides functions for uploading images to R2 storage.
 * Requires R2 environment variables to be set in Convex.
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { NodeHttpHandler } from "@smithy/node-http-handler"
import { Agent as HttpsAgent } from "https"
import crypto from "crypto"
import { extractVideoThumbnail } from "./videoThumbnail"

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
            const initStart = performance.now() // PERF_LOG
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
            console.log(`[R2] [PERF] S3Client initialization took ${(performance.now() - initStart).toFixed(1)}ms`) // PERF_LOG
            return client
        })()
    } else {
        console.log(`[R2] [PERF] S3Client cache hit (reusing existing client)`) // PERF_LOG
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
    const startTime = performance.now() // PERF_LOG
    const bucketName = process.env.R2_BUCKET_NAME
    const publicUrl = process.env.R2_PUBLIC_URL

    if (!bucketName || !publicUrl) {
        throw new Error("R2 configuration incomplete. Check R2_BUCKET_NAME and R2_PUBLIC_URL.")
    }

    const clientStart = performance.now() // PERF_LOG
    const client = await getS3Client()
    console.log(`[R2] [PERF] getS3Client() took ${(performance.now() - clientStart).toFixed(1)}ms`) // PERF_LOG

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
    })

    const uploadStart = performance.now() // PERF_LOG
    await client.send(command)
    const uploadTime = performance.now() - uploadStart // PERF_LOG
    const sizeMB = imageBuffer.length / 1024 / 1024 // PERF_LOG
    console.log(`[R2] [PERF] client.send() took ${uploadTime.toFixed(1)}ms for ${sizeMB.toFixed(2)}MB (${(sizeMB / (uploadTime / 1000)).toFixed(1)} MB/s)`) // PERF_LOG
    console.log(`[R2] [PERF] TOTAL uploadToR2 took ${(performance.now() - startTime).toFixed(1)}ms for ${key}`) // PERF_LOG

    return {
        url: `${publicUrl}/${key}`,
        sizeBytes: imageBuffer.length,
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

/** Result of parallel media upload with thumbnail */
export interface MediaUploadResult {
    /** Main media upload result */
    media: R2UploadResult
    /** Thumbnail upload result (null if generation/upload failed) */
    thumbnail: R2UploadResult | null
}

/**
 * Upload media to R2 and generate/upload thumbnail in parallel
 * 
 * For videos: Runs video upload and thumbnail extraction concurrently,
 * then uploads thumbnail once extracted. This reduces total time by
 * ~1-2 seconds compared to sequential processing.
 * 
 * For images: Falls back to sequential processing (thumbnail generation
 * is fast enough that parallelization overhead isn't worth it).
 * 
 * @param buffer - Media data as a Buffer
 * @param r2Key - R2 key for the main media file
 * @param contentType - MIME type of the media
 * @returns Upload results for both media and thumbnail
 */
export async function uploadMediaWithThumbnail(
    buffer: Buffer,
    r2Key: string,
    contentType: string
): Promise<MediaUploadResult> {
    const startTime = performance.now() // PERF_LOG
    const isVideo = contentType.startsWith("video/")

    if (isVideo) {
        // For videos: run upload and thumbnail extraction in parallel
        console.log(`[Upload] [PERF] Starting parallel video upload + thumbnail extraction (buffer: ${(buffer.length / 1024 / 1024).toFixed(2)}MB)...`) // PERF_LOG
        
        const parallelStart = performance.now() // PERF_LOG
        const [mediaResult, thumbnailBuffer] = await Promise.all([
            uploadToR2(buffer, r2Key, contentType),
            extractVideoThumbnail(buffer),
        ])
        console.log(`[Upload] [PERF] Promise.all (video upload + thumbnail extract) took ${(performance.now() - parallelStart).toFixed(1)}ms`) // PERF_LOG

        console.log(`[Upload] Video uploaded: ${mediaResult.url}`)

        // Now upload thumbnail (if extraction succeeded)
        let thumbnailResult: R2UploadResult | null = null
        if (thumbnailBuffer) {
            const thumbnailKey = generateThumbnailKey(r2Key)
            const thumbUploadStart = performance.now() // PERF_LOG
            thumbnailResult = await uploadToR2(thumbnailBuffer, thumbnailKey, "image/jpeg")
            console.log(`[Upload] [PERF] thumbnail upload took ${(performance.now() - thumbUploadStart).toFixed(1)}ms`) // PERF_LOG
            console.log(`[Upload] Thumbnail uploaded: ${thumbnailResult.url}`)
        } else {
            console.log("[Upload] Thumbnail extraction failed, skipping upload")
        }

        console.log(`[Upload] [PERF] TOTAL uploadMediaWithThumbnail (video) took ${(performance.now() - startTime).toFixed(1)}ms`) // PERF_LOG
        return { media: mediaResult, thumbnail: thumbnailResult }
    } else {
        // For images: sequential is fine (jimp is fast)
        console.log(`[Upload] [PERF] Starting sequential image upload (buffer: ${(buffer.length / 1024 / 1024).toFixed(2)}MB)...`) // PERF_LOG
        
        const mediaStart = performance.now() // PERF_LOG
        const mediaResult = await uploadToR2(buffer, r2Key, contentType)
        console.log(`[Upload] [PERF] image upload took ${(performance.now() - mediaStart).toFixed(1)}ms`) // PERF_LOG
        
        const thumbStart = performance.now() // PERF_LOG
        const thumbnailResult = await generateAndUploadThumbnail(buffer, r2Key, contentType)
        console.log(`[Upload] [PERF] thumbnail generation+upload took ${(performance.now() - thumbStart).toFixed(1)}ms`) // PERF_LOG
        
        console.log(`[Upload] [PERF] TOTAL uploadMediaWithThumbnail (image) took ${(performance.now() - startTime).toFixed(1)}ms`) // PERF_LOG
        return { media: mediaResult, thumbnail: thumbnailResult }
    }
}
