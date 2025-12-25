# Story: API Routes for Image Upload & Storage

> **Epic:** Image Persistence & Storage  
> **Priority:** High  
> **Status:** Completed  
> **Phase:** 3 of 5

## Overview

Create API routes to handle image uploads (reference images) and modify the existing generation route to persist AI-generated images to R2 storage.

## Background

With the storage layer in place (Phase 2), we need API endpoints that:
1. Accept reference image uploads from users
2. Automatically persist generated images to R2 after generation
3. Return permanent R2 URLs instead of ephemeral base64/Pollinations URLs

---

## Acceptance Criteria

### 1. Reference Image Upload Route
- [x] Create `app/api/upload/route.ts`
- [x] Accept multipart/form-data with file upload
- [x] Validate file type (JPEG, PNG, WebP, GIF only)
- [x] Validate file size (max 10MB)
- [x] Require authentication via Clerk
- [x] Upload to R2 in `reference/{userId}/` path
- [x] Return upload result with URL and metadata

### 2. Modify Generation Route
- [x] Update `app/api/generate/route.ts`
- [x] After receiving image from Pollinations, upload to R2
- [x] Store with key format: `generated/{userId}/{timestamp}-{id}.{ext}`
- [x] Return permanent R2 URL instead of base64
- [x] Include r2Key in response for client-side Convex storage

### 3. Image Deletion Route (Optional)
- [ ] Create `app/api/images/[id]/route.ts` for DELETE requests
- [ ] Verify ownership before deletion
- [ ] Delete from R2 and return success

---

## Implementation

### Reference Upload Route (`app/api/upload/route.ts`)

```typescript
/**
 * POST /api/upload
 * 
 * Handles user-uploaded reference images for image-to-image generation.
 */

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { uploadImage, generateImageKey } from "@/lib/storage"

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

### Generation Route Modifications (`app/api/generate/route.ts`)

Add the following after receiving the image from Pollinations:

```typescript
// Add to imports
import { uploadImage, generateImageKey } from "@/lib/storage"

// After receiving image from Pollinations (around line 86):

// Get content type and image data
const contentType = response.headers.get("content-type") || "image/jpeg"
const imageBuffer = Buffer.from(await response.arrayBuffer())

// Get user ID from Clerk session
const { userId } = await auth()
if (!userId) {
    return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
    )
}

// Generate unique R2 key and upload
const r2Key = generateImageKey(userId, "generated", contentType)

const uploadResult = await uploadImage({
    data: imageBuffer,
    contentType,
    key: r2Key,
})

// Build response with R2 URL instead of base64
const generatedImage = GeneratedImageSchema.parse({
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    url: uploadResult.url,  // Now using permanent R2 URL
    prompt: validatedParams.prompt,
    params: validatedParams,
    timestamp: Date.now(),
    // Include r2Key so client can store in Convex
    r2Key: uploadResult.key,
    sizeBytes: uploadResult.sizeBytes,
    contentType,
})
```

### Response Schema Update

Update the `GeneratedImageSchema` to include new fields:

```typescript
// In lib/schemas or relevant location
export const GeneratedImageSchema = z.object({
    id: z.string(),
    url: z.string().url(),
    prompt: z.string(),
    params: z.record(z.any()),
    timestamp: z.number(),
    // New fields for storage
    r2Key: z.string().optional(),
    sizeBytes: z.number().optional(),
    contentType: z.string().optional(),
})
```

---

## API Response Examples

### Successful Upload
```json
{
    "success": true,
    "data": {
        "url": "https://pub-xxxxx.r2.dev/reference/user_123/1703520000000-abc123.png",
        "r2Key": "reference/user_123/1703520000000-abc123.png",
        "contentType": "image/png",
        "sizeBytes": 245678
    }
}
```

### Upload Errors
```json
{
    "success": false,
    "error": {
        "code": "FILE_TOO_LARGE",
        "message": "File too large. Maximum size: 10MB"
    }
}
```

---

## Testing Checklist

- [ ] Upload valid JPEG → verify returns R2 URL
- [ ] Upload valid PNG → verify correct contentType
- [ ] Upload 15MB file → verify rejected with FILE_TOO_LARGE
- [ ] Upload .exe file → verify rejected with INVALID_TYPE
- [ ] Upload without auth → verify 401 UNAUTHORIZED
- [ ] Generate image → verify stored in R2 with permanent URL
- [ ] Verify R2 URLs are accessible without authentication

---

## Related Documents

- [Image Storage Implementation Plan](./image-storage-implementation.md)
- [Phase 2: Core Storage](./02-image-storage-core.md)
