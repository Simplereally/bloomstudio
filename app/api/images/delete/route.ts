/**
 * POST /api/images/delete
 *
 * Deletes an image from Cloudflare R2.
 * Validates that the image belongs to the authenticated user.
 */

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { deleteImage } from "@/lib/storage"
import crypto from "crypto"

interface DeleteResponse {
    success: true
}

interface DeleteError {
    success: false
    error: {
        code: string
        message: string
    }
}

/**
 * Hash a userId the same way it's hashed when generating R2 keys.
 * This ensures authorization checks match the stored key format.
 */
function hashUserId(userId: string): string {
    return crypto.createHash("sha256").update(userId).digest("hex")
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<DeleteResponse | DeleteError>> {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
                { status: 401 }
            )
        }

        const { r2Key } = await request.json()

        if (!r2Key || typeof r2Key !== "string") {
            return NextResponse.json(
                { success: false, error: { code: "MISSING_KEY", message: "Missing r2Key" } },
                { status: 400 }
            )
        }

        /**
         * Security check: Ensure the key contains the user's hashed ID to prevent
         * deleting other users' images.
         * R2 keys are formatted as: {type}/{userHash}/{filename}
         * where userHash is SHA256(userId)
         */
        const userHash = hashUserId(userId)
        if (!r2Key.includes(`/${userHash}/`)) {
            console.warn(`[/api/images/delete] Unauthorized deletion attempt: User ${userId} tried to delete ${r2Key}`)
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Not authorized to delete this image" } },
                { status: 403 }
            )
        }

        await deleteImage(r2Key)

        console.log(`[/api/images/delete] Deleted R2 object: ${r2Key}`)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[/api/images/delete] Error:", error)
        return NextResponse.json(
            { success: false, error: { code: "DELETE_FAILED", message: "Failed to delete image from storage" } },
            { status: 500 }
        )
    }
}
