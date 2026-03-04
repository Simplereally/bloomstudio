/**
 * POST /api/music/upload
 *
 * Uploads generated audio blobs to Cloudflare R2 for persistent storage.
 * Returns the public URL and R2 key for the uploaded audio file.
 */

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/storage"
import crypto from "crypto"

const MAX_AUDIO_SIZE = 50 * 1024 * 1024 // 50MB (music files can be large)
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"]

interface AudioUploadResponse {
    success: true
    data: {
        url: string
        r2Key: string
        contentType: string
        sizeBytes: number
    }
}

interface AudioUploadError {
    success: false
    error: {
        code: string
        message: string
    }
}

/**
 * Generates a unique R2 object key for an audio file.
 * Format: music/{userHash}/{timestamp}-{randomId}.mp3
 */
function generateAudioKey(userId: string, contentType: string): string {
    const ext = contentType === "audio/mpeg" || contentType === "audio/mp3"
        ? "mp3"
        : contentType.split("/")[1] || "mp3"
    const timestamp = Date.now()
    const randomId = crypto.randomUUID()
    const userHash = crypto.createHash("sha256").update(userId).digest("hex").slice(0, 12)

    return `music/${userHash}/${timestamp}-${randomId}.${ext}`
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<AudioUploadResponse | AudioUploadError>> {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get("file")

        if (!(file instanceof File)) {
            return NextResponse.json(
                { success: false, error: { code: "NO_FILE", message: "No audio file provided" } },
                { status: 400 }
            )
        }

        // Validate file type
        if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INVALID_TYPE",
                        message: `Invalid audio type. Allowed: ${ALLOWED_AUDIO_TYPES.join(", ")}`,
                    },
                },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_AUDIO_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "FILE_TOO_LARGE",
                        message: `File too large. Maximum size: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
                    },
                },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Generate key and upload
        const r2Key = generateAudioKey(userId, file.type)
        const result = await uploadFile({
            data: buffer,
            contentType: file.type,
            key: r2Key,
        })

        return NextResponse.json({
            success: true,
            data: {
                url: result.url,
                r2Key: result.key,
                contentType: file.type,
                sizeBytes: result.sizeBytes,
            },
        })
    } catch (error) {
        console.error("[/api/music/upload] Error:", error)
        return NextResponse.json(
            { success: false, error: { code: "UPLOAD_FAILED", message: "Failed to upload audio" } },
            { status: 500 }
        )
    }
}
