"use node"

/**
 * Video Preview Generation
 * 
 * Creates compressed, lower-bitrate preview versions of videos for the public feed.
 * Uses fluent-ffmpeg with ffmpeg-static for Node.js video processing.
 * 
 * Preview specs (optimized for feed display):
 * - Resolution: 720p max (scaled down if larger, preserved if smaller)
 * - Bitrate: 1.5 Mbps video, 128 kbps audio
 * - Codec: H.264 (libx264) for broad compatibility
 * - Format: MP4 with web-optimized moov atom placement
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
import { writeFile, readFile, unlink, mkdir } from "fs/promises"
import { randomUUID } from "crypto"

// ============================================================
// Types
// ============================================================

/** Configuration for video preview generation */
interface VideoPreviewConfig {
    /** Maximum height in pixels (width scales proportionally) */
    maxHeight: number
    /** Video bitrate in kbps */
    videoBitrate: number
    /** Audio bitrate in kbps */
    audioBitrate: number
    /** H.264 CRF value (lower = better quality, 18-28 recommended) */
    crf: number
    /** FFmpeg preset (affects encoding speed vs compression) */
    preset: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium" | "slow"
}

/** Result of video preview generation */
export interface VideoPreviewResult {
    /** Preview video buffer */
    buffer: Buffer
    /** Size reduction percentage */
    compressionRatio: number
    /** Final dimensions */
    width: number
    height: number
}

// ============================================================
// Configuration
// ============================================================

/** Default preview configuration - balanced for quality and size */
const PREVIEW_CONFIG: VideoPreviewConfig = {
    maxHeight: 720,           // 720p max (most common mobile resolution)
    videoBitrate: 1500,       // 1.5 Mbps - good quality for preview
    audioBitrate: 128,        // 128 kbps AAC - standard audio quality
    crf: 23,                  // Good balance of quality/size
    preset: "veryfast",       // Fast encoding for Convex action limits
}

/** Mobile-optimized preview configuration - smaller for bandwidth savings */
const MOBILE_PREVIEW_CONFIG: VideoPreviewConfig = {
    maxHeight: 480,           // 480p for mobile
    videoBitrate: 800,        // 800 kbps - acceptable quality for mobile
    audioBitrate: 96,         // 96 kbps AAC - adequate for mobile
    crf: 26,                  // More compression
    preset: "veryfast",
}

// ============================================================
// Module-level ffmpeg setup (cached to avoid import overhead per call)
// ============================================================

import type Ffmpeg from "fluent-ffmpeg"

let ffmpegPromise: Promise<typeof Ffmpeg> | null = null

function getFfmpeg(): Promise<typeof Ffmpeg> {
    if (!ffmpegPromise) {
        ffmpegPromise = (async () => {
            const importStart = performance.now()
            const ffmpegStatic = (await import("ffmpeg-static")).default
            console.log(`[VideoPreview] [PERF] import ffmpeg-static took ${(performance.now() - importStart).toFixed(1)}ms`)
            
            const moduleStart = performance.now()
            const ffmpegModule = await import("fluent-ffmpeg")
            console.log(`[VideoPreview] [PERF] import fluent-ffmpeg took ${(performance.now() - moduleStart).toFixed(1)}ms`)

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
// Video Preview Generation
// ============================================================

/**
 * Generate a compressed preview version of a video
 * 
 * Takes the original video buffer and creates a smaller, web-optimized version
 * suitable for feed display. The preview uses H.264 encoding with settings
 * optimized for streaming playback.
 * 
 * @param videoBuffer - Original video data as a Buffer
 * @param config - Optional configuration override
 * @returns Preview result with buffer and metadata, or null if generation fails
 */
export async function generateVideoPreview(
    videoBuffer: Buffer,
    config: VideoPreviewConfig = PREVIEW_CONFIG
): Promise<VideoPreviewResult | null> {
    const logger = "[VideoPreview]"
    const startTime = performance.now()

    // Create temp directory and files
    const tempDir = join(tmpdir(), "bloomstudio-previews")
    await mkdir(tempDir, { recursive: true })
    
    const inputPath = join(tempDir, `input-${randomUUID()}.mp4`)
    const outputPath = join(tempDir, `output-${randomUUID()}.mp4`)

    try {
        const ffmpeg = await getFfmpeg()

        // Write video to temp file
        const writeStart = performance.now()
        await writeFile(inputPath, videoBuffer)
        console.log(`${logger} [PERF] writeFile took ${(performance.now() - writeStart).toFixed(1)}ms for ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`)

        // Generate preview
        const ffmpegStart = performance.now()
        await new Promise<void>((resolve, reject) => {
            let settled = false

            const settle = (fn: () => void) => {
                if (!settled) {
                    settled = true
                    fn()
                }
            }

            const command = ffmpeg(inputPath)
                .inputOptions(["-nostdin"])
                .videoCodec("libx264")
                .audioCodec("aac")
                .outputOptions([
                    // Scale to max height, preserve aspect ratio
                    `-vf`, `scale=-2:'min(${config.maxHeight},ih)'`,
                    // H.264 encoding settings
                    `-preset`, config.preset,
                    `-crf`, config.crf.toString(),
                    `-maxrate`, `${config.videoBitrate}k`,
                    `-bufsize`, `${config.videoBitrate * 2}k`,
                    // Audio settings
                    `-b:a`, `${config.audioBitrate}k`,
                    // Web optimization - move moov atom to start for fast streaming
                    `-movflags`, `+faststart`,
                    // Limit to reasonable duration for previews (if source is very long)
                    `-t`, `60`,
                ])
                .output(outputPath)
                .on("error", (err: Error) =>
                    settle(() => {
                        console.error(`${logger} ffmpeg error:`, err.message)
                        command.kill("SIGKILL")
                        reject(err)
                    })
                )
                .on("end", () => settle(() => resolve()))

            command.run()
        })
        console.log(`${logger} [PERF] ffmpeg processing took ${(performance.now() - ffmpegStart).toFixed(1)}ms`)

        // Read output file
        const readStart = performance.now()
        const previewBuffer = await readFile(outputPath)
        console.log(`${logger} [PERF] readFile took ${(performance.now() - readStart).toFixed(1)}ms`)

        const totalTime = performance.now() - startTime
        const compressionRatio = ((videoBuffer.length - previewBuffer.length) / videoBuffer.length) * 100
        
        console.log(`${logger} [PERF] TOTAL generateVideoPreview took ${totalTime.toFixed(1)}ms`)
        console.log(`${logger} Preview generated: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB → ${(previewBuffer.length / 1024 / 1024).toFixed(2)}MB (${compressionRatio.toFixed(1)}% reduction)`)

        return {
            buffer: previewBuffer,
            compressionRatio,
            // Dimensions are approximate - ffmpeg handles the scaling
            width: 1280, // Max width at 720p 16:9
            height: Math.min(config.maxHeight, 720),
        }

    } catch (error) {
        console.error(`${logger} Failed to generate video preview:`, error)
        return null
    } finally {
        // Cleanup temp files
        const cleanupStart = performance.now()
        await Promise.all([
            unlink(inputPath).catch(() => { /* ignore cleanup errors */ }),
            unlink(outputPath).catch(() => { /* ignore cleanup errors */ }),
        ])
        console.log(`${logger} [PERF] cleanup took ${(performance.now() - cleanupStart).toFixed(1)}ms`)
    }
}

/**
 * Generate a mobile-optimized preview (smaller file size)
 * 
 * @param videoBuffer - Original video data as a Buffer
 * @returns Preview result with buffer and metadata, or null if generation fails
 */
export function generateMobileVideoPreview(
    videoBuffer: Buffer
): Promise<VideoPreviewResult | null> {
    return generateVideoPreview(videoBuffer, MOBILE_PREVIEW_CONFIG)
}

/**
 * Determine if a video should have a preview generated
 * 
 * Only generate previews for videos above a certain size threshold,
 * as smaller videos don't benefit much from compression.
 * 
 * @param sizeBytes - Size of the original video in bytes
 * @returns Whether a preview should be generated
 */
export function shouldGeneratePreview(sizeBytes: number): boolean {
    // Only generate previews for videos > 5MB
    const threshold = 5 * 1024 * 1024
    return sizeBytes > threshold
}
