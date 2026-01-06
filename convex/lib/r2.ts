"use node"

/**
 * Cloudflare R2 storage utilities
 * 
 * Provides functions for uploading images to R2 storage.
 * Requires R2 environment variables to be set in Convex.
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import crypto from "crypto"

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
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const bucketName = process.env.R2_BUCKET_NAME
    const publicUrl = process.env.R2_PUBLIC_URL

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
        throw new Error("R2 configuration incomplete. Check environment variables.")
    }

    const client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    })

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
