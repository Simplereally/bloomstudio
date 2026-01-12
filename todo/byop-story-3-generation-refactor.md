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
- [ ] **`convex/singleGeneration.ts`**:
  - Update `startGeneration` mutation to accept `apiKey: string` argument.
  - Pass this `apiKey` to the `singleGenerationProcessor` action.
- [ ] **`convex/batchGeneration.ts`**:
  - Update `startBatchGeneration` mutation to accept `apiKey: string` argument.
  - Pass this `apiKey` to the `batchProcessor` action.

### 2. Convex Action Updates
- [ ] **`convex/singleGenerationProcessor.ts`**:
  - Remove calls to `getEncryptedApiKeyByClerkId`.
  - Remove `decryptApiKey` logic.
  - Update handler to use the passed `apiKey` argument for the Pollinations request.
  - Add validation: Ensure `apiKey` is present and valid format.
- [ ] **`convex/batchProcessor.ts`**:
  - Perform similar refactoring as `singleGenerationProcessor`.
  - **Decision**: For now, pass the key from the mutation. (If batch processing is long-running, verify if passing key once is sufficient or if temporary storage is needed. Proceed with passing as arg for MVP).

### 3. Client Hook Updates
- [ ] **`hooks/queries/use-generate-image.ts`**:
  - Consume `usePollenAuth` context.
  - Pass `apiKey` from context into the `startGeneration` mutation call.
  - Handle case where `apiKey` is missing (trigger auth flow).
- [ ] **`hooks/use-batch-mode.ts`**:
  - Consume `usePollenAuth` context.
  - Pass `apiKey` from context into the `startBatchGeneration` mutation call.

## Technical Details
- **Backward Compatibility**: (Optional) If supporting migration, logic might need to accept `apiKey` OR fall back to DB key if `apiKey` arg is null. See Story 4 for cleanup. For this story, focus on wiring the new path.

## Acceptance Criteria
- [ ] Single image generation works using the key from localStorage.
- [ ] Batch generation works using the key from localStorage.
- [ ] Server no longer errors if the user has no key in the `users` table (provided they send one from client).
