# Story: Image Storage Infrastructure Setup

> **Epic:** Image Persistence & Storage  
> **Priority:** High  
> **Status:** Completed  
> **Phase:** 1 of 5

## Overview

Set up the foundational infrastructure for persisting AI-generated images and user-uploaded reference images using Cloudflare R2 for object storage.

## Background

Currently, Pixelstream generates images via the Pollinations API but doesn't persist them. Users lose their creations when they leave the page. This phase establishes the R2 bucket and environment configuration needed for permanent storage.

---

## Acceptance Criteria

### 1. R2 Bucket Creation
- [x] Create R2 bucket named `pixelstream-images` in Cloudflare Dashboard
- [x] Enable public access via R2.dev subdomain or custom domain
- [x] Select appropriate location (Auto or based on user base)

### 2. CORS Configuration
- [x] Configure CORS to allow uploads from development and production domains:
  - `http://localhost:3000`
  - `https://v0-image-generation-app-peach.vercel.app`
  - `https://pixelstream.app`
  - `https://*.pixelstream.app`
- [x] Allow methods: `GET`, `PUT`, `POST`, `HEAD`
- [x] Allow headers: `Content-Type`, `Content-Length`, `x-amz-*`

### 3. API Credentials
- [x] Create R2 API token with Object Read & Write permissions
- [x] Store credentials securely (not in version control)

### 4. Environment Variables
- [x] Add to `.env.local`:
  ```bash
  R2_ACCOUNT_ID=your_account_id
  R2_ACCESS_KEY_ID=your_access_key_id
  R2_SECRET_ACCESS_KEY=your_secret_access_key
  R2_BUCKET_NAME=pixelstream-images
  R2_PUBLIC_URL=https://pub-26b39ecf46a949a3ad2ca8830b2c6fee.r2.dev
  R2_ENDPOINT=https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
  ```
- [x] Add same variables to Vercel environment (Production & Preview)
- [x] Verify variables are NOT prefixed with `NEXT_PUBLIC_` (they contain secrets)

### 5. Dependencies
- [x] Install AWS S3 SDK packages:
  ```bash
  bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
  ```

---

## Implementation

### CORS Configuration JSON

Apply this in Cloudflare R2 Dashboard → Bucket Settings → CORS:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://v0-image-generation-app-peach.vercel.app",
      "https://pixelstream.app",
      "https://*.pixelstream.app"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Testing Checklist

- [ ] Verify bucket is accessible via public URL
- [ ] Verify CORS allows requests from localhost:3000
- [ ] Verify environment variables are loaded in development
- [ ] Verify environment variables are set in Vercel

---

## Notes

- **No code changes** in this phase — purely infrastructure setup
- This must be completed before Phase 2 can begin
- Keep R2 credentials secure; rotate if ever exposed

---

## Related Documents

- [Image Storage Implementation Plan](./image-storage-implementation.md)
