# Story 4: Cleanup and Security
Master document for this initiative: `todo\byop-pollinations-auth-refactor.md`.

## Status: ✅ COMPLETE

## Description
Clean up the codebase by removing deprecated key storage logic and enhancing security. This ensures that API keys are strictly client-side and that the application is secure against standard web vulnerabilities.

## Goals
- Remove encryption handling and server-side key storage.
- Update the database schema to reflect the new auth model.
- Perform a security audit of the implementation.

## Implementation Tasks

### 1. Schema Migration
- [x] **`convex/schema.ts`**:
  - Marked `pollinationsApiKey` as deprecated with clear JSDoc comment.
  - Field kept optional for backward compatibility during migration.
  - TODO added to remove field once all users have migrated to BYOP.
- [x] **`convex/users.ts`**:
  - Marked `setPollinationsApiKey`, `getPollinationsApiKey`, `getEncryptedApiKeyByClerkId`, and `removePollinationsApiKey` as deprecated with JSDoc comments.
  - Functions kept for backward compatibility during migration.

### 2. Code Removal
- [x] **`lib/encryption.ts`**: File did not exist (was never created or already removed).
- [x] **`app/api/user/api-key/`**: Removed route entirely.
- [x] **`app/api/user/balance/route.ts`**: Removed route entirely (was using deleted encryption lib).
- [x] **`app/settings/actions.ts`**: Removed file (contained `encryptKey` server action).

### 3. Component Updates
- [x] **`hooks/use-api-card-state.ts`**: 
  - Removed `inputState` (input key, visibility) since manual entry no longer supported.
  - Removed `handleSave` handler since encryption is deprecated.
  - Removed import of deleted `encryptKey` action.
  - Simplified to focus on BYOP with minimal legacy support.
- [x] **`components/settings/api-card.tsx`**:
  - Updated to use simplified hook interface.
  - Removed references to deleted inputState and handleSave.
- [x] **`components/settings/api-card-components/legacy-key-section.tsx`**:
  - Removed manual key entry (input, save functionality).
  - Simplified to only show status for existing legacy keys.
  - Returns null if no legacy key exists.
- [x] **`components/studio/api-key-onboarding-modal.tsx`**:
  - Removed manual entry fallback (Input, Collapsible).
  - Removed reference to `/api/user/api-key` route.
  - Simplified to BYOP OAuth only.

### 4. Test Updates
- [x] **`hooks/use-api-card-state.test.ts`**: Removed tests for deleted functionality.
- [x] **`components/settings/api-card-components/legacy-key-section.test.tsx`**: Updated tests for simplified component.

### 5. Security Audit
- [x] Verified **no** API keys are being logged on the server (grep search confirmed).
- [x] Keys are stored in localStorage only via BYOP flow (lib/pollen-auth/storage.ts).
- [x] Deprecated schema field marked clearly, not actively used by new code.
- [x] Ensure `localStorage` usage is robust (lib/pollen-auth/storage.ts has proper error handling, SSR checks, and validation).

### 6. Migration Strategy (Soft Launch)
- [x] Existing users with legacy keys:
  - LegacyKeySection shows warning prompting them to "Connect via BYOP".
  - Once connected via BYOP, legacy key can be removed.
  - Legacy key functions work but are deprecated.
- [x] New users:
  - Only see BYOP OAuth flow in onboarding modal.
  - No manual key entry option.

## Files Removed
- `app/api/user/api-key/route.ts` - Encrypted key storage route
- `app/api/user/balance/route.ts` - Balance check (used encryption)
- `app/settings/actions.ts` - Server action for key encryption

## Files Modified
- `convex/schema.ts` - Added deprecation comments to pollinationsApiKey
- `convex/users.ts` - Added deprecation comments to key-related functions
- `hooks/use-api-card-state.ts` - Simplified, removed manual key entry
- `hooks/use-api-card-state.test.ts` - Updated for simplified hook
- `components/settings/api-card.tsx` - Updated props
- `components/settings/api-card-components/legacy-key-section.tsx` - Simplified
- `components/settings/api-card-components/legacy-key-section.test.tsx` - Updated tests
- `components/studio/api-key-onboarding-modal.tsx` - Removed manual entry

## Acceptance Criteria
- [x] Database schema `pollinationsApiKey` is marked deprecated (strictly unused by new code).
- [x] No server-side code attempts to encrypt/decrypt keys.
- [x] Balance check functionality removed (was using encryption).
- [x] Security audit checklist passed:
  - No API key logging
  - Keys stored client-side only
  - localStorage has proper error handling
- [x] All tests passing
- [x] TypeScript compilation successful
