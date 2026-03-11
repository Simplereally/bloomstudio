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
import { writeFile, readFile, unlink, mkdir, chmod } from "fs/promises"
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
            const ffmpegStatic = (await import("ffmpeg-static")).default

            
            const ffmpegModule = await import("fluent-ffmpeg")


            if (!ffmpegStatic) {
                throw new Error("ffmpeg-static binary not found")
            }

            await chmod(ffmpegStatic, 0o755).catch(() => undefined)
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


    // Create temp directory and files
    const tempDir = join(tmpdir(), "bloomstudio-previews")
    await mkdir(tempDir, { recursive: true })
    
    const inputPath = join(tempDir, `input-${randomUUID()}.mp4`)
    const outputPath = join(tempDir, `output-${randomUUID()}.mp4`)

    try {
        const ffmpeg = await getFfmpeg()

        // Write video to temp file
        await writeFile(inputPath, videoBuffer)


        // Generate preview

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


        // Read output file
        const previewBuffer = await readFile(outputPath)


        const compressionRatio = ((videoBuffer.length - previewBuffer.length) / videoBuffer.length) * 100
        

        console.log(`${logger} Preview generated: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB → ${(previewBuffer.length / 1024 / 1024).toFixed(2)}MB (${compressionRatio.toFixed(1)}% reduction)`)

        return {
            buffer: previewBuffer,
            compressionRatio,
        }

    } catch (error) {
        console.error(`${logger} Failed to generate video preview:`, error)
        return null
    } finally {
        // Cleanup temp files
        await Promise.all([
            unlink(inputPath).catch(() => { /* ignore cleanup errors */ }),
            unlink(outputPath).catch(() => { /* ignore cleanup errors */ }),
        ])

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
