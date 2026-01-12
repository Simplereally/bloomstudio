# Story 1: Core BYOP Infrastructure
Master document for this initiative: `todo\byop-pollinations-auth-refactor.md`.

## Status: ✅ COMPLETE

## Description
Establish the foundational infrastructure for "Bring Your Own Pollen" (BYOP) authentication. This involves creating the client-side authentication context, storage utilities, and the OAuth callback handler to securely manage Pollinations API keys in the browser.

## Goals
- Enable storing and retrieving the API key from `localStorage`.
- Implement the OAuth callback flow to extract the key from the URL hash.
- Expose authentication state (isAuthorized, expiry, etc.) via a React Context.

## Implementation Tasks

### 1. Pollen Auth Module
Create the following files in `lib/pollen-auth/`:
- [x] **`lib/pollen-auth/constants.ts`**: Define constants like `STORAGE_KEY`, `EXPIRY_DAYS` (30), `EXPIRING_SOON_THRESHOLD_DAYS` (7), and the Pollinations Auth URL.
- [x] **`lib/pollen-auth/storage.ts`**: Implement `localStorage` wrappers for setting/getting the API key and metadata (authorizedAt, expiry).
- [x] **`lib/pollen-auth/context.tsx`**: Create `PollenAuthProvider` and context definition.
  - State: `apiKey`, `isAuthorized`, `expiresAt`, `daysUntilExpiry`, `isExpiringSoon`.
  - Actions: `authorize()` (redirects), `deauthorize()` (clears storage).
- [x] **`lib/pollen-auth/hooks.ts`**: Export `usePollenAuth` hook consuming the context.
- [x] **`lib/pollen-auth/index.ts`**: Barrel export for all module exports.

### 2. OAuth Callback Handler
- [x] Create **`app/auth/pollinations/callback/page.tsx`**:
  - Route component to handle the redirect from Pollinations.
  - Logic: Parse `location.hash` to extract `api_key`.
  - Action: Validate key (basic check), store in `localStorage` using `storage.ts`.
  - Redirect: Send user back to the Studio or previous page.
  - Error Handling: Handle missing keys or errors in hash.

### 3. Application Integration
- [x] Wrap the application (or Studio layout) with `PollenAuthProvider` in **`app/layout.tsx`** or **`components/providers/`**.
- [x] **`components/providers/pollen-auth-provider.tsx`**: Re-export for provider pattern.
- [x] **`components/providers/index.ts`**: Updated barrel exports.

### 4. Testing
- [x] **`lib/pollen-auth/constants.test.ts`**: Tests for constants and URL builders.
- [x] **`lib/pollen-auth/storage.test.ts`**: Tests for localStorage utilities.
- [x] **`lib/pollen-auth/context.test.tsx`**: Tests for PollenAuthProvider context.
- [x] **`lib/pollen-auth/hooks.test.tsx`**: Tests for hooks.

## Technical Details
- **Auth URL**: `https://enter.pollinations.ai/authorize?redirect_url=https://yourapp.com`
- **Callback Format**: `https://yourapp.com#api_key=sk_abc123` (Note: Hash fragment).
- **Security**: Key must **only** be stored in `localStorage`. Do not send to server in this story.

## Acceptance Criteria
- [x] `usePollenAuth` hook returns correct state when key is manually placed in localStorage.
- [x] Visiting the `/auth/pollinations/callback#api_key=test` URL correctly stores the key and redirects.
- [x] "Authorize" action redirects user to Pollinations.

## Files Created/Modified

### New Files
- `lib/pollen-auth/constants.ts` - BYOP configuration constants
- `lib/pollen-auth/storage.ts` - localStorage utilities
- `lib/pollen-auth/context.tsx` - PollenAuthProvider and context
- `lib/pollen-auth/hooks.ts` - React hooks for auth consumption
- `lib/pollen-auth/index.ts` - Barrel exports
- `lib/pollen-auth/constants.test.ts` - Tests
- `lib/pollen-auth/storage.test.ts` - Tests
- `lib/pollen-auth/context.test.tsx` - Tests
- `lib/pollen-auth/hooks.test.tsx` - Tests
- `app/auth/pollinations/callback/page.tsx` - OAuth callback handler
- `components/providers/pollen-auth-provider.tsx` - Provider re-export

### Modified Files
- `app/layout.tsx` - Added PollenAuthProvider wrapping
- `components/providers/index.ts` - Added new export

## Test Results
All 44 tests passing:
- constants.test.ts: ✅
- storage.test.ts: ✅
- context.test.tsx: ✅
- hooks.test.tsx: ✅
