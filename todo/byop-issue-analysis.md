# BYOP Issue Analysis: Legacy Key "Active" State Persistence

This document outlines the investigation into why the settings page continues to display the "Legacy API Key" as "Active" despite a successful BYOP OAuth completion.

## Root Cause Analysis

The primary issue is a **state synchronization failure** between the OAuth callback handler and the global authentication context.

### 1. Context Does Not Update on Local Changes
- The application uses `PollenAuthProvider` (in `lib/pollen-auth/context.tsx`) to manage authentication state.
- This provider initializes its state on mount and listens for the `storage` event to detect changes.
- **Critical limitation**: The `storage` event is *only* fired when `localStorage` is modified in *another* tab or window. It does **not** fire for changes made in the same window/tab.

### 2. Callback Handler bypasses Context
- The `CallbackPage` (`app/auth/pollinations/callback/page.tsx`) uses the `storeApiKey` utility function to write the new key directly to `localStorage`.
- Because the user is redirected back to the app within the same window (SPA navigation), the `PollenAuthProvider` (which persists at the layout root) is never notified that the storage has changed.
- Consequently, the provider's state remains stale (showing `isAuthorized: false`), and it continues to rely on the legacy key which it loaded on initial mount.

### 3. UI Fallback Logic
- `useApiCardState` (`hooks/use-api-card-state.ts`) determines the status badge by checking `byopState.isConnected` first, then falling back to `legacyState.hasLegacyKey`.
- Since `byopState.isConnected` is false (due to the stale context), the logic falls back to `legacy-active`, causing the badge to display "Active".

### 4. Misleading Hardcoded Text
- In `LegacyKeySection` (`components/settings/api-card-components/legacy-key-section.tsx`), the button text is **hardcoded**:
  ```tsx
  <span>Legacy API Key (active)</span>
  ```
- Even if the state synchronization were fixed, this label would likely still say "(active)" unless explicitly updated to handle the "BYOP Connected" state dynamically.

## Findings Breakdown

| Component | File Path | Issue |
| :--- | :--- | :--- |
| **PollenAuthProvider** | `lib/pollen-auth/context.tsx` | Only listens to `window.addEventListener("storage", ...)` which misses same-tab updates. |
| **Callback Handler** | `app/auth/pollinations/callback/page.tsx` | Writes to storage but fails to call `refreshAuthState()` from the context to update the app state. |
| **Legacy Key UI** | `.../legacy-key-section.tsx` | The label "(active)" is hardcoded and does not reflect whether the key is actually being overridden by BYOP. |

## Recommended Fixes

To resolve this, the following changes will be required:

### 1. Update Callback Page
- Modify `app/auth/pollinations/callback/page.tsx` to include the `usePollenAuthActions` hook.
- Call `refreshAuthState()` immediately after `storeApiKey()` succeeds. This will force the Provider to reload the new key from `localStorage`.

### 2. Update Legacy UI Label
- Modify `components/settings/api-card-components/legacy-key-section.tsx` to conditionally render the "(active)" text. 
- Example Code Change:
  ```tsx
  <span>Legacy API Key {isByopConnected ? "(Inactive)" : "(Active)"}</span>
  ```

### 3. (Optional) Service Robustness
- Consider dispatching a custom `Event` inside `storeApiKey` that `PollenAuthProvider` listens to. This ensures that any direct storage writes (even those outside of React components) trigger a state refresh, preventing this class of bug in the future.

---

## ✅ Resolution (2026-01-12)

This issue has been resolved with the following changes:

### Implemented Fixes

1. **Custom Event Pattern (Robustness First Approach)**
   Instead of trying to call `refreshAuthState()` from the callback page (which has timing issues with navigation), we implemented a more robust solution using custom events:
   
   - **`lib/pollen-auth/storage.ts`**: Added `POLLEN_AUTH_CHANGED_EVENT` constant and a `dispatchAuthChangedEvent()` function. This event is dispatched whenever `storeApiKey()` or `clearStoredAuth()` successfully modifies localStorage.
   
   - **`lib/pollen-auth/context.tsx`**: The `PollenAuthProvider` now listens for both the native `storage` event (for cross-tab sync) AND the custom `pollen-auth-changed` event (for same-tab sync). This ensures the context updates regardless of where storage is modified.

2. **Dynamic Legacy Key Label**
   - **`components/settings/api-card-components/legacy-key-section.tsx`**: The label now dynamically shows "(active)" or "(inactive)" based on the `isByopConnected` prop.
   - Updated tests to verify both states.

### Why This Approach Over the Original Recommendation

The original Fix #1 suggested calling `refreshAuthState()` from the callback page. However, this approach has issues:
- The callback page uses `router.push()` for navigation, and calling a context method just before navigation has timing complications
- The fix would only work for this specific code path, not for any future code that might write to storage

The custom event pattern (originally suggested as optional Fix #3) is more robust because:
- It works for ALL storage writes, not just the callback page
- It decouples the storage layer from React components
- It prevents this class of bug from occurring in other future code paths

