Below is a concrete “how I’d implement it” summary for **Cloudflare R2 (images) + Convex (metadata + logic) + Clerk (auth)**, with **per-image public/private**.

---

## 1) High-level architecture

* **R2 stores image bytes** (originals + any derived sizes)
* **Convex stores metadata** (owner, prompt, size, R2 key, visibility, timestamps)
* **Clerk authenticates users**; Convex functions read the user identity from the Clerk-backed JWT integration ([docs.convex.dev][1])
* Clients upload/download via **presigned URLs** (direct browser ↔ R2, no proxying through your app server) ([Cloudflare Docs][2])

---

## 2) Key decision for public vs private in R2

R2’s S3-compatible API **does not implement ACL headers** like `x-amz-acl` on `PutObject`, so you can’t make *individual objects* public/private the way many S3 tutorials imply ([Cloudflare Docs][3]).

**Practical approach (simple + scales):**

* Use **two buckets**:

  * `app-images-public` (exposed via a custom domain)
  * `app-images-private` (no public access)
* When a user toggles visibility, **copy the object** between buckets (CopyObject is implemented) and delete the old copy ([Cloudflare Docs][3]).

This keeps:

* public images: cacheable CDN URLs
* private images: only accessible via short-lived presigned GET URLs

---

## 3) Cloudflare setup (R2)

### Buckets + public domain

1. Create two R2 buckets (public/private).
2. For the **public bucket**, expose it behind a **custom domain** (recommended vs `r2.dev`, because custom-domain access lets you use Cloudflare controls like caching/WAF) ([Cloudflare Docs][4])

### CORS (for browser uploads)

If the browser will PUT directly to R2 using presigned URLs, configure bucket CORS in the Cloudflare dashboard (Settings → CORS Policy) ([Cloudflare Docs][5]).

### S3 endpoint + credentials for Convex

Convex will talk to R2 using the S3 compatibility endpoint:

* `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` ([Cloudflare Docs][3])

You’ll create an R2 access key/secret for server-side signing (stored as Convex env vars).

---

## 4) Convex + Clerk auth wiring

### Client provider

Use Convex’s Clerk provider (`<ConvexProviderWithClerk>`)—in Next App Router you typically wrap it in a Client Component because your `layout.tsx` is a Server Component ([docs.convex.dev][1]).

### Convex functions auth check

Inside Convex queries/mutations/actions:

* call `ctx.auth.getUserIdentity()` to get the authenticated identity ([docs.convex.dev][6])
* use `tokenIdentifier` or `subject` as your stable user identifier (Convex docs discuss both) ([docs.convex.dev][7])

Clerk’s “Integrate Convex” guide walks through the JWT template setup on the Clerk side ([Clerk][8]).

---

## 5) Data model (Convex)

Create an `images` table (example fields):

* `ownerId` (Clerk user identifier: `tokenIdentifier` or `subject`)
* `visibility`: `"public" | "private"`
* `bucket`: `"public" | "private"` (or store bucket name)
* `key`: `users/<ownerId>/<imageId>/original.webp`
* `contentType`, `width`, `height`, `sizeBytes`
* `prompt`, `model`, `seed`, etc.
* `createdAt`
* optional: `status`: `"reserved" | "uploaded" | "failed"` (helps with upload finalization)

Indexes you’ll want:

* by `ownerId, createdAt`
* by `visibility, createdAt` (for a public gallery feed)

---

## 6) Convex functions you’ll implement

Convex **Actions** are the right place to call third-party services / SDKs ([docs.convex.dev][9]).

### A) `images.createUpload` (Action)

Purpose: authenticate, reserve an image record, return presigned PUT URL.

Flow:

1. `identity = await ctx.auth.getUserIdentity()` (must exist) ([docs.convex.dev][6])
2. Create a new `images` doc with `status="reserved"` and desired `visibility`
3. Compute `key`
4. Generate **presigned PutObject URL** (expires quickly, e.g. 60–300s) ([Cloudflare Docs][2])
5. Return `{ imageId, key, uploadUrl }`

R2 supports `PutObject` and common metadata headers like `Content-Type` / `Cache-Control` ([Cloudflare Docs][3]), so you can set:

* public: `Cache-Control: public, max-age=31536000, immutable`
* private: `Cache-Control: private, no-store`

### B) `images.finalizeUpload` (Mutation)

Purpose: mark the record “uploaded” after the client PUT succeeds.

* Validate ownership again via `ctx.auth.getUserIdentity()`
* Update `status="uploaded"`, store `sizeBytes`, maybe store an `etag` if you want

### C) `images.getImageUrl` (Query or Action)

Purpose: return the best URL for rendering in the UI.

* If `visibility === "public"`:

  * return the **public custom domain URL** (fast + cacheable)
* Else:

  * verify owner
  * return **presigned GetObject URL** (short TTL) ([Cloudflare Docs][2])

### D) `images.setVisibility` (Action)

Purpose: toggle public/private.

Algorithm:

1. Auth + verify owner
2. If changing visibility:

   * `CopyObject` from source bucket → destination bucket (same key) ([Cloudflare Docs][3])
   * `DeleteObject` from source bucket ([Cloudflare Docs][3])
   * update DB fields (`visibility`, `bucket`)
3. Return updated image

This is the cleanest “bucket-level access” workaround given ACL limitations ([Cloudflare Docs][3]).

---

## 7) Frontend wiring (Next.js + TanStack Query)

Even if you keep TanStack Query:

* Use a query like `useQuery(['imageUrl', imageId], () => convexQueryOrAction(imageId))`
* For private images, set a short `staleTime` and refetch if the URL expires (or refetch on `<img onError>`).

Upload UI:

1. call `createUpload` → get `uploadUrl`
2. `fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })`
3. call `finalizeUpload(imageId)`

---

## 8) Hosting notes: Vercel now, Cloudflare later

### Keep Next.js on Vercel (totally fine)

This setup works unchanged: the browser talks to R2 directly via presigned URLs, and public images are served from your Cloudflare image domain.

### If you move to Cloudflare Pages/Workers

You *can* (optionally) improve private delivery by serving private images through a Worker/Pages Function with an **R2 binding**:

* bindings let Workers/Pages access R2 without embedding access keys in code ([Cloudflare Docs][10])
* the Worker can expose routes that read/write R2 objects ([Cloudflare Docs][11])

But: since you’re already using Convex, you don’t *need* to move image delivery to Workers immediately—presigned GETs from Convex are the straightforward baseline.

(One gotcha if you do build local tooling around the S3-compatible API: Cloudflare notes limitations when developing locally with `wrangler dev` for S3 compatibility. ([Cloudflare Docs][12]))

---

## 9) Environment variables (Convex)

Store these in Convex deployment env vars (Dashboard → Deployment Settings). Convex exposes them via `process.env` ([docs.convex.dev][13]):

* `R2_ACCOUNT_ID`
* `R2_ACCESS_KEY_ID`
* `R2_SECRET_ACCESS_KEY`
* `R2_PUBLIC_BUCKET`
* `R2_PRIVATE_BUCKET`
* `R2_PUBLIC_BASE_URL` (e.g. `https://img.yourapp.com`)
* `R2_ENDPOINT` = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` ([Cloudflare Docs][3])

---

If you want, I can turn this into a concrete “function list + TypeScript skeleton” for:

* Convex `schema.ts` for `images`
* `actions/images.ts` (presigned PUT/GET + copy/delete)
* `mutations/images.ts` (finalize, toggle)
* Next.js client hooks using TanStack Query with Clerk session state

[1]: https://docs.convex.dev/auth/clerk?utm_source=chatgpt.com "Convex & Clerk | Convex Developer Hub"
[2]: https://developers.cloudflare.com/r2/api/s3/presigned-urls/?utm_source=chatgpt.com "Presigned URLs · Cloudflare R2 docs"
[3]: https://developers.cloudflare.com/r2/api/s3/api/ "S3 API compatibility · Cloudflare R2 docs"
[4]: https://developers.cloudflare.com/r2/buckets/public-buckets/?utm_source=chatgpt.com "Public buckets · Cloudflare R2 docs"
[5]: https://developers.cloudflare.com/r2/buckets/cors/?utm_source=chatgpt.com "Configure CORS · Cloudflare R2 docs"
[6]: https://docs.convex.dev/auth/functions-auth?utm_source=chatgpt.com "Auth in Functions | Convex Developer Hub"
[7]: https://docs.convex.dev/auth/database-auth?utm_source=chatgpt.com "Storing Users in the Convex Database | Convex Developer Hub"
[8]: https://clerk.com/docs/guides/development/integrations/databases/convex?utm_source=chatgpt.com "Development: Integrate Convex with Clerk"
[9]: https://docs.convex.dev/functions/actions?utm_source=chatgpt.com "Actions | Convex Developer Hub"
[10]: https://developers.cloudflare.com/workers/runtime-apis/bindings/?utm_source=chatgpt.com "Bindings (env) · Cloudflare Workers docs"
[11]: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/?utm_source=chatgpt.com "Workers API reference · Cloudflare R2 docs"
[12]: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/?utm_source=chatgpt.com "aws-sdk-js-v3 · Cloudflare R2 docs"
[13]: https://docs.convex.dev/production/environment-variables?utm_source=chatgpt.com "Environment Variables | Convex Developer Hub"
