# Image Storage Implementation Plan

## Overview

This document outlines the implementation plan for persisting AI-generated images and user-uploaded reference images in Pixelstream using **Cloudflare R2** for object storage and **Convex** for metadata management.

## Key Design Decisions

### Visibility Model: Public vs Unlisted

Based on product requirements, we're implementing a **public/unlisted** model (not public/private):

| Visibility | In Public Feed | URL Shareable | Requires Auth |
|------------|----------------|---------------|---------------|
| **Public** | ✅ Yes | ✅ Yes | No |
| **Unlisted** | ❌ No | ✅ Yes | No |

**Impact:** Since both visibility states allow URL access, we only need **one public bucket**. Feed visibility is controlled purely by metadata in Convex.

### Architecture Simplification

The original investigation recommended two buckets with object copying for visibility changes. Given our visibility model:

- ✅ **Single bucket** (`pixelstream-images`) with public access
- ✅ **No presigned URLs needed** for viewing (all URLs are permanent public URLs)
- ✅ **Visibility toggle** = simple metadata update (no object copying)
- ✅ **CDN caching** works for all images

This is **significantly simpler** while meeting all product requirements.

---

## 1. Infrastructure Setup

### 1.1 Cloudflare R2 Bucket

Create one R2 bucket in Cloudflare Dashboard:

- **Name:** `pixelstream-images`
- **Public Access:** Enabled (via R2.dev subdomain or custom domain)
- **Location:** Auto (or choose based on user base)

#### CORS Configuration

Required for browser-based reference image uploads:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://pixelstream.app",
      "https://*.pixelstream.app"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-*"],
    "MaxAgeSeconds": 3600
  }
]
```

#### R2 API Credentials

Create an API token with Object Read & Write permissions. Store these securely.

### 1.2 Environment Variables

Add to `.env.local` and Vercel environment:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=pixelstream-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # or custom domain

# S3-compatible endpoint
R2_ENDPOINT=https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
```

---

## 2. Dependencies

### 2.1 Install AWS S3 SDK

R2 is S3-compatible, so we use the AWS SDK:

```bash
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## 3. Convex Schema Updates

### 3.1 Separate Tables for Generated and Reference Images

We use **two separate tables** instead of a single `images` table with a `type` field:

| Table | Purpose | Visibility Options |
|-------|---------|-------------------|
| `generatedImages` | AI-created images from studio | Public or Unlisted (user choice) |
| `referenceImages` | User uploads for img2img | Always private (no visibility field) |

**Benefits of separation:**
- **Cleaner queries** — no `type` filtering needed
- **Type-safe schemas** — each table has only relevant fields
- **Different access patterns** — generated images have feeds, references don't
- **Simpler authorization** — reference images never need public access checks

### 3.2 Update `convex/schema.ts`

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
        // User's image history
        .index("by_owner", ["ownerId", "createdAt"])
        // Public feed (only public images, sorted by date)
        .index("by_visibility", ["visibility", "createdAt"])
        // Lookup by R2 key (for deduplication)
        .index("by_r2_key", ["r2Key"]),

    /**
     * Reference images - user uploads for image-to-image generation
     * Note: No visibility field - these are always private to the owner
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
        // User's reference images
        .index("by_owner", ["ownerId", "createdAt"])
        // Lookup by R2 key (for deduplication)
        .index("by_r2_key", ["r2Key"]),
})
```

### 3.3 Schema Design Notes

- **`prompt` and `model`** are required for generated images (non-optional)
- **`generationParams`** uses `v.any()` to store the full request params flexibly
- **`seed`** stored separately for easy "make similar" features
- **Reference images** have no generation metadata — cleaner schema
- **Indexes** optimized for:
  - User history queries (both tables)
  - Public feed pagination (generated only)
  - R2 key lookups for deduplication

---

## 4. R2 Utility Module

### 4.1 Create `lib/storage/r2-client.ts`

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

### 4.2 Create `lib/storage/index.ts`

```typescript
export * from "./r2-client"
```

---

## 5. Convex Functions

### 5.1 Create `convex/generatedImages.ts`

```typescript
/**
 * Convex Generated Images Functions
 * 
 * Queries and mutations for AI-generated image metadata.
 */

import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { paginationOptsValidator } from "convex/server"

/**
 * Create a new generated image record
 */
export const create = mutation({
    args: {
        visibility: v.union(v.literal("public"), v.literal("unlisted")),
        r2Key: v.string(),
        url: v.string(),
        filename: v.string(),
        contentType: v.string(),
        sizeBytes: v.number(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        prompt: v.string(),
        negativePrompt: v.optional(v.string()),
        model: v.string(),
        seed: v.optional(v.number()),
        generationParams: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const imageId = await ctx.db.insert("generatedImages", {
            ownerId: identity.subject,
            visibility: args.visibility,
            r2Key: args.r2Key,
            url: args.url,
            filename: args.filename,
            contentType: args.contentType,
            sizeBytes: args.sizeBytes,
            width: args.width,
            height: args.height,
            prompt: args.prompt,
            negativePrompt: args.negativePrompt,
            model: args.model,
            seed: args.seed,
            generationParams: args.generationParams,
            createdAt: Date.now(),
        })

        return imageId
    },
})

/**
 * Get a single generated image by ID
 */
export const getById = query({
    args: { id: v.id("generatedImages") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id)
    },
})

/**
 * Get current user's generated images (for history page)
 */
export const getMyImages = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return { page: [], isDone: true, continueCursor: "" }
        }

        return await ctx.db
            .query("generatedImages")
            .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
            .order("desc")
            .paginate(args.paginationOpts)
    },
})

/**
 * Get public images for the feed
 */
export const getPublicFeed = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("generatedImages")
            .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
            .order("desc")
            .paginate(args.paginationOpts)
    },
})

/**
 * Toggle image visibility between public and unlisted
 */
export const setVisibility = mutation({
    args: {
        id: v.id("generatedImages"),
        visibility: v.union(v.literal("public"), v.literal("unlisted")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const image = await ctx.db.get(args.id)
        if (!image) {
            throw new Error("Image not found")
        }

        if (image.ownerId !== identity.subject) {
            throw new Error("Not authorized to modify this image")
        }

        await ctx.db.patch(args.id, {
            visibility: args.visibility,
        })

        return { success: true }
    },
})

/**
 * Delete a generated image (metadata only - R2 deletion handled by API route)
 */
export const remove = mutation({
    args: { id: v.id("generatedImages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const image = await ctx.db.get(args.id)
        if (!image) {
            throw new Error("Image not found")
        }

        if (image.ownerId !== identity.subject) {
            throw new Error("Not authorized to delete this image")
        }

        const r2Key = image.r2Key
        await ctx.db.delete(args.id)

        return { success: true, r2Key }
    },
})
```

### 5.2 Create `convex/referenceImages.ts`

```typescript
/**
 * Convex Reference Images Functions
 * 
 * Queries and mutations for user-uploaded reference images.
 */

import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Create a new reference image record
 */
export const create = mutation({
    args: {
        r2Key: v.string(),
        url: v.string(),
        filename: v.string(),
        contentType: v.string(),
        sizeBytes: v.number(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const imageId = await ctx.db.insert("referenceImages", {
            ownerId: identity.subject,
            r2Key: args.r2Key,
            url: args.url,
            filename: args.filename,
            contentType: args.contentType,
            sizeBytes: args.sizeBytes,
            width: args.width,
            height: args.height,
            createdAt: Date.now(),
        })

        return imageId
    },
})

/**
 * Get a single reference image by ID
 */
export const getById = query({
    args: { id: v.id("referenceImages") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id)
    },
})

/**
 * Get current user's reference images (for img2img picker)
 */
export const getMyImages = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }

        return await ctx.db
            .query("referenceImages")
            .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
            .order("desc")
            .take(50)
    },
})

/**
 * Delete a reference image (metadata only - R2 deletion handled by API route)
 */
export const remove = mutation({
    args: { id: v.id("referenceImages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const image = await ctx.db.get(args.id)
        if (!image) {
            throw new Error("Image not found")
        }

        if (image.ownerId !== identity.subject) {
            throw new Error("Not authorized to delete this image")
        }

        const r2Key = image.r2Key
        await ctx.db.delete(args.id)

        return { success: true, r2Key }
    },
})
```

---

## 6. Modify `/api/generate` Route

### 6.1 Update `app/api/generate/route.ts`

Key changes:
1. After receiving image from Pollinations, upload to R2
2. Store metadata in Convex via HTTP action
3. Return permanent R2 URL instead of base64

```typescript
// Add to imports
import { uploadImage, generateImageKey } from "@/lib/storage"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

// After receiving image from Pollinations (around line 86):

// Upload to R2
const contentType = response.headers.get("content-type") || "image/jpeg"
const imageBuffer = Buffer.from(await response.arrayBuffer())

// Get user ID from Clerk session
const { userId } = auth()
if (!userId) {
    return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
    )
}

// Generate unique R2 key
const r2Key = generateImageKey(userId, "generated", contentType)

// Upload to R2
const uploadResult = await uploadImage({
    data: imageBuffer,
    contentType,
    key: r2Key,
})

// Store metadata in Convex
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
// Note: For authenticated calls to Convex from server, we need to pass the auth token
// This requires additional setup - see implementation notes

// Build response with R2 URL
const generatedImage = GeneratedImageSchema.parse({
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    url: uploadResult.url,  // Now using R2 URL instead of base64
    prompt: validatedParams.prompt,
    params: validatedParams,
    timestamp: Date.now(),
})
```

### 6.2 Implementation Note: Server-Side Convex Auth

Calling authenticated Convex mutations from a Next.js API route requires passing the Clerk session token. Two approaches:

**Option A: Use Convex HTTP Actions (Recommended)**
Create a public HTTP action that accepts the Clerk token and validates internally.

**Option B: Return data to client, let client call Convex**
Return just the URL/key from the API route, then the client calls the Convex mutation.

We'll implement **Option B** initially as it's simpler and the client already handles the response.

---

## 7. New API Route: Reference Image Upload

### 7.1 Create `app/api/upload/route.ts`

```typescript
/**
 * POST /api/upload
 * 
 * Handles user-uploaded reference images for image-to-image generation.
 */

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { uploadImage, generateImageKey } from "@/lib/storage"

// Sensible defaults for reference image uploads
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

interface UploadResponse {
    success: true
    data: {
        url: string
        r2Key: string
        contentType: string
        sizeBytes: number
    }
}

interface UploadError {
    success: false
    error: {
        code: string
        message: string
    }
}

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
```

---

## 8. Frontend Integration

### 8.1 Update `useGenerateImage` Hook

Modify `hooks/queries/use-generate-image.ts` to store image metadata in Convex after successful generation:

```typescript
// In onSuccess callback:
onSuccess: (image, params) => {
    // Existing query invalidation...
    
    // Store in Convex (the hook caller should do this)
    // We'll add a separate effect or callback prop for this
    options.onSuccess?.(image, params)
}
```

### 8.2 New Hook: `useImageHistory`

Create `hooks/queries/use-image-history.ts`:

```typescript
"use client"

import { useQuery, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useImageHistory() {
    return usePaginatedQuery(
        api.generatedImages.getMyImages,
        {},
        { initialNumItems: 20 }
    )
}

export function usePublicFeed() {
    return usePaginatedQuery(
        api.generatedImages.getPublicFeed,
        {},
        { initialNumItems: 20 }
    )
}

export function useReferenceImages() {
    return useQuery(api.referenceImages.getMyImages)
}
```

### 8.3 New Hook: `useUploadReference`

Create `hooks/mutations/use-upload-reference.ts`:

```typescript
"use client"

import { useMutation as useConvexMutation } from "convex/react"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/convex/_generated/api"

interface UploadResult {
    url: string
    r2Key: string
    contentType: string
    sizeBytes: number
}

export function useUploadReference() {
    const createImage = useConvexMutation(api.referenceImages.create)

    return useMutation({
        mutationFn: async (file: File): Promise<UploadResult> => {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()
            if (!data.success) {
                throw new Error(data.error.message)
            }

            // Store metadata in Convex (no type or visibility needed)
            await createImage({
                r2Key: data.data.r2Key,
                url: data.data.url,
                filename: file.name,
                contentType: data.data.contentType,
                sizeBytes: data.data.sizeBytes,
            })

            return data.data
        },
    })
}
```

---

## 9. Implementation Order

### Phase 1: Infrastructure (Day 1)
1. [ ] Create R2 bucket in Cloudflare Dashboard
2. [ ] Configure CORS on the bucket
3. [ ] Create R2 API credentials
4. [ ] Add environment variables to `.env.local` and Vercel
5. [ ] Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`

### Phase 2: Core Storage (Day 1-2)
6. [ ] Create `lib/storage/r2-client.ts`
7. [ ] Update Convex schema with `generatedImages` and `referenceImages` tables
8. [ ] Run `npx convex dev` to deploy schema
9. [ ] Create `convex/generatedImages.ts` and `convex/referenceImages.ts` functions

### Phase 3: API Routes (Day 2)
10. [ ] Create `/api/upload/route.ts` for reference images
11. [ ] Modify `/api/generate/route.ts` to upload to R2
12. [ ] Update response to return R2 URL instead of base64

### Phase 4: Frontend (Day 2-3)
13. [ ] Create `useImageHistory` hook
14. [ ] Create `useUploadReference` hook  
15. [ ] Update `useGenerateImage` to store metadata
16. [ ] Build image history UI component
17. [ ] Add visibility toggle to image cards

### Phase 5: Polish (Day 3)
18. [ ] Add error handling and retry logic
19. [ ] Add loading states
20. [ ] Test end-to-end flow
21. [ ] Add image deletion flow

---

## 10. Testing Checklist

- [ ] Generate image → verify stored in R2 and Convex
- [ ] Upload reference image → verify stored in R2 and Convex
- [ ] View image history → verify pagination works
- [ ] Toggle visibility → verify feed updates
- [ ] Share public URL → verify accessible without auth
- [ ] Share unlisted URL → verify accessible without auth
- [ ] Delete image → verify removed from R2 and Convex
- [ ] Error handling → verify graceful failures

---

## 11. Future Enhancements

Not in scope for initial implementation, but planned:

- [ ] Image-to-image generation using reference images
- [ ] Batch operations (delete multiple, change visibility)
- [ ] Image search/filtering
- [ ] User profile pages with public galleries
- [ ] Image download tracking/analytics
- [ ] R2 lifecycle rules for orphaned objects cleanup
