/**
 * POST /api/upload
 *
 * Handles user-uploaded reference images for image-to-image generation.
 * Uploads files to Cloudflare R2 and returns permanent URLs.
 */

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { uploadImage, generateImageKey } from "@/lib/storage"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

/**
 * Succcesful upload response schema.
 */
interface UploadResponse {
    success: true
    data: {
        url: string
        r2Key: string
        contentType: string
        sizeBytes: number
    }
}

/**
 * Error response schema.
 */
interface UploadError {
    success: false
    error: {
        code: string
        message: string
    }
}

/**
 * Handles image upload requests.
 * Validates file type and size, then uploads to Cloudflare R2.
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<UploadResponse | UploadError>> {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json(
                { success: false, error: { code: "NO_FILE", message: "No file provided" } },
                { status: 400 }
            )
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INVALID_TYPE",
                        message: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
                    },
                },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "FILE_TOO_LARGE",
                        message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                    },
                },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Generate key and upload
        const r2Key = generateImageKey(userId, "reference", file.type)
        const result = await uploadImage({
            data: buffer,
            contentType: file.type,
            key: r2Key,
        })

        console.log(`[/api/upload] Uploaded reference image: ${r2Key}`)

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
        console.error("[/api/upload] Error:", error)
        return NextResponse.json(
            { success: false, error: { code: "UPLOAD_FAILED", message: "Failed to upload image" } },
            { status: 500 }
        )
    }
}
