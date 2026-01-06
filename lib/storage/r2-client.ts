/**
 * Cloudflare R2 Storage Client
 *
 * S3-compatible client for uploading and managing images in R2.
 */

import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { withRetry, isRetryableError } from "./retry"
import crypto from "crypto"

/**
 * Retrieve a required environment variable by name.
 *
 * @param name - The environment variable key to read from process.env
 * @returns The value of the environment variable
 * @throws Error if the environment variable is not set or is empty
 */
function getEnvVar(name: string): string {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`)
    }
    return value
}

// Lazy initialization to avoid errors during build
let _client: S3Client | null = null

function getClient(): S3Client {
    if (!_client) {
        _client = new S3Client({
            region: "auto",
            endpoint: `https://${getEnvVar("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: getEnvVar("R2_ACCESS_KEY_ID"),
                secretAccessKey: getEnvVar("R2_SECRET_ACCESS_KEY"),
            },
        })
    }
    return _client
}

const BUCKET_NAME = () => getEnvVar("R2_BUCKET_NAME")
const PUBLIC_URL = () => getEnvVar("R2_PUBLIC_URL")

export interface UploadImageOptions {
    /** The image data as a Buffer */
    data: Buffer
    /** MIME type (e.g., 'image/jpeg') */
    contentType: string
    /** Object key (path) in the bucket */
    key: string
    /** Optional cache control header */
    cacheControl?: string
}

export interface UploadResult {
    /** The R2 object key */
    key: string
    /** The public URL to access the image */
    url: string
    /** Size in bytes */
    sizeBytes: number
}

/**
 * Upload an image to R2
 */
export async function uploadImage(options: UploadImageOptions): Promise<UploadResult> {
    return withRetry(
        async () => {
            const { data, contentType, key, cacheControl = "public, max-age=31536000, immutable" } = options

            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME(),
                Key: key,
                Body: data,
                ContentType: contentType,
                CacheControl: cacheControl,
            })

            await getClient().send(command)

            return {
                key,
                url: `${PUBLIC_URL()}/${key}`,
                sizeBytes: data.length,
            }
        },
        {
            maxAttempts: 3,
            shouldRetry: isRetryableError,
        }
    )
}

/**
 * Delete an image from R2
 */
export async function deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME(),
        Key: key,
    })

    await getClient().send(command)
}

/**
 * Check if an image exists in R2
 */
export async function imageExists(key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME(),
            Key: key,
        })
        await getClient().send(command)
        return true
    } catch {
        return false
    }
}

/**
 * Generate a unique storage key for an image.
 *
 * The key is formatted as `{type}/{userHash}/{timestamp}-{randomId}.{ext}` where `userHash`
 * is the SHA-256 hash of `userId`, `timestamp` is milliseconds since the Unix epoch,
 * `randomId` is a UUID, and `ext` is derived from `contentType` (defaults to `jpg` if absent).
 *
 * @param userId - The identifier for the user; its SHA-256 hash is used in the key
 * @param type - Top-level path segment, either `"generated"` or `"reference"`
 * @param contentType - MIME type used to derive the file extension (e.g., `"image/png"`)
 * @returns The generated object key string
 */
export function generateImageKey(
    userId: string,
    type: "generated" | "reference",
    contentType: string
): string {
    const ext = contentType.split("/")[1] || "jpg"
    const timestamp = Date.now()
    const randomId = crypto.randomUUID()
    const userHash = crypto.createHash("sha256").update(userId).digest("hex")

    return `${type}/${userHash}/${timestamp}-${randomId}.${ext}`
}

/**
 * Get the public URL for an R2 object key
 */
export function getPublicUrl(key: string): string {
    return `${PUBLIC_URL()}/${key}`
}

/**
 * Reset the client (useful for testing)
 * @internal
 */
export function _resetClient(): void {
    _client = null
}