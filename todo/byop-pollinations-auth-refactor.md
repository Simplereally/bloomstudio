# Bring Your Own Pollen (BYOP) Authentication Refactor

## Executive Summary

This document provides a comprehensive analysis of integrating Pollinations' new **Bring Your Own Pollen (BYOP)** authentication system into our application. BYOP allows users to authenticate directly with Pollinations via an OAuth-like implicit grant flow, eliminating the need for users to manually copy API keys from the Pollinations dashboard.

### Key Benefits
- **Zero API Costs**: Users pay from their own Pollen wallet
- **Simplified Onboarding**: One-click authorization instead of copy-paste workflow
- **No Key Storage**: API key lives in browser memory/localStorage, not our database
- **Client-Side Ready**: Full `sk_` key performance without server-side storage concerns

### Key Constraints
- **30-Day Expiration**: BYOP keys expire after 30 days
- **User Revocable**: Users can revoke access anytime from their Pollinations dashboard
- **Session Decoupling**: User may be logged into our app (Clerk) but not authorized with Pollinations

---

## 1. BYOP System Overview

### 1.1 Authentication Flow

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│   Our App       │ ──── │ enter.pollinations.ai│ ──── │ User's Browser  │
│  (pixelstream)  │      │    /authorize        │      │                 │
└─────────────────┘      └──────────────────────┘      └─────────────────┘
        │                           │                           │
        │ 1. Redirect to authorize  │                           │
        │ ────────────────────────► │                           │
        │                           │ 2. User signs in/authorizes│
        │                           │ ──────────────────────────►│
        │                           │                           │
        │ 3. Redirect back with key │                           │
        │ ◄──────────────────────── │                           │
        │ https://app.com#api_key=sk_abc123                     │
        │                           │                           │
        │ 4. Extract key from hash  │                           │
        │ Store in localStorage     │                           │
        │                           │                           │
        │ 5. Use key in API calls   │                           │
        │ ────────────────────────────────────────────────────► │
                    Pollinations API (Bearer sk_abc123)
```

### 1.2 Key Implementation Details

**Authorization URL:**
```
https://enter.pollinations.ai/authorize?redirect_url=https://yourapp.com
```

**Callback Format:**
```
https://yourapp.com#api_key=sk_abc123xyz
```

> **Security Note**: The key is passed in the URL hash fragment (`#`), not the query string (`?`). This means:
> - It never hits server logs
> - It's only accessible via JavaScript on the client
> - It provides implicit client-side security

**Key Extraction Code:**
```javascript
const params = new URLSearchParams(location.hash.slice(1));
const apiKey = params.get('api_key');
```

**API Usage:**
```javascript
fetch('https://gen.pollinations.ai/v1/...', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 2. Current System Architecture

### 2.1 Current Authentication Flow

```
┌─────────────────┐      ┌────────────────┐      ┌─────────────────┐
│   User          │      │   Our App      │      │   Convex DB     │
│                 │      │                │      │                 │
└─────────────────┘      └────────────────┘      └─────────────────┘
        │                        │                        │
        │ 1. Open onboarding modal                        │
        │ ──────────────────────►│                        │
        │                        │                        │
        │ 2. User manually goes to Pollinations           │
        │    Creates account, generates sk_ key           │
        │                        │                        │
        │ 3. Pastes key in modal │                        │
        │ ──────────────────────►│                        │
        │                        │                        │
        │                        │ 4. POST /api/user/api-key
        │                        │ (encrypts & stores)    │
        │                        │ ──────────────────────►│
        │                        │                        │
        │ 5. Generation request  │                        │
        │ ──────────────────────►│                        │
        │                        │ 6. Fetch encrypted key │
        │                        │ ◄──────────────────────│
        │                        │                        │
        │                        │ 7. Decrypt, call Pollinations
        │                        │ (server-side via Convex action)
```

### 2.2 Files Involved in Current Flow

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `components/studio/api-key-onboarding-modal.tsx` | Manual key input modal | **Replace** with BYOP OAuth flow |
| `components/settings/api-card.tsx` | Manual key management in settings | **Update** to show BYOP status |
| `app/api/user/api-key/route.ts` | Encrypts & stores key via API | **Deprecate** or repurpose |
| `lib/encryption.ts` | AES-256-GCM encryption for keys | **Remove** (no encryption needed) |
| `convex/users.ts` | User record with `pollinationsApiKey` field | **Redesign** (optional metadata storage) |
| `convex/schema.ts` | Schema with encrypted key field | **Modify** field semantics |
| `convex/singleGenerationProcessor.ts` | Fetches encrypted key for generation | **Major refactor** - key comes from client |
| `convex/batchProcessor.ts` | Fetches encrypted key for batch generation | **Major refactor** - key comes from client |
| `app/api/user/balance/route.ts` | Fetches balance using decrypted key | **Refactor** - key comes from client |

### 2.3 Key Flow Tracing

#### Generation Flow (Single Image)
```
1. User clicks "Generate" in ControlsFeature
   └─> hooks/queries/use-generate-image.ts
       └─> Calls convex/singleGeneration.ts startGeneration()
           └─> Schedules convex/singleGenerationProcessor.ts
               └─> Line 97-99: Fetches encrypted key via getEncryptedApiKeyByClerkId
               └─> Line 114: Decrypts key via decryptApiKey()
               └─> Line 160: Uses key in Authorization header
```

#### Generation Flow (Batch)
```
1. User clicks "Generate Batch" in ControlsFeature
   └─> hooks/use-batch-mode.ts
       └─> Calls convex/batchGeneration.ts startBatchGeneration()
           └─> Schedules convex/batchProcessor.ts for each item
               └─> Line 120-122: Fetches encrypted key
               └─> Line 138: Decrypts key
               └─> Line 184: Uses key in Authorization header
```

---

## 3. The BYOP Challenge: Dual Authentication States

### 3.1 The Core Problem

With BYOP, we have **two independent authentication states**:

1. **Clerk Authentication**: User is signed into our app
2. **Pollinations Authorization**: User has authorized our app to use their Pollen

These states are decoupled:
- User can be Clerk-authenticated but NOT Pollinations-authorized
- User can have an expired Pollinations key while still Clerk-authenticated
- User can revoke Pollinations access without affecting their Clerk session

### 3.2 State Matrix

| Clerk Auth | Pollinations Auth | Scenario | User Experience |
|------------|-------------------|----------|-----------------|
| ❌ Signed Out | ❌ No Key | New visitor | Show sign-in prompt |
| ✅ Signed In | ❌ No Key | Just signed up | Show "Connect to Pollinations" |
| ✅ Signed In | ✅ Valid Key | Happy path | Full studio access |
| ✅ Signed In | ⏳ Expired Key | 30+ days since auth | Show "Reconnect to Pollinations" |
| ✅ Signed In | 🚫 Revoked Key | User revoked access | Show "Reconnect to Pollinations" |

### 3.3 Frictionless Re-authorization Strategy

**Goal**: Make re-authorization as seamless as possible while being transparent about the 30-day expiration.

#### Recommended Approach: "Just-in-Time" Authorization

Instead of blocking the UI when the key expires, we:

1. **Store key metadata** (not the key itself) in our database:
   - `pollinationsAuthorizedAt: Date` - When user last authorized
   - `pollinationsAuthExpiry: Date` - Calculated expiry (30 days from auth)

2. **Proactive notification** (7 days before expiry):
   - Show subtle banner: "Your Pollinations connection expires soon. [Reconnect now]"
   - One-click re-authorization flow

3. **Graceful degradation** on expired/revoked key:
   - When generation fails with 401/403, detect and show modal
   - Store in-progress generation state
   - After re-auth, resume generation automatically

4. **Silent key refresh** (if supported by Pollinations - TBD):
   - Check if Pollinations offers refresh token mechanism
   - Automatically attempt refresh before expiry

---

## 4. Implementation Architecture

### 4.1 New Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │ PollenAuthContext│◄────│ usePollenAuth() Hook            │   │
│  │                  │     │ - Manages localStorage key      │   │
│  │ - apiKey         │     │ - Tracks expiry                 │   │
│  │ - isAuthorized   │     │ - Handles OAuth callback        │   │
│  │ - expiresAt      │     │ - Detects 401 errors            │   │
│  │ - authorize()    │     └─────────────────────────────────┘   │
│  │ - deauthorize()  │                                           │
│  └─────────────────┘                                            │
│          │                                                       │
│          ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Generation Flow                         │   │
│  │                                                          │   │
│  │  User Action ──► Client collects key ──► API Call        │   │
│  │                                                          │   │
│  │  Single Gen: Client ──► (with key) ──► Next.js API ──►   │   │
│  │              Pollinations                                │   │
│  │                                                          │   │
│  │  Batch Gen: Client ──► Convex Mutation (with key) ──►    │   │
│  │             Convex Action ──► Pollinations               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Convex + Next.js)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Convex Schema - users table                              │   │
│  │                                                          │   │
│  │ - pollinationsApiKey: v.optional(v.string())  ◄── REMOVE │   │
│  │ + pollinationsAuthorizedAt: v.optional(v.number())       │   │
│  │ + pollinationsAuthExpiry: v.optional(v.number())         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Generation Processors                                    │   │
│  │                                                          │   │
│  │ - No longer fetch/decrypt keys from DB                   │   │
│  │ - Receive key as parameter from client mutation call     │   │
│  │ - Validate key exists and is non-empty                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 New Component: PollenAuthProvider

```typescript
// lib/pollen-auth/context.tsx

interface PollenAuthState {
  // The BYOP API key (null if not authorized)
  apiKey: string | null;
  // Whether the user is currently authorized
  isAuthorized: boolean;
  // When the current authorization expires
  expiresAt: Date | null;
  // Days until expiration (null if not authorized)
  daysUntilExpiry: number | null;
  // Whether authorization is expiring soon (< 7 days)
  isExpiringSoon: boolean;
}

interface PollenAuthActions {
  // Initiates OAuth flow to Pollinations
  authorize: () => void;
  // Clears stored authorization
  deauthorize: () => void;
  // Checks if key is still valid (call before generation)
  validateKey: () => Promise<boolean>;
}

const STORAGE_KEY = 'pollinations_byop_key';
const STORAGE_EXPIRY_KEY = 'pollinations_byop_expiry';
const EXPIRY_DAYS = 30;
const EXPIRING_SOON_THRESHOLD_DAYS = 7;

export function usePollenAuth(): PollenAuthState & PollenAuthActions {
  // Implementation details...
}
```

### 4.3 Key Storage Strategy

#### Option A: localStorage Only (Recommended)
```typescript
// Store key and metadata in localStorage
localStorage.setItem('pollinations_byop_key', apiKey);
localStorage.setItem('pollinations_byop_expiry', expiryTimestamp);
localStorage.setItem('pollinations_byop_authorized_at', authorizedAtTimestamp);
```

**Pros:**
- Simplest implementation
- No server storage of keys
- Aligns with BYOP's client-side philosophy

**Cons:**
- Key lost if user clears browser data
- No cross-device sync

#### Option B: Hybrid (localStorage + Convex Metadata)
```typescript
// Client: Store key in localStorage
localStorage.setItem('pollinations_byop_key', apiKey);

// Server: Store metadata in Convex (NOT the key)
await setPollinationsAuthMetadata({
  authorizedAt: Date.now(),
  expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
});
```

**Pros:**
- Server knows when user authorized
- Can send proactive expiry notifications
- Cross-device awareness (though key still per-device)

**Cons:**
- Slight complexity increase
- Metadata can drift from actual key state

**Recommendation:** Start with **Option A** for MVP, migrate to **Option B** for better UX.

---

## 5. Implementation Plan

### Phase 1: Core BYOP Infrastructure (Estimated: 2-3 days)

#### 1.1 Create Pollen Auth Module
- [ ] Create `lib/pollen-auth/context.tsx` - PollenAuthProvider
- [ ] Create `lib/pollen-auth/hooks.ts` - usePollenAuth hook
- [ ] Create `lib/pollen-auth/storage.ts` - localStorage utilities
- [ ] Create `lib/pollen-auth/constants.ts` - BYOP configuration

#### 1.2 Add OAuth Callback Handler
- [ ] Create `app/auth/pollinations/callback/page.tsx`
  - Extracts `api_key` from URL hash
  - Stores in localStorage
  - Redirects to studio
  - Handles errors gracefully

#### 1.3 Wrap App with Provider
- [ ] Add PollenAuthProvider to `app/layout.tsx` or `components/providers/`

### Phase 2: UI Updates (Estimated: 2-3 days)

#### 2.1 Replace Onboarding Modal
- [ ] Refactor `components/studio/api-key-onboarding-modal.tsx`
  - Replace manual key input with "Connect with Pollinations" button
  - Add OAuth redirect logic
  - Keep upgrade/star screen (post-authorization)
  
#### 2.2 Update Settings Page
- [ ] Refactor `components/settings/api-card.tsx`
  - Show connection status ("Connected" / "Not Connected" / "Expiring Soon")
  - Add "Disconnect" and "Reconnect" buttons
  - Display expiry countdown
  
#### 2.3 Add Re-authorization Prompts
- [ ] Create re-auth banner component for expiring keys
- [ ] Create re-auth modal for expired/revoked keys
- [ ] Integrate with generation error handling

### Phase 3: Generation Flow Refactor (Estimated: 3-4 days)

#### 3.1 Modify Convex Mutations
- [ ] Update `convex/singleGeneration.ts`
  - Accept `apiKey` as parameter in `startGeneration`
  - Pass to processor action
  
- [ ] Update `convex/batchGeneration.ts`
  - Accept `apiKey` as parameter in `startBatchGeneration`
  - Pass to processor action

#### 3.2 Modify Convex Actions
- [ ] Update `convex/singleGenerationProcessor.ts`
  - Remove `getEncryptedApiKeyByClerkId` calls
  - Remove `decryptApiKey` calls
  - Accept `apiKey` as action parameter
  - Validate key exists before processing
  
- [ ] Update `convex/batchProcessor.ts`
  - Same changes as singleGenerationProcessor

#### 3.3 Update Client Hooks
- [ ] Update `hooks/queries/use-generate-image.ts`
  - Get key from usePollenAuth context
  - Pass key in mutation call
  
- [ ] Update `hooks/use-batch-mode.ts`
  - Get key from usePollenAuth context
  - Pass key in mutation call

### Phase 4: Cleanup & Security (Estimated: 1-2 days)

#### 4.1 Schema Migration
- [ ] Update `convex/schema.ts`
  - Deprecate `pollinationsApiKey` field
  - Add `pollinationsAuthorizedAt` and `pollinationsAuthExpiry` (optional)

#### 4.2 Remove Deprecated Code
- [ ] Remove `lib/encryption.ts` (or mark deprecated)
- [ ] Remove `app/api/user/api-key/route.ts` (or mark deprecated)
- [ ] Update `convex/users.ts` - remove key-related functions

#### 4.3 Security Audit
- [ ] Ensure no API keys are logged
- [ ] Ensure keys are never sent to server outside Authorization header
- [ ] Test 401/403 handling and re-auth flow
- [ ] Test key revocation scenario

### Phase 5: Testing & Polish (Estimated: 1-2 days)

#### 5.1 Testing
- [ ] Unit tests for PollenAuthProvider
- [ ] Integration tests for OAuth callback
- [ ] E2E tests for full authorization flow
- [ ] E2E tests for re-authorization flow

#### 5.2 UX Polish
- [ ] Loading states during authorization
- [ ] Error states for failed authorization
- [ ] Toast notifications for auth events
- [ ] Animated transitions in modal

---

## 6. Migration Strategy

### 6.1 Backward Compatibility

During the transition period, support BOTH auth methods:

```typescript
// hooks/queries/use-generate-image.ts
const { apiKey: byopKey } = usePollenAuth();
const legacyKey = useQuery(api.users.getPollinationsApiKey);

// Prefer BYOP, fall back to legacy
const apiKey = byopKey ?? legacyKey;

if (!apiKey) {
  // No key available - show appropriate prompt
}
```

### 6.2 Migration Path for Existing Users

1. **Detect Legacy Key**: If user has encrypted key in Convex but no BYOP key
2. **Show Migration Prompt**: "Upgrade to seamless Pollinations connection"
3. **One-Click Migration**: Initiate BYOP flow
4. **Auto-Cleanup**: After successful BYOP, mark legacy key as deprecated

### 6.3 Feature Flags

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  BYOP_AUTH_ENABLED: process.env.NEXT_PUBLIC_BYOP_AUTH_ENABLED === 'true',
  LEGACY_AUTH_ENABLED: process.env.NEXT_PUBLIC_LEGACY_AUTH_ENABLED !== 'false',
};
```

---

## 7. Edge Cases & Error Handling

### 7.1 OAuth Flow Errors

| Error | Cause | Handling |
|-------|-------|----------|
| No key in callback | User cancelled | Show "Authorization cancelled" message |
| Invalid redirect_url | Misconfigured | Log error, show generic error |
| Pollinations down | Service outage | Retry button, status page link |

### 7.2 Key Validation Errors

| Error | Cause | Handling |
|-------|-------|----------|
| 401 Unauthorized | Key expired/revoked | Clear key, show re-auth modal |
| 403 Forbidden | Insufficient pollen balance | Show "Top up your pollen" message |
| 429 Rate Limited | Too many requests | Should not happen with sk_, log if it does |

### 7.3 Cross-Tab Sync

```typescript
// Listen for storage changes from other tabs
useEffect(() => {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      // Update state from new value
      setApiKey(e.newValue);
    }
  };
  
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}, []);
```

---

## 8. UX Recommendations

### 8.1 Frictionless Authorization Flow

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │            🌸 Connect to Pollinations                   │  │
│  │                                                          │  │
│  │    Generate unlimited images with your own Pollen       │  │
│  │    wallet. Takes ~10 seconds.                           │  │
│  │                                                          │  │
│  │    ┌─────────────────────────────────────────────────┐  │  │
│  │    │                                                  │  │  │
│  │    │  [🌸 Connect with Pollinations]                 │  │  │
│  │    │                                                  │  │  │
│  │    └─────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │    ✓ One-click authorization                            │  │
│  │    ✓ Your pollen, your generations                      │  │
│  │    ✓ No rate limits                                     │  │
│  │                                                          │  │
│  │    ───────────────────────────────────────────────────  │  │
│  │                                                          │  │
│  │    Already have a key? [Enter manually]                 │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 Expiring Soon Banner

```
┌────────────────────────────────────────────────────────────────┐
│ 🔔 Your Pollinations connection expires in 3 days              │
│    [Reconnect now] to continue generating without interruption.│
│                                                       [Dismiss] │
└────────────────────────────────────────────────────────────────┘
```

### 8.3 Re-authorization Modal (on expired key)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │            🌸 Reconnect to Pollinations                 │  │
│  │                                                          │  │
│  │    Your connection has expired. Reconnect in one        │  │
│  │    click to continue generating.                        │  │
│  │                                                          │  │
│  │    ┌─────────────────────────────────────────────────┐  │  │
│  │    │  [🌸 Reconnect with Pollinations]               │  │  │
│  │    └─────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │    Your pending generation will resume automatically.   │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 9. Security Considerations

### 9.1 Key Handling Best Practices

1. **Never log full keys** - Use masked logging: `sk_****...****`
2. **Never store in Convex** - Keep only in client localStorage
3. **HTTPS only** - Ensure all API calls use HTTPS
4. **Clear on logout** - Option to clear key when user signs out of Clerk

### 9.2 XSS Considerations

Since the key is in localStorage, XSS attacks could steal it. Mitigations:

1. **CSP Headers** - Strict Content Security Policy
2. **Input Sanitization** - Never render untrusted content
3. **HTTPOnly alternatives** - Consider service worker approach for extra security (future enhancement)

### 9.3 CSRF Considerations

The OAuth callback doesn't modify server state, so CSRF is less of a concern. However:

1. **State parameter** - Add random state to redirect_url, verify on callback
2. **Origin validation** - Verify callback came from expected Pollinations domain

---

## 10. Questions for Pollinations Team

Before implementation, clarify:

1. **Refresh tokens?** Is there a way to refresh the key before 30-day expiry without user interaction?

2. **Revocation detection?** Is there an API endpoint to check if a key is still valid without making a generation request?

3. **Batch key usage?** Any concerns with the same key being used for rapid batch processing from server-side?

4. **Rate limits?** Confirm sk_ keys from BYOP have same unlimited rate limits as regular sk_ keys.

5. **Error codes?** Specific error response shapes for expired vs revoked vs insufficient balance?

---

## 11. Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Core Infrastructure | 2-3 days | None |
| Phase 2: UI Updates | 2-3 days | Phase 1 |
| Phase 3: Generation Refactor | 3-4 days | Phase 1, Phase 2 |
| Phase 4: Cleanup | 1-2 days | Phase 3 |
| Phase 5: Testing | 1-2 days | Phase 4 |
| **Total** | **9-14 days** | |

---

## 12. Appendix: Code References

### Current Files to Modify

| File | Lines | Key Changes |
|------|-------|-------------|
| `components/studio/api-key-onboarding-modal.tsx` | 538 | Replace with BYOP flow |
| `components/settings/api-card.tsx` | 172 | Update UI for BYOP status |
| `convex/users.ts` | 279 | Remove key storage, add metadata |
| `convex/schema.ts` | 298 | Update user schema |
| `convex/singleGenerationProcessor.ts` | 252 | Remove key fetch, accept as param |
| `convex/batchProcessor.ts` | 268 | Remove key fetch, accept as param |
| `convex/singleGeneration.ts` | ~200 | Accept key param |
| `convex/batchGeneration.ts` | ~300 | Accept key param |
| `hooks/queries/use-generate-image.ts` | ~100 | Get key from context |
| `hooks/use-batch-mode.ts` | ~300 | Get key from context |
| `app/api/user/api-key/route.ts` | 72 | Deprecate |
| `app/api/user/balance/route.ts` | 119 | Refactor to use client key |
| `lib/encryption.ts` | 102 | Deprecate |

### New Files to Create

| File | Purpose |
|------|---------|
| `lib/pollen-auth/context.tsx` | PollenAuthProvider & context |
| `lib/pollen-auth/hooks.ts` | usePollenAuth hook |
| `lib/pollen-auth/storage.ts` | localStorage utilities |
| `lib/pollen-auth/constants.ts` | BYOP configuration |
| `app/auth/pollinations/callback/page.tsx` | OAuth callback handler |
| `components/pollen-auth/connect-button.tsx` | Reusable connect button |
| `components/pollen-auth/expiry-banner.tsx` | Expiring soon banner |
| `components/pollen-auth/reconnect-modal.tsx` | Re-auth modal |

---

## 13. Open Questions & Decisions

### Decision 1: Key Passing Architecture

**Option A:** Pass key through mutations to actions (recommended)
- Requires schema changes
- More explicit, easier to audit

**Option B:** Store key in session/headers
- Less intrusive change
- More complex to implement securely

**Decision:** TBD with team

### Decision 2: Batch Processing with Client Key

**Option A:** Client sends key with each batch item scheduling
- Simple, but lots of key transmission

**Option B:** Client sends key once, stored in batchJob record (encrypted? in-memory?)
- More efficient, but security implications

**Decision:** TBD with team

### Decision 3: Cross-Device Experience

**Option A:** Accept key is per-device, show "Connect" on each new device
- Simplest implementation
- User friction on new devices

**Option B:** Store encrypted key in Convex, decrypt client-side
- Complex key management
- Better UX

**Decision:** Start with Option A, revisit based on user feedback

---

*Document created: 2026-01-12*
*Last updated: 2026-01-12*
*Author: AI Assistant*
