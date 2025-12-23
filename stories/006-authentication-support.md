# Story 006: Add Authentication Support

## Overview
Implement API key authentication for gen.pollinations.ai supporting publishable (pk_) and secret (sk_) keys.

## Priority: Low
## Estimated Effort: 3 hours
## Dependencies: Story 002

---

## Environment Variables

```env
POLLINATIONS_SECRET_KEY=sk_your_secret_key
NEXT_PUBLIC_POLLINATIONS_KEY=pk_your_publishable_key
```

---

## Implementation

### 1. Auth Utilities

Create `lib/auth/pollinations-auth.ts`:
- Import `getApiKey` from `lib/config/api.config.ts` (Story 002)
- `getPollinationsAuth()`: Uses `getApiKey()` to determine current auth state
- `validateApiKeyType(key)`: Returns "publishable" | "secret" | null
- `getRateLimitInfo(keyType)`: Returns rate limit description

### 2. Server-Side API Route

Create `app/api/generate/route.ts`:
- POST endpoint that proxies to gen.pollinations.ai
- Uses secret key from environment
- Validates params with Zod schema
- Returns image URL on success

### 3. Server Generation Hook

Create `hooks/queries/use-generate-image-server.ts`:
- Calls `/api/generate` instead of direct API
- Same interface as `useGenerateImage`
- Use when secret key auth is needed

### 4. Auth Status Hook

Create `hooks/use-auth-status.ts`:
- Returns `{ isAuthenticated, keyType, rateLimitDescription }`
- Client-side only checks NEXT_PUBLIC key

---

## Rate Limits

| Key Type | Burst | Refill |
|----------|-------|--------|
| Secret | Unlimited | Unlimited |
| Publishable | 3 requests | 1 per 15 sec |
| Anonymous | 1 request | 1 per 30 sec |

---

## Acceptance Criteria

- [ ] Environment variables documented
- [ ] Auth utilities handle both key types
- [ ] Server route uses Bearer header
- [ ] Client falls back to query param
- [ ] Rate limit info displayed in UI

---

## Related Stories
- Story 002: API Service Layer
- Story 007: Error Handling
