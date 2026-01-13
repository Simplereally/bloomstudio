# Story 3: Generation Flow Refactor
Master document for this initiative: `todo\byop-pollinations-auth-refactor.md`.

## Description
Refactor the image generation pipeline to support the BYOP flow. This fundamentally changes how the API key is accessed: instead of the server fetching a stored encrypted key, the client will pass its ephemeral key with the request.

## Goals
- Update Convex architecture to accept API keys as arguments.
- Remove server-side dependencies on stored API keys.
- Ensure both Single and Batch generation modes work with the client-provided key.

## Implementation Tasks

### 1. Convex Mutation Updates
- [x] **`convex/singleGeneration.ts`**:
  - Update `startGeneration` mutation to accept `apiKey: string` argument.
  - Pass this `apiKey` to the `singleGenerationProcessor` action.
- [x] **`convex/batchGeneration.ts`**:
  - Update `startBatchJob` mutation to accept `apiKey: string` argument.
  - Store `apiKey` in batch job record for processor actions to access.

### 2. Convex Action Updates
- [x] **`convex/singleGenerationProcessor.ts`**:
  - Remove calls to `getEncryptedApiKeyByClerkId`.
  - Remove `decryptApiKey` logic.
  - Update handler to use the passed `apiKey` argument for the Pollinations request.
  - Add validation: Ensure `apiKey` is present and valid format.
- [x] **`convex/batchProcessor.ts`**:
  - Remove calls to `getEncryptedApiKeyByClerkId`.
  - Remove `decryptApiKey` logic.
  - Read API key from batch job record stored during job creation.
  - Add validation: Ensure `apiKey` is present and valid format.

### 3. Client Hook Updates
- [x] **`hooks/queries/use-generate-image.ts`**:
  - Consume `usePollenApiKey` and `usePollenAuthActions` from pollen-auth context.
  - Pass `apiKey` from context into the `startGeneration` mutation call.
  - Handle case where `apiKey` is missing (trigger auth flow).
- [x] **`hooks/use-batch-mode.ts`**:
  - Consume `usePollenApiKey` and `usePollenAuthActions` from pollen-auth context.
  - Pass `apiKey` from context into the `startBatch` function call.
  - Handle case where `apiKey` is missing (trigger auth flow with error toast).
- [x] **`hooks/queries/use-batch-generation.ts`**:
  - Updated `startBatch` signature to accept `apiKey` parameter.
  - Pass `apiKey` to the Convex mutation.

### 4. Schema Updates
- [x] **`convex/schema.ts`**:
  - Added `apiKey: v.optional(v.string())` field to `batchJobs` table for storing the API key during batch processing.

### 5. Test Updates
- [x] **`hooks/queries/use-generate-image.test.tsx`**:
  - Added mock for pollen-auth hooks.
  - Updated assertions to include `apiKey` in expected mutation calls.
- [x] **`hooks/use-batch-mode.test.ts`**:
  - Added mock for pollen-auth hooks.

### 6. Additional Updates
- [x] **`components/debug/limit-tester.tsx`**:
  - Updated to use BYOP context for API key.

## Technical Details
- **Backward Compatibility**: The schema field `apiKey` on `batchJobs` is optional (`v.optional`) to support migration. Story 4 will handle cleanup of legacy key storage.
- **Batch Processing**: For batch jobs, the API key is stored in the batch job record when the job starts. All processor actions read from this record, ensuring the key is available for long-running batches even after the initiating client disconnects.
- **Nuke on Complete**: Implemented strict data retention policy where batch job records (containing the API key) are deleted immediately upon completion, cancellation, or failure. This ensures API keys are not stored longer than necessary and keeps the database clean.

## Acceptance Criteria
- [x] Single image generation works using the key from localStorage (via BYOP context).
- [x] Batch generation works using the key from localStorage (via BYOP context).
- [x] Server no longer errors if the user has no key in the `users` table (provided they send one from client).
