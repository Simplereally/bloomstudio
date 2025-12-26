# Story: Core Storage Layer & Database Schema

> **Epic:** Image Persistence & Storage  
> **Priority:** High  
> **Status:** Completed  
> **Phase:** 2 of 5

## Overview

Implement the R2 client utility module and Convex database schema for storing image metadata. This phase establishes the core storage layer that all subsequent features will build upon.

## Background

With the R2 bucket configured (Phase 1), we now need:
1. An R2 client for uploading/deleting images
2. Convex tables for storing image metadata (separate tables for generated and reference images)

---

## Acceptance Criteria

### 1. R2 Client Module
- [x] Create `lib/storage/r2-client.ts` with:
  - `uploadImage(options)` — Upload image buffer to R2
  - `deleteImage(key)` — Remove image from R2
  - `imageExists(key)` — Check if image exists
  - `generateImageKey(userId, type, contentType)` — Generate unique object keys
  - `getPublicUrl(key)` — Construct public URL from key
- [x] Lazy initialization to avoid build-time errors
- [x] Proper error handling and environment validation

### 2. Convex Schema — Generated Images Table
- [x] Create `generatedImages` table with fields:
  - `ownerId` (string) — Clerk user ID
  - `visibility` (public | unlisted) — Feed visibility
  - `r2Key` (string) — R2 object path
  - `url` (string) — Public URL
  - `filename` (string) — Generated identifier
  - `contentType` (string) — MIME type
  - `sizeBytes` (number) — File size
  - `width` / `height` (optional numbers) — Dimensions
  - `prompt` (string) — Generation prompt
  - `negativePrompt` (optional string)
  - `model` (string) — Model used
  - `seed` (optional number)
  - `generationParams` (any) — Full params for reproducibility
  - `createdAt` (number) — Timestamp
- [x] Add indexes:
  - `by_owner` — User's image history
  - `by_visibility` — Public feed queries
  - `by_r2_key` — Deduplication lookups

### 3. Convex Schema — Reference Images Table
- [x] Create `referenceImages` table with fields:
  - `ownerId` (string) — Clerk user ID
  - `r2Key` (string) — R2 object path
  - `url` (string) — Public URL
  - `filename` (string) — Original filename
  - `contentType` (string) — MIME type
  - `sizeBytes` (number) — File size
  - `width` / `height` (optional numbers) — Dimensions
  - `createdAt` (number) — Timestamp
- [x] Add indexes:
  - `by_owner` — User's reference images
  - `by_r2_key` — Deduplication lookups
- [x] **Note:** Reference images have NO visibility field (always private/unlisted by design)

### 4. Convex Functions — Generated Images
- [x] Create `convex/generatedImages.ts` with:
  - `create` mutation — Add new generated image
  - `getById` query — Get single image
  - `getMyImages` query — User's history (paginated)
  - `getPublicFeed` query — Public images for feed
  - `setVisibility` mutation — Toggle public/unlisted
  - `remove` mutation — Delete image metadata (returns r2Key)

### 5. Convex Functions — Reference Images
- [x] Create `convex/referenceImages.ts` with:
  - `create` mutation — Add new reference image
  - `getById` query — Get single image
  - `getMyImages` query — User's reference images
  - `remove` mutation — Delete reference image

### 6. Module Exports
- [x] Create `lib/storage/index.ts` to export R2 client functions

---

## Implementation

### R2 Client (`lib/storage/r2-client.ts`)

```typescript
/**
 * Cloudflare R2 Storage Client
 * 
 * S3-compatible client for uploading and managing images in R2.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"

// Validate required environment variables
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
 * Generate a unique object key for an image
 * 
 * Format: {type}/{userId}/{timestamp}-{randomId}.{ext}
 */
export function generateImageKey(
    userId: string,
    type: "generated" | "reference",
    contentType: string
): string {
    const ext = contentType.split("/")[1] || "jpg"
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    
    return `${type}/${userId}/${timestamp}-${randomId}.${ext}`
}

/**
 * Get the public URL for an R2 object key
 */
export function getPublicUrl(key: string): string {
    return `${PUBLIC_URL()}/${key}`
}
```

### Convex Schema (`convex/schema.ts`)

```typescript
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        pollinationsApiKey: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"]),

    /**
     * Generated images - AI-created images from the studio
     */
    generatedImages: defineTable({
        /** Clerk user ID who owns this image */
        ownerId: v.string(),
        
        /** Visibility: 'public' (in feed) or 'unlisted' (URL-only access) */
        visibility: v.union(v.literal("public"), v.literal("unlisted")),
        
        /** R2 object key (path within bucket) */
        r2Key: v.string(),
        
        /** Full public URL to the image */
        url: v.string(),
        
        /** Generated identifier */
        filename: v.string(),
        
        /** MIME type (image/jpeg, image/png, image/webp) */
        contentType: v.string(),
        
        /** File size in bytes */
        sizeBytes: v.number(),
        
        /** Image dimensions */
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        
        /** The prompt used to generate the image */
        prompt: v.string(),
        
        /** Negative prompt if used */
        negativePrompt: v.optional(v.string()),
        
        /** Model used for generation */
        model: v.string(),
        
        /** Seed used for generation (-1 if random) */
        seed: v.optional(v.number()),
        
        /** Full generation parameters for reproducibility */
        generationParams: v.optional(v.any()),
        
        /** Timestamp of creation */
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_visibility", ["visibility", "createdAt"])
        .index("by_r2_key", ["r2Key"]),

    /**
     * Reference images - user uploads for image-to-image generation
     */
    referenceImages: defineTable({
        /** Clerk user ID who owns this image */
        ownerId: v.string(),
        
        /** R2 object key (path within bucket) */
        r2Key: v.string(),
        
        /** Full public URL to the image */
        url: v.string(),
        
        /** Original filename */
        filename: v.string(),
        
        /** MIME type (image/jpeg, image/png, image/webp) */
        contentType: v.string(),
        
        /** File size in bytes */
        sizeBytes: v.number(),
        
        /** Image dimensions */
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        
        /** Timestamp of creation */
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_r2_key", ["r2Key"]),
})
```

### Schema Design Notes

| Table | Purpose | Visibility |
|-------|---------|------------|
| `generatedImages` | AI-created images from studio | Public or Unlisted (user choice) |
| `referenceImages` | User uploads for img2img | Always private (no visibility field) |

**Benefits of separate tables:**
- Cleaner queries — no `type` filtering needed
- Type-safe schemas — each table has only relevant fields
- Different access patterns — generated images have feeds, references don't
- Simpler authorization — reference images never need public access checks

---

## Testing Checklist

- [x] Run `npx convex dev` — verify schema deploys without errors
- [ ] Test `uploadImage()` with a sample buffer
- [ ] Test `deleteImage()` removes object from R2
- [ ] Test `generateImageKey()` produces valid unique keys
- [ ] Verify Convex functions have proper auth checks

---

## Related Documents

- [Image Storage Implementation Plan](./image-storage-implementation.md)
- [Phase 1: Infrastructure Setup](./01-image-storage-infrastructure.md)
