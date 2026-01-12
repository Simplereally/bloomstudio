# Story 2: BYOP UI Integration
Master document for this initiative: `todo\byop-pollinations-auth-refactor.md`.

## Description
Integrate the BYOP authentication flow into the user interface. This replaces the manual API key entry with a seamless "Connect" flow and updates the settings management to reflect the new authentication state.

## Goals
- Replace the legacy "API Key Onboarding" modal with a BYOP-centric design.
- Update the API settings card to manage the BYOP connection.
- Add visual indicators for key expiration and re-authorization.

## Implementation Tasks

### 1. Onboarding Modal Refactor
- [x] Modify **`components/studio/api-key-onboarding-modal.tsx`**:
  - Remove text input for manual key entry (moved to collapsible fallback).
  - Add primary "Connect with Pollinations" button (calls `authorize()` from `usePollenAuth`).
  - Add "Enter Manually" fallback link (hidden by default in collapsible).
  - Update copy to highlight "Zero API Costs" and "One-click setup".
  - Retain "Upgrade/Star" screen post-authorization if applicable.

### 2. Settings Page Update
- [x] Modify **`components/settings/api-card.tsx`**:
  - Consume `usePollenAuth` hook.
  - State: Show "Connected", "Not Connected", or "Expiring Soon".
  - Actions: Add "Disconnect" (logout) and "Reconnect" buttons.
  - Display: Show countdown to expiration (e.g., "Expires in 25 days").

### 3. Re-authorization UI Components
Create reusable components in `components/pollen-auth/`:
- [x] **`components/pollen-auth/connect-button.tsx`**: Standardized button for initiating auth.
- [x] **`components/pollen-auth/expiry-banner.tsx`**: Banner component to warn user when `isExpiringSoon` is true (7 days).
- [x] **`components/pollen-auth/reconnect-modal.tsx`**: Modal forcing re-auth when key is expired/revoked.

### 4. Integration
- [x] Place `ExpiryBanner` in the global layout or Studio view, visible only when relevant.

## UX Considerations
- **Just-in-Time Auth**: Do not block the user unless necessary.
- **Transparency**: Clearly indicate that the connection is temporary (30 days) and requires renewal.

## Acceptance Criteria
- [x] Clicking "Connect" in onboarding redirects to Pollinations.
- [x] Returning from Pollinations updates the UI to "Connected" state.
- [x] Settings page correctly shows expiration status.
- [x] Manually expiring the key in localStorage triggers the Expiry Banner.

## Test Coverage
- [x] `components/pollen-auth/connect-button.test.tsx` - 8 tests
- [x] `components/pollen-auth/expiry-banner.test.tsx` - 11 tests  
- [x] `components/pollen-auth/reconnect-modal.test.tsx` - 7 tests

## Post-Implementation Refactoring

### Hooks Extracted
- [x] `hooks/use-api-card-state.ts` - Manages all state and handlers for the API card component
- [x] `hooks/use-expiry-banner-state.ts` - Manages dismissed state with sessionStorage persistence

### Components Split
The `api-card.tsx` component (494 lines) was refactored into smaller, focused components in `components/settings/api-card-components/`:
- [x] `connection-status-badge.tsx` - Status badge rendering for all connection states
- [x] `byop-connected-section.tsx` - Connected state with expiry countdown and actions
- [x] `byop-expired-section.tsx` - Expired state with reconnect prompt
- [x] `not-connected-section.tsx` - Initial not-connected state
- [x] `expiring-soon-warning.tsx` - Warning alert for expiring connections
- [x] `legacy-key-section.tsx` - Collapsible legacy API key entry section

### Additional Test Coverage
- [x] `hooks/use-api-card-state.test.ts` - 15 tests
- [x] `hooks/use-expiry-banner-state.test.ts` - 15 tests
- [x] `components/settings/api-card-components/connection-status-badge.test.tsx` - 6 tests
- [x] `components/settings/api-card-components/byop-connected-section.test.tsx` - 7 tests
- [x] `components/settings/api-card-components/byop-expired-section.test.tsx` - 3 tests
- [x] `components/settings/api-card-components/not-connected-section.test.tsx` - 3 tests
- [x] `components/settings/api-card-components/expiring-soon-warning.test.tsx` - 3 tests
- [x] `components/settings/api-card-components/legacy-key-section.test.tsx` - 12 tests
