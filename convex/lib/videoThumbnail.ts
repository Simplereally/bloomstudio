"use node"

/**
 * Video Thumbnail Generation
 * 
 * Extracts the first frame from a video buffer and creates a 128x128 JPEG thumbnail.
 * Uses fluent-ffmpeg with ffmpeg-static for Node.js video processing.
 * 
 * Optimized for speed:
 * - Extracts only the first frame (no seeking)
 * - Disables audio processing
 * - Pipes output to memory (no output temp file)
 * 
 * Note: Uses temp file for input because MP4's moov atom structure requires
 * seeking, which isn't possible with pure streaming. The disk I/O overhead
 * is minimal for single-frame extraction.
 * 
 * Note: This file must be bundled with external packages enabled in convex.json:
 * {
 *   "node": {
 *     "externalPackages": ["ffmpeg-static", "fluent-ffmpeg"]
 *   }
 * }
 */

import { tmpdir } from "os"
import { join } from "path"
import { writeFile, unlink, mkdir } from "fs/promises"
import { randomUUID } from "crypto"

// ============================================================
// Types
// ============================================================

/** Configuration for video thumbnail generation */
interface VideoThumbnailConfig {
    /** Size in pixels (square thumbnail) */
    size: number
    /** JPEG quality (2-31 for ffmpeg, lower is better quality) */
    ffmpegQuality: number
}

// ============================================================
// Configuration
// ============================================================

/** Default thumbnail configuration */
const THUMBNAIL_CONFIG: VideoThumbnailConfig = {
    size: 128,
    ffmpegQuality: 3, // ~80% quality (2=high quality, 3-4=good balance)
}

// ============================================================
// Module-level ffmpeg setup (cached to avoid import overhead per call)
// ============================================================

import type Ffmpeg from "fluent-ffmpeg"

let ffmpegPromise: Promise<typeof Ffmpeg> | null = null

function getFfmpeg(): Promise<typeof Ffmpeg> {
    if (!ffmpegPromise) {
        ffmpegPromise = (async () => {
            const importStart = performance.now() // PERF_LOG
            const ffmpegStatic = (await import("ffmpeg-static")).default
            console.log(`[VideoThumbnail] [PERF] import ffmpeg-static took ${(performance.now() - importStart).toFixed(1)}ms`) // PERF_LOG
            
            const moduleStart = performance.now() // PERF_LOG
            const ffmpegModule = await import("fluent-ffmpeg")
            console.log(`[VideoThumbnail] [PERF] import fluent-ffmpeg took ${(performance.now() - moduleStart).toFixed(1)}ms`) // PERF_LOG

            if (!ffmpegStatic) {
                throw new Error("ffmpeg-static binary not found")
            }

            ffmpegModule.default.setFfmpegPath(ffmpegStatic)
            return ffmpegModule.default
        })()
    }
    return ffmpegPromise
}

// ============================================================
// Video Thumbnail Generation
// ============================================================

/**
 * Extract a thumbnail from the first frame of a video buffer
 * 
 * Uses temp file for input (required for MP4 seeking) but pipes output to memory.
 * Optimized for speed:
 * - Uses `frames(1)` to stop after decoding just one frame
 * - Uses `noAudio()` to skip audio processing entirely
 * - No seeking into video means minimal data processing
 * - Center-crops to square and resizes to 128x128
 * 
 * @param videoBuffer - Video data as a Buffer (MP4, WebM, AVI, or MKV)
 * @returns JPEG thumbnail buffer, or null if extraction fails
 */
export async function extractVideoThumbnail(
    videoBuffer: Buffer
): Promise<Buffer | null> {
    const logger = "[VideoThumbnail]"
    const startTime = performance.now() // PERF_LOG

    // Create temp directory and input file
    const mkdirStart = performance.now() // PERF_LOG
    const tempDir = join(tmpdir(), "pixelstream-thumbnails")
    await mkdir(tempDir, { recursive: true })
    console.log(`${logger} [PERF] mkdir took ${(performance.now() - mkdirStart).toFixed(1)}ms`) // PERF_LOG
    
    const inputPath = join(tempDir, `input-${randomUUID()}.mp4`)

    try {
        const ffmpegInitStart = performance.now() // PERF_LOG
        const ffmpeg = await getFfmpeg()
        console.log(`${logger} [PERF] getFfmpeg() took ${(performance.now() - ffmpegInitStart).toFixed(1)}ms`) // PERF_LOG

        // Write video to temp file - required because MP4 moov atom needs seeking
        const writeStart = performance.now() // PERF_LOG
        await writeFile(inputPath, videoBuffer)
        const writeTime = performance.now() - writeStart // PERF_LOG
        console.log(`${logger} [PERF] writeFile took ${writeTime.toFixed(1)}ms for ${videoBuffer.length} bytes (${(videoBuffer.length / 1024 / 1024 / (writeTime / 1000)).toFixed(1)} MB/s)`) // PERF_LOG

        // Process video: temp file input, pipe output to memory
        const ffmpegStart = performance.now() // PERF_LOG
        const thumbnailBuffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = []
            let settled = false

            const settle = (fn: () => void) => {
                if (!settled) {
                    settled = true
                    fn()
                }
            }

            const command = ffmpeg(inputPath)
                .inputOptions(["-nostdin"])   // Don't wait on stdin
                .noAudio()                    // Skip audio processing entirely
                .frames(1)                    // Stop after 1 frame - critical for speed
                .outputOptions([
                    "-vf", `crop=min(iw\\,ih):min(iw\\,ih),scale=${THUMBNAIL_CONFIG.size}:${THUMBNAIL_CONFIG.size}`,
                    "-q:v", THUMBNAIL_CONFIG.ffmpegQuality.toString(),
                ])
                .format("mjpeg")              // Output as JPEG (for piping)
                .on("error", (err: Error) =>
                    settle(() => {
                        console.error(`${logger} ffmpeg error:`, err.message)
                        command.kill("SIGKILL")
                        reject(err)
                    })
                )
                .on("end", () => settle(() => resolve(Buffer.concat(chunks))))

            command.pipe()
                .on("data", (chunk: Buffer) => chunks.push(chunk))
        })
        console.log(`${logger} [PERF] ffmpeg processing took ${(performance.now() - ffmpegStart).toFixed(1)}ms`) // PERF_LOG

        const totalTime = performance.now() - startTime // PERF_LOG
        console.log(`${logger} [PERF] TOTAL extractVideoThumbnail took ${totalTime.toFixed(1)}ms`) // PERF_LOG
        console.log(`${logger} Thumbnail extracted successfully (${thumbnailBuffer.length} bytes)`)
        return thumbnailBuffer

    } catch (error) {
        console.error(`${logger} Failed to extract video thumbnail:`, error)
        return null
    } finally {
        // Cleanup temp file
        const cleanupStart = performance.now() // PERF_LOG
        await unlink(inputPath).catch(() => { /* ignore cleanup errors */ })
        console.log(`${logger} [PERF] cleanup took ${(performance.now() - cleanupStart).toFixed(1)}ms`) // PERF_LOG
    }
}
