/**
 * POST /api/images/delete-bulk
 *
 * Deletes multiple images from Cloudflare R2 in a single request.
 * Validates that all images belong to the authenticated user.
 * Uses S3's DeleteObjectsCommand for efficient batch deletion.
 */

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { deleteImages } from "@/lib/storage"
import crypto from "crypto"

interface DeleteBulkResponse {
    success: true
    deletedCount: number
    /** Keys that failed authorization (user doesn't own them) */
    unauthorized: string[]
}

interface DeleteBulkError {
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

/** Maximum keys per request to avoid hitting AWS/R2 limits (1000 max per DeleteObjects) */
const MAX_KEYS_PER_REQUEST = 500

export async function POST(
    request: NextRequest
): Promise<NextResponse<DeleteBulkResponse | DeleteBulkError>> {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
                { status: 401 }
            )
        }

        const { r2Keys } = await request.json()

        if (!r2Keys || !Array.isArray(r2Keys)) {
            return NextResponse.json(
                { success: false, error: { code: "INVALID_INPUT", message: "r2Keys must be an array" } },
                { status: 400 }
            )
        }

        if (r2Keys.length === 0) {
            return NextResponse.json({
                success: true,
                deletedCount: 0,
                unauthorized: [],
            })
        }

        if (r2Keys.length > MAX_KEYS_PER_REQUEST) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "TOO_MANY_KEYS",
                        message: `Maximum ${MAX_KEYS_PER_REQUEST} keys per request, received ${r2Keys.length}`,
                    },
                },
                { status: 400 }
            )
        }

        /**
         * Security check: Filter keys to only those belonging to this user.
         * R2 keys are formatted as: {type}/{userHash}/{filename}
         * where userHash is SHA256(userId)
         */
        const userHash = hashUserId(userId)
        const authorizedKeys: string[] = []
        const unauthorizedKeys: string[] = []

        for (const key of r2Keys) {
            if (typeof key !== "string") continue

            if (key.includes(`/${userHash}/`)) {
                authorizedKeys.push(key)
            } else {
                unauthorizedKeys.push(key)
                console.warn(`[/api/images/delete-bulk] Unauthorized key skipped: User ${userId} tried to delete ${key}`)
            }
        }

        // Delete all authorized keys in a single batch operation
        if (authorizedKeys.length > 0) {
            await deleteImages(authorizedKeys)
            console.log(`[/api/images/delete-bulk] Deleted ${authorizedKeys.length} R2 objects for user ${userId}`)
        }

        return NextResponse.json({
            success: true,
            deletedCount: authorizedKeys.length,
            unauthorized: unauthorizedKeys,
        })
    } catch (error) {
        console.error("[/api/images/delete-bulk] Error:", error)
        return NextResponse.json(
            { success: false, error: { code: "DELETE_FAILED", message: "Failed to delete images from storage" } },
            { status: 500 }
        )
    }
}
