# Investigation: Pollinations Cross-Device Authentication

**Date:** 2026-01-17  
**Status:** Complete  
**Priority:** High - UX friction issue  

## Executive Summary

Two critical issues identified with the Pollinations BYOP authentication flow:

### 🔴 Issue #1: Cross-Device Persistence

When users log into their Clerk account from a different browser or device, they are **incorrectly prompted to reconnect to Pollinations**, even though they have already completed the BYOP authorization flow previously.

**Root Cause:** The Pollinations API key is stored client-side only (localStorage), not in the database.
- Each browser/device has its own isolated storage
- The key does not persist across devices
- The key is not linked to the Clerk user account

### 🔴 Issue #2: Hard-Coded 30-Day Expiry

Pollinations allows users to set their key to **never expire** (by leaving the expiry field blank), but our code **always assumes 30-day expiry**. Users who set "never expires" will still be prompted to reconnect after 30 days.

---

## Current Architecture

### 1. Authorization Flow (How it works now)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT BYOP AUTH FLOW                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. User clicks "Connect to Pollinations"                                     │
│           │                                                                   │
│           ▼                                                                   │
│  2. Redirect to https://enter.pollinations.ai/authorize?redirect_url=...     │
│           │                                                                   │
│           ▼                                                                   │
│  3. User authorizes on Pollinations (grants sk_* key)                         │
│           │                                                                   │
│           ▼                                                                   │
│  4. Redirect back with #api_key=sk_xxxxx in URL hash                          │
│           │                                                                   │
│           ▼                                                                   │
│  5. Callback page extracts key from hash                                      │
│           │                                                                   │
│           ▼                                                            ⚠️ PROBLEM │
│  6. storeApiKey() → localStorage ONLY                                         │
│        ├── pollinations_byop_key = sk_xxxxx                                   │
│        ├── pollinations_byop_expiry = <30 days from now>                      │
│        └── pollinations_byop_authorized_at = <timestamp>                      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2. Key Files Involved

| File | Purpose | Issue |
|------|---------|-------|
| `lib/pollen-auth/storage.ts` | Stores/retrieves API key | **localStorage only** - no DB persistence |
| `lib/pollen-auth/context.tsx` | React context provider | Reads from localStorage on mount |
| `lib/pollen-auth/hooks.ts` | Consumer hooks | Expose localStorage-backed state |
| `app/auth/pollinations/callback/page.tsx` | OAuth callback handler | Only calls `storeApiKey()` (localStorage) |
| `convex/users.ts` | User DB operations | Has `pollinationsApiKey` field but **deprecated** |
| `convex/schema.ts` | DB schema | Has `pollinationsApiKey` but marked **@deprecated** |

### 3. Storage Constants (`lib/pollen-auth/constants.ts`)

```typescript
export const STORAGE_KEY = "pollinations_byop_key";
export const STORAGE_EXPIRY_KEY = "pollinations_byop_expiry";
export const STORAGE_AUTHORIZED_AT_KEY = "pollinations_byop_authorized_at";
export const EXPIRY_DAYS = 30;  // ⚠️ Hard-coded - SEE ISSUE #2 BELOW
export const EXPIRING_SOON_THRESHOLD_DAYS = 7;
```

---

## 🔴 Critical Issue #2: Hard-Coded Expiry (Ignores "Never Expires")

### Problem

The Pollinations authorization page allows users to set their key to **never expire** by removing the "30" from the expiry input field. However, our code **always assumes 30-day expiry**.

### Current Behavior (`lib/pollen-auth/storage.ts`, lines 79-84)

```typescript
// Prepare all values before writing to storage
const expiresAt = authorizedAt + EXPIRY_DAYS * 24 * 60 * 60 * 1000;  // ⚠️ ALWAYS 30 days!
const values: Array<{ key: string; value: string }> = [
    { key: STORAGE_KEY, value: apiKey },
    { key: STORAGE_EXPIRY_KEY, value: String(expiresAt) },  // ⚠️ Never null
    { key: STORAGE_AUTHORIZED_AT_KEY, value: String(authorizedAt) },
];
```

### What Pollinations Actually Returns (CONFIRMED)

**The callback ONLY returns the API key - NO expiry or other metadata:**
```
#api_key=sk_xxxxx
```

**NOT returned in the callback:**
- ❌ No `expires_in`
- ❌ No `token_type`
- ❌ No `state`
- ❌ No `error` / `error_description`

**Behavior notes:**
- The redirect is front-end driven (browser route), not a server endpoint
- `redirect_url` must be a valid absolute URL
- Any existing fragment on `redirect_url` is overwritten

### Implication: We Cannot Know Expiry From Callback

Since Pollinations doesn't tell us the expiry, we **cannot differentiate** between:
- A key that expires in 30 days
- A key that never expires
- A key with custom expiry (if supported)

### Revised Options for Expiry Handling

| Option | Description | Recommendation |
|--------|-------------|----------------|
| **A. Remove expiry tracking** | Don't store/check expiry locally | ✅ Recommended |
| **B. Introspect via API** | Call Pollinations API to check key validity | Need endpoint |
| **C. Keep 30-day default** | Current behavior | ❌ Wrong for "never expires" users |
| **D. Graceful failure handling** | Detect auth errors on generation, prompt reconnect | ✅ Combine with A |

**Recommended approach: A + D**
1. Remove local expiry tracking entirely
2. Rely on Pollinations API responses to detect key invalidity
3. On generation failure with auth error → prompt reconnect flow

### Revised Required Changes (Issue #2)

Since we cannot get expiry from the callback, the approach changes:

1. **Remove expiry tracking from storage**:
   ```typescript
   // storage.ts - storeApiKey() simplified
   export function storeApiKey(apiKey: string): boolean {
     // Only store the key and authorized timestamp
     // NO expiry storage
     window.localStorage.setItem(STORAGE_KEY, apiKey);
     window.localStorage.setItem(STORAGE_AUTHORIZED_AT_KEY, String(Date.now()));
     return true;
   }
   ```

2. **Remove expiry checks**:
   ```typescript
   // isAuthExpired() - always returns false (we don't know expiry)
   // Let API failures handle expired keys
   export function isAuthExpired(): boolean {
     return false; // We cannot know - rely on API response
   }
   ```

3. **Add API error detection in generation hooks**:
   ```typescript
   // On 401/403 from Pollinations API during generation
   if (response.status === 401 || response.status === 403) {
     // Key is invalid/expired
     clearStoredAuth();
     showReconnectPrompt();
   }
   ```

4. **Update UI to remove expiry countdown**:
   - Remove "X days remaining" from settings
   - Show "Connected" status only
   - Add "Reconnect" button for manual refresh if needed

---

## The Problem

### Scenario: User logs in from second device

1. **Device A (Browser 1):** User connects to Pollinations → Key stored in localStorage ✅
2. **Device B (Browser 2):** Same user logs in with Clerk → No key found ❌ → Prompted to connect again

### Why this is wrong

Looking at the screenshot provided, the Pollinations authorization page shows:
- **Expiry: 30 days** 
- **Permissions:** Profile, Balance, Usage
- The key is scoped to `bloomstudio.fun`

The expectation is that once connected, the key should be **available on all devices** for this user.

---

## Database Status

### Current Schema (`convex/schema.ts`, lines 24-30)

```typescript
users: defineTable({
    // ...
    /**
     * @deprecated BYOP Migration - This field is deprecated.
     * API keys are now stored client-side in localStorage via the BYOP flow.
     * See lib/pollen-auth for the new implementation.
     * This field is kept for backward compatibility during migration.
     * TODO: Remove this field once all users have migrated to BYOP.
     */
    pollinationsApiKey: v.optional(v.string()),
    // ...
})
```

**The field exists but is deprecated.** The old approach stored the key in Convex, which would have allowed cross-device access. However, this was intentionally removed.

### Deprecated Functions (`convex/users.ts`)

```typescript
// @deprecated - All of these are deprecated:
export const setPollinationsApiKey = mutation({...})
export const getPollinationsApiKey = query({...})
export const getEncryptedApiKeyByClerkId = internalQuery({...})
export const removePollinationsApiKey = mutation({...})
```

---

## Security Considerations

### Why localStorage was chosen (implicit reasons)

From the code comments and architecture:

1. **"Keys are stored ONLY in localStorage and never sent to our server"** (`storage.ts`, line 7)
2. The key is passed in the **URL hash fragment** (`#api_key=...`), which is never sent to the server
3. This provides **zero-knowledge** architecture - Bloom Studio never sees the user's Pollinations key

### The Tradeoff

| Approach | Security | Cross-Device | Complexity |
|----------|----------|--------------|------------|
| **localStorage only (current)** | ✅ Zero-knowledge | ❌ No | Low |
| **Store in Convex (plaintext)** | ⚠️ We can see keys | ✅ Yes | Low |
| **Store encrypted in Convex** | ✅ If done right | ✅ Yes | Medium |
| **Store with user's encryption key** | ✅ E2E encrypted | ✅ Yes | High |

---

## Recommended Solution

### Option A: Store Encrypted Key in Convex (Recommended)

**Flow:**
1. After OAuth callback, encrypt the `sk_*` key before storing
2. Store encrypted key in `users.pollinationsApiKey`
3. On any device login, retrieve and decrypt the key
4. Store decrypted key in localStorage for fast access

**Encryption Strategy:**
```typescript
// Use user's Clerk ID as part of encryption
// Key derivation: PBKDF2(clerkId + appSecret)
// Encryption: AES-256-GCM
```

**Pros:**
- Cross-device works
- Key is encrypted at rest
- We cannot read plain keys in DB

**Cons:**
- If appSecret is compromised, all keys can be decrypted
- Added complexity

### Option B: Use Clerk's User Metadata (Simpler)

**Flow:**
1. After OAuth callback, store key in Clerk's private metadata
2. Clerk handles encryption at rest
3. Retrieve from Clerk on any device

**Pros:**
- Clerk manages security
- Already have Clerk integration
- No DB changes needed

**Cons:**
- Adds API call on each login
- Relies on Clerk's security model

### Option C: Accept Current UX (Document as expected)

Keep localStorage but clearly communicate to users:
- "Connection is per-browser"
- "You'll need to reconnect on new devices"

**Not recommended** - This is poor UX for a production app.

---

## Implementation Checklist for Option A

### Backend Changes

- [ ] Un-deprecate `pollinationsApiKey` field in `convex/schema.ts`
- [ ] Create encryption utilities in `convex/lib/encryption.ts`
- [ ] Update `setPollinationsApiKey` to require encryption
- [ ] Update `getPollinationsApiKey` to return encrypted value
- [ ] Add Convex action for secure key operations

### Frontend Changes

- [ ] Update `app/auth/pollinations/callback/page.tsx`:
  - After storing in localStorage, also save to Convex (encrypted)
- [ ] Update `lib/pollen-auth/context.tsx`:
  - On mount, check localStorage first
  - If not found AND user is authenticated, fetch from Convex
  - Decrypt and store in localStorage for session
- [ ] Update `lib/pollen-auth/storage.ts`:
  - Add `syncToServer()` function
  - Add `fetchFromServer()` function
- [ ] Update `hooks/use-api-card-state.ts`:
  - Handle the "synced" state where key exists server-side

### Migration Consideration

Users who already connected on one device will need to reconnect once to sync their key to the server. After that, it will work cross-device.

---

## Verification of Current Implementation

### EXPIRY_DAYS = 30 ⚠️

The constant in `lib/pollen-auth/constants.ts` is hard-coded to 30 days. **This does NOT match Pollinations which allows "never expires".**

### Settings Page ✅

The settings page `app/settings/page.tsx` correctly uses `ApiCard` which relies on `usePollenAuth()` which reads from localStorage.

### Callback Page ⚠️

The callback `app/auth/pollinations/callback/page.tsx`:
- ✅ Correctly extracts the `api_key` from the hash
- ❌ Does **NOT** extract expiry information (Pollinations doesn't provide it)
- ⚠️ Hard-codes 30-day expiry - should be removed

---

## Files to Modify (Summary)

### Issue #1: Cross-Device Persistence

1. **`convex/schema.ts`** - Un-deprecate `pollinationsApiKey` (no expiry field needed)
2. **`convex/users.ts`** - Un-deprecate and update key mutation/query functions
3. **`lib/pollen-auth/storage.ts`** - Add `syncToServer()` and `fetchFromServer()` functions
4. **`lib/pollen-auth/context.tsx`** - Fetch from Convex on mount if localStorage empty
5. **`app/auth/pollinations/callback/page.tsx`** - Add Convex mutation after localStorage store

### Issue #2: Remove Expiry Tracking (Revised)

Since Pollinations doesn't return expiry info, we **remove expiry tracking entirely**:

1. **`lib/pollen-auth/constants.ts`**:
   - Remove `EXPIRY_DAYS` constant
   - Remove `EXPIRING_SOON_THRESHOLD_DAYS` constant
   - Remove `STORAGE_EXPIRY_KEY` constant

2. **`lib/pollen-auth/storage.ts`**:
   - Simplify `storeApiKey()` - no expiry calculation
   - Remove expiry from `getStoredMetadata()`
   - Update `isAuthExpired()` to always return false
   - Remove `getDaysUntilExpiry()` function

3. **`lib/pollen-auth/context.tsx`**:
   - Remove `expiresAt`, `daysUntilExpiry`, `isExpiringSoon`, `isExpired` from state
   - Simplify `deriveAuthState()`

4. **`lib/pollen-auth/hooks.ts`**:
   - Remove expiry-related state from hook returns

5. **`components/settings/api-card-components.tsx`**:
   - Remove expiry countdown display
   - Show simple "Connected" / "Not Connected" status

6. **`hooks/use-api-card-state.ts`**:
   - Remove `expiring-soon`, `expired` connection statuses
   - Simplify to: `loading`, `not-connected`, `connected`

7. **Generation hooks** (`use-generate-image.ts`, `use-batch-mode.ts`):
   - Add error handling for 401/403 responses
   - Call `clearStoredAuth()` and prompt reconnect on auth failure

## Questions for Team (Updated)

### ALL RESOLVED ✅

| Question | Decision |
|----------|----------|
| **Encryption approach** | Store encrypted in Convex with modern security standards |
| **Error detection** | 401 status code indicates expired/invalid key |
| **Reconnect UX** | Use existing `components/pollen-auth/reconnect-modal.tsx` |
| **Migration** | No migration - users without key get reconnect prompt |
| **Balance check** | No - Balance scope is optional, unreliable for detection |

---

## Appendix: Screenshot Analysis

The screenshot shows the Pollinations authorization page at:
```
https://enter.pollinations.ai/authorize?redirect_url=https%3A%2F%2Fbloomstudio.fun%2Fauth%2Fpollinations%2Fcallback
```

Key observations:
- **Budget: Unlimited pollen** ✅
- **Expiry: 30 days** - But can be cleared to "never expire"
- **Permissions:** Profile, Balance, Usage (all optional checkboxes)
- **Redirect URL:** Correctly points to `/auth/pollinations/callback`

---

## Final Implementation Plan

### Phase 1: Remove Expiry Tracking (Issue #2)

Since Pollinations doesn't return expiry info, remove all local expiry logic:

**Files to modify:**

1. **`lib/pollen-auth/constants.ts`**
   - Remove `EXPIRY_DAYS`
   - Remove `EXPIRING_SOON_THRESHOLD_DAYS`
   - Remove `STORAGE_EXPIRY_KEY`

2. **`lib/pollen-auth/storage.ts`**
   - Simplify `storeApiKey()` - remove expiry calculation
   - Remove `isAuthExpired()` function (or make it return `false`)
   - Remove `getDaysUntilExpiry()` function
   - Update `getStoredMetadata()` - remove expiry

3. **`lib/pollen-auth/context.tsx`**
   - Remove `expiresAt`, `daysUntilExpiry`, `isExpiringSoon`, `isExpired` from `PollenAuthState`
   - Simplify `deriveAuthState()`

4. **`lib/pollen-auth/hooks.ts`**
   - Remove expiry-related fields from hook returns

5. **`hooks/use-api-card-state.ts`**
   - Remove `expiring-soon`, `expired` statuses
   - Simplify to: `loading`, `not-connected`, `connected`

6. **`components/settings/api-card-components.tsx`**
   - Remove expiry countdown display
   - Show simple "Connected" status

7. **`components/pollen-auth/reconnect-modal.tsx`**
   - Change trigger from `isExpired` to new `needsReconnect` state (set by 401 detection)
   - Update copy to remove "30 days" reference

### Phase 2: Add Error Detection & Reconnect Flow

**Pollinations API Error Codes (CONFIRMED from gateway source):**

| Code | Cause | Our Response |
|------|-------|--------------|
| **401** | No key / invalid key / expired key (all same) | → Reconnect modal |
| **402** | Valid key but budget exhausted | → Show "top up pollen" message |
| **403** | Valid key but model not in allowlist | → Show model access error |

Note: 401 doesn't distinguish between missing, invalid, or expired keys - all return same error.

**Files to modify:**

1. **`lib/pollen-auth/context.tsx`**
   - Add `needsReconnect` state (triggered by 401)
   - Add `setNeedsReconnect(true/false)` action

2. **`hooks/queries/use-generate-image.ts`**
   - Handle 401 → `clearStoredAuth()` + `setNeedsReconnect(true)`
   - Handle 402 → Show budget exhausted toast/modal
   - Handle 403 → Show model access error

3. **`hooks/use-batch-mode.ts`**
   - Same error handling for batch generation

4. **`convex/singleGenerationProcessor.ts`** and **`convex/batchProcessor.ts`**
   - Ensure HTTP status codes are propagated correctly to client
   - May need to parse Pollinations response and include status in error

5. **`components/pollen-auth/reconnect-modal.tsx`**
   - Trigger on `needsReconnect` instead of `isExpired`
   - Update messaging: "Connection invalid or expired" (generic)

6. **NEW: Budget exhausted handling**
   - May reuse existing `LowBalanceWarningDialog` or create new component
   - Link to Pollinations dashboard to top up

### Phase 3: Cross-Device Persistence (Issue #1)

Store encrypted key in Convex for cross-device access:

**Files to create/modify:**

1. **`convex/lib/encryption.ts`** (NEW)
   - AES-256-GCM encryption/decryption
   - Key derivation from server secret
   - Environment variable for encryption secret

2. **`convex/schema.ts`**
   - Un-deprecate `pollinationsApiKey` field
   - Add comment explaining encryption

3. **`convex/users.ts`**
   - Un-deprecate `setPollinationsApiKey` mutation
   - Un-deprecate `getPollinationsApiKey` query
   - Add encryption/decryption in handlers

4. **`lib/pollen-auth/storage.ts`**
   - Add `syncToConvex()` function to save key after callback
   - Add `fetchFromConvex()` function to retrieve on login

5. **`lib/pollen-auth/context.tsx`**
   - On mount: Check localStorage first
   - If empty AND user authenticated: Fetch from Convex
   - Decrypt and store in localStorage for session

6. **`app/auth/pollinations/callback/page.tsx`**
   - After `storeApiKey()`: Call Convex mutation to sync encrypted key

### Implementation Order

1. **Phase 1 first** - Remove broken expiry logic (quick win, reduces code)
2. **Phase 2 second** - Add 401 detection (critical for UX when keys expire)
3. **Phase 3 last** - Cross-device (biggest change, depends on Phase 1 & 2)

### Test Scenarios

**Cross-device:**
- [ ] User connects on Device A → Key in localStorage AND Convex
- [ ] User logs in on Device B → Key fetched from Convex → localStorage populated
- [ ] User disconnects → Cleared from both localStorage and Convex

**Error handling:**
- [ ] 401 response → `clearStoredAuth()` + Reconnect modal shown
- [ ] 402 response → Budget exhausted message (not reconnect)
- [ ] 403 response → Model access error message
- [ ] User with "never expires" key → Works indefinitely until revoked

---

## Appendix: Pollinations Gateway API Reference

**Source:** Analysis of `enter.pollinations.ai` gateway code

### Authentication Flow

```
Request → authenticateApiKey()
           │
           ├─ No key provided → returns null
           │
           ├─ Key provided → verifyApiKey()
           │                   ├─ valid: true → returns user object
           │                   └─ valid: false → returns null
           │
           └─ Returns null for all failure cases (no distinction)
```

### HTTP Status Codes

| Status | Meaning | Trigger |
|--------|---------|---------|
| **401** | Unauthorized | `requireAuthorization()` fails (no key, invalid, or expired) |
| **402** | Payment Required | `requireKeyBudget()` - valid key but budget exhausted |
| **403** | Forbidden | `requireModelAccess()` - valid key but model not in allowlist |

### Key Insight

**401 is ambiguous** - the gateway does not distinguish:
- Missing `Authorization` header
- Invalid API key format
- Expired API key
- Revoked API key

All of these return the same 401 with a generic message.

### Recommended Error Handling Strategy

```typescript
switch (response.status) {
  case 401:
    // Key issue - clear auth and show reconnect
    clearStoredAuth();
    setNeedsReconnect(true);
    break;
  case 402:
    // Budget exhausted - don't clear auth, show top-up
    showBudgetExhaustedModal();
    break;
  case 403:
    // Model access denied - show specific error
    showModelAccessError(response.modelId);
    break;
}
```
