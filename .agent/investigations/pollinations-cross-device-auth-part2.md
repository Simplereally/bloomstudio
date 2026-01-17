# Investigation: Pollinations Cross-Device Authentication — Part 2

**Date:** 2025-01-17  
**Status:** Planning  
**Priority:** Medium - Cleanup and simplification  
**Depends On:** Part 1 (Complete)

---

## Executive Summary

Follow-up investigation after Part 1 implementation. Identifies cleanup opportunities and architectural clarifications for the BYOP authentication system.

---

## Review Items from Part 1

### ✅ Item 1: ReconnectModal Dismissibility

**Status:** Already correctly implemented

The modal is **not dismissable** by default due to explicit prevention handlers:

```typescript
// reconnect-modal.tsx (lines 50-68)
export function ReconnectModal({ open, onOpenChange }: ReconnectModalProps) {
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      return; // Prevent close - user must reconnect
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}  // ✅ Blocks overlay click
        onEscapeKeyDown={(e) => e.preventDefault()}       // ✅ Blocks ESC key
        showCloseButton={false}                           // ✅ Hides X button
      >
```

**No action required.**

---

### ⏸️ Item 2: No Automatic Retry After Reconnect

**Status:** Deferred — too complex to maintain

When a generation fails with 401 and user reconnects, they must manually retry. Implementing automatic retry would require:
- Storing failed generation params
- Detecting successful reconnection
- Re-triggering generation
- Handling edge cases (user navigated away, multiple failures, etc.)

**Decision:** Leave as-is. Users can manually retry.

---

### 🔴 Item 3: localStorage Architecture Clarification

**Status:** Needs investigation — potential simplification opportunity

#### Current Architecture (Redundant)

The current implementation maintains **two sources of truth**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CURRENT DATA FLOW (REDUNDANT)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OAuth Callback                                                             │
│       │                                                                     │
│       ├──► localStorage.setItem("pollinations_byop_key", sk_xxx)           │
│       │                                                                     │
│       └──► Convex: setPollinationsApiKey({ apiKey: sk_xxx })               │
│                    └──► encrypt(sk_xxx) ──► users.pollinationsApiKey       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  On Page Load (PollenAuthProvider)                                          │
│       │                                                                     │
│       ├──► getStoredApiKey() from localStorage ──► state.apiKey            │
│       │                                                                     │
│       └──► useQuery(getPollinationsApiKey) ──► serverApiKey                │
│                │                                                            │
│                └──► if (serverApiKey && !localStorage) {                   │
│                         storeApiKey(serverApiKey) // Sync to localStorage  │
│                     }                                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Generation Request                                                         │
│       │                                                                     │
│       └──► usePollenApiKey() ──► reads from context.apiKey                 │
│                │                     (which came from localStorage)         │
│                │                                                            │
│                └──► startGeneration({ apiKey }) ──► Convex mutation        │
│                                                         │                   │
│                                                         └──► Pollinations  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Problems with Current Approach

| Issue | Description |
|-------|-------------|
| **Dual storage** | Key exists in both localStorage AND Convex DB |
| **Complex sync logic** | Must keep two sources in sync |
| **Stale data risk** | localStorage could have old key while Convex has new one |
| **Unnecessary client exposure** | Plain-text key sitting in localStorage |
| **Extra code** | `storage.ts` with localStorage utilities is unnecessary overhead |

#### Intended Architecture (Per Spec)

The Part 1 spec stated: *"Keys go into Convex DB and are used for all Pollinations requests"*

The intended architecture should be:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SIMPLIFIED DATA FLOW (PROPOSED)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OAuth Callback                                                             │
│       │                                                                     │
│       └──► Convex: setPollinationsApiKey({ apiKey: sk_xxx })               │
│                    └──► encrypt(sk_xxx) ──► users.pollinationsApiKey       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  On Page Load (PollenAuthProvider)                                          │
│       │                                                                     │
│       └──► useQuery(getPollinationsApiKey) ──► state.apiKey                │
│                                                   (decrypted by server)     │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Generation Request                                                         │
│       │                                                                     │
│       └──► usePollenApiKey() ──► reads from context.apiKey                 │
│                │                     (which came from Convex query)         │
│                │                                                            │
│                └──► startGeneration({ apiKey }) ──► Convex mutation        │
│                                                         │                   │
│                                                         └──► Pollinations  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Option A: Remove localStorage Entirely (Recommended)

**Benefits:**
- Single source of truth (Convex)
- No sync logic needed
- Key never exposed in browser storage
- Simpler codebase

**Trade-offs:**
- Requires Convex query on every page load
- Slightly slower initial load (network vs localStorage)
- No offline capability (but generation already requires network)

#### Files to Modify

1. **`lib/pollen-auth/storage.ts`** — DELETE or heavily simplify
   - Remove `storeApiKey()`, `getStoredApiKey()`, `getStoredMetadata()`, `clearStoredAuth()`
   - Keep only `isValidApiKeyFormat()` for validation

2. **`lib/pollen-auth/constants.ts`** — Remove localStorage keys
   - Remove `STORAGE_KEY`
   - Remove `STORAGE_AUTHORIZED_AT_KEY`

3. **`lib/pollen-auth/context.tsx`** — Simplify to use Convex only
   ```typescript
   // BEFORE (current)
   const loadAuthState = useCallback(() => {
     const apiKey = getStoredApiKey();  // From localStorage
     // ...
   }, []);
   
   // AFTER (proposed)
   // Remove loadAuthState entirely
   // Derive state directly from serverApiKey query
   ```

4. **`app/auth/pollinations/callback/page.tsx`** — Remove localStorage write
   ```typescript
   // BEFORE (current)
   const stored = storeApiKey(apiKey);  // Write to localStorage
   setApiKey({ apiKey });                // Write to Convex
   
   // AFTER (proposed)
   await setApiKey({ apiKey });          // Write to Convex only
   ```

5. **`lib/pollen-auth/index.ts`** — Update exports
   - Remove storage utility exports

6. **Tests** — Update all tests that mock localStorage

---

### Option B: Keep localStorage as Cache (Current State)

If we decide the current architecture is acceptable:

**Benefits:**
- Instant load from localStorage
- Works if Convex query is slow

**Trade-offs:**
- Maintains complexity
- Sync bugs possible

**If keeping, add this cleanup:**
- Add comments explaining the dual-storage architecture
- Document the sync direction (Convex → localStorage on new device)

---

## Security Consideration

### Current State
- **localStorage:** Plain-text `sk_xxx` key visible in browser DevTools
- **Convex:** AES-256-GCM encrypted key

### After Option A
- **localStorage:** Nothing stored
- **Convex:** AES-256-GCM encrypted key
- **In-memory:** Key exists in React state only during session

**Option A improves security** by eliminating plain-text storage.

---

## Decision Required

| Option | Effort | Security | Complexity | Recommendation |
|--------|--------|----------|------------|----------------|
| **A: Remove localStorage** | Medium | Better | Simpler | ✅ Recommended |
| **B: Keep as-is** | None | Current | Current | Acceptable |

---

## Implementation Plan (If Option A)

### Phase 1: Remove localStorage from Auth Flow

1. Update `context.tsx` to derive state from `serverApiKey` query only
2. Update callback page to only call Convex mutation
3. Remove localStorage read/write calls

### Phase 2: Cleanup

1. Delete `storage.ts` or reduce to validation-only
2. Remove storage constants
3. Update tests
4. Update documentation comments

### Phase 3: Verify

1. Test fresh OAuth flow
2. Test cross-device login
3. Test disconnect/reconnect
4. Test generation with new architecture

---

## Test Scenarios (If Option A)

| Scenario | Expected Behavior |
|----------|-------------------|
| User connects via OAuth | Key saved to Convex only, context updates reactively |
| User refreshes page | Key loaded from Convex query |
| User logs in on new device | Key loaded from Convex query (same as refresh) |
| User disconnects | Key removed from Convex, context updates reactively |
| User generates image | Key read from context (sourced from Convex) |
| Convex query loading | Show loading state, don't allow generation |

---

## Questions

1. **Is the slight latency of Convex query acceptable vs instant localStorage?**
   - Generation already requires network, so likely yes

2. **Do we need offline capability for auth state?**
   - No — can't generate offline anyway

3. **Timeline for this cleanup?**
   - Not urgent, current implementation works
   - Can be done opportunistically

---

## Appendix: Current File Inventory

Files that use localStorage for auth:

| File | Usage | Action (Option A) |
|------|-------|-------------------|
| `lib/pollen-auth/storage.ts` | All localStorage operations | Delete or minimize |
| `lib/pollen-auth/storage.test.ts` | Tests for above | Delete |
| `lib/pollen-auth/constants.ts` | Storage key names | Remove keys |
| `lib/pollen-auth/context.tsx` | Reads/writes via storage utils | Simplify |
| `lib/pollen-auth/context.test.tsx` | Tests with localStorage mocks | Update |
| `lib/pollen-auth/hooks.test.tsx` | Tests with localStorage mocks | Update |
| `app/auth/pollinations/callback/page.tsx` | Writes to localStorage | Remove write |