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
- [ ] Modify **`components/studio/api-key-onboarding-modal.tsx`**:
  - Remove text input for manual key entry.
  - Add primary "Connect with Pollinations" button (calls `authorize()` from `usePollenAuth`).
  - Add "Enter Manually" fallback link (optional/hidden by default).
  - Update copy to highlight "Zero API Costs" and "One-click setup".
  - Retain "Upgrade/Star" screen post-authorization if applicable.

### 2. Settings Page Update
- [ ] Modify **`components/settings/api-card.tsx`**:
  - Consume `usePollenAuth` hook.
  - State: Show "Connected", "Not Connected", or "Expiring Soon".
  - Actions: Add "Disconnect" (logout) and "Reconnect" buttons.
  - Display: Show countdown to expiration (e.g., "Expires in 25 days").

### 3. Re-authorization UI Components
Create reusable components in `components/pollen-auth/`:
- [ ] **`components/pollen-auth/connect-button.tsx`**: Standardized button for initiating auth.
- [ ] **`components/pollen-auth/expiry-banner.tsx`**: Banner component to warn user when `isExpiringSoon` is true (7 days).
- [ ] **`components/pollen-auth/reconnect-modal.tsx`**: Modal forcing re-auth when key is expired/revoked.

### 4. Integration
- [ ] Place `ExpiryBanner` in the global layout or Studio view, visible only when relevant.

## UX Considerations
- **Just-in-Time Auth**: Do not block the user unless necessary.
- **Transparency**: Clearly indicate that the connection is temporary (30 days) and requires renewal.

## Acceptance Criteria
- [ ] Clicking "Connect" in onboarding redirects to Pollinations.
- [ ] Returning from Pollinations updates the UI to "Connected" state.
- [ ] Settings page correctly shows expiration status.
- [ ] Manually expiring the key in localStorage triggers the Expiry Banner.
