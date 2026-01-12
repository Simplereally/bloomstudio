# Story 4: Cleanup and Security
Master document for this initiative: `todo\byop-pollinations-auth-refactor.md`.

## Description
Clean up the codebase by removing deprecated key storage logic and enhancing security. This ensures that API keys are strictly client-side and that the application is secure against standard web vulnerabilities.

## Goals
- Remove encryption handling and server-side key storage.
- Update the database schema to reflect the new auth model.
- Perform a security audit of the implementation.

## Implementation Tasks

### 1. Schema Migration
- [ ] **`convex/schema.ts`**:
  - Deprecate/Remove `pollinationsApiKey`.
  - Add optional metadata fields (if decided to track auth status):
    - `pollinationsAuthorizedAt`: v.number()
    - `pollinationsAuthExpiry`: v.number()
- [ ] **`convex/users.ts`**:
  - Remove mutations/queries related to setting/getting the encrypted API key.

### 2. Code Removal
- [ ] **`lib/encryption.ts`**: Remove file (no longer needed).
- [ ] **`app/api/user/api-key/`**: Remove route.
- [ ] **`app/api/user/balance/route.ts`**: Refactor to accept key in headers or body, or move balance check to client-side/Convex action using the passed key.

### 3. Migration (Soft Launch)
- [ ] Create a strategy for existing users:
  - If they have a stored key, prompt them to "Connect" to switch to BYOP.
  - Once connected, allow a clean break from the old key.

### 4. Security Audit
- [ ] Verify **no** API keys are being logged on the server.
- [ ] Verify keys are not stored in Convex database.
- [ ] Ensure `localStorage` usage is robust.
- [ ] Check CSP (Content Security Policy) headers if applicable to prevent XSS.
- [ ] Test revocation: Revoking access in Pollinations should result in 401/403, handled gracefully by the app.

## Acceptance Criteria
- [ ] Database schema is clean of `pollinationsApiKey` (or strictly unused).
- [ ] No server-side code attempts to encrypt/decrypt keys.
- [ ] Balance check functionality works with the new flow.
- [ ] Security audit checklist passed.
