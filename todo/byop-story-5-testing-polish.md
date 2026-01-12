# Story 5: Testing and Polish
Master document for this initiative: `todo\byop-pollinations-auth-refactor.md`.

## Description
Ensure the reliability and user experience of the new BYOP system through comprehensive testing and UI/UX polishing.

## Goals
- Validate the entire flow with automated and manual tests.
- Refine the user interface for a premium feel.
- Handle edge cases gracefully.

## Implementation Tasks

### 1. Testing
- [ ] **Unit Tests**:
  - Test `usePollenAuth` hook logic (expiry calculations, storage interaction).
  - Test integration of `apiKey` in `useGenerateImage` hook.
- [ ] **Integration/E2E Tests** (if applicable):
  - Mock the Pollinations OAuth redirect.
  - Verify the full "Connect -> Generate -> Expiry" loop.
  - Test re-authorization flow.

### 2. UX Polish
- [ ] **Loading States**: Ensure "Connecting..." states are visible and smooth.
- [ ] **Transitions**: Add animations for the Connect/Disconnect button state changes.
- [ ] **Error Handling**:
  - Test 401 scenarios (Key invalid/expired). Ensure the Re-auth modal appears correctly.
  - Test 403 scenarios (Insufficient balance).
- [ ] **Toasts**: Add success notifications ("Connected to Pollinations successfully!").

### 3. Edge Cases
- [ ] Handle "Access Denied" if user cancels OAuth flow.
- [ ] Handle "Network Error" during key validation.

## Acceptance Criteria
- [ ] All new components have basic test coverage.
- [ ] The "Happy Path" (Connect -> Generate) is frictionless.
- [ ] The "Unhappy Path" (Expired Key -> Re-auth) is intuitive and does not result in app crashes or undefined states.
- [ ] UI meets the "Premium Design" standard (smooth, responsive).
