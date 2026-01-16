# Requirements Document

## Introduction

This feature adds a Pollen Balance Display component to the application header, allowing authenticated users to see their current Pollinations account balance in real-time. The balance is fetched directly from the Pollinations API (`/account/balance`) using the user's stored BYOP (Bring Your Own Pollen) API key. The display updates automatically after image generation events to reflect balance changes as quickly as possible.

## Glossary

- **Pollen_Balance_Display**: The UI component showing the user's current Pollinations balance in the header
- **Balance_Service**: The client-side service responsible for fetching balance data from the Pollinations API
- **BYOP_API_Key**: The user's Pollinations API key stored in localStorage via the existing PollenAuth system
- **Generation_Event**: Any single image or batch image generation that consumes pollen balance
- **Pollinations_API**: The external Pollinations API at `gen.pollinations.ai`

## Requirements

### Requirement 1: Display Pollen Balance in Header

**User Story:** As an authenticated user, I want to see my current Pollen balance in the application header, so that I can monitor my available credits while using the application.

#### Acceptance Criteria

1. WHEN an authenticated user with a valid BYOP_API_Key views any page with the header, THE Pollen_Balance_Display SHALL display the current balance from the Pollinations API
2. WHILE the balance is being fetched, THE Pollen_Balance_Display SHALL show a loading skeleton indicator
3. IF the balance fetch fails, THEN THE Pollen_Balance_Display SHALL display an error state with a retry option
4. WHEN the user is not authenticated or has no BYOP_API_Key, THE Pollen_Balance_Display SHALL not be rendered
5. THE Pollen_Balance_Display SHALL be positioned near the Clerk profile button and settings cogwheel in the header

### Requirement 2: Fetch Balance from Pollinations API

**User Story:** As a developer, I want the balance to be fetched directly from the Pollinations API without syncing to Convex, so that the balance is always current and we avoid complex state synchronization.

#### Acceptance Criteria

1. WHEN fetching balance, THE Balance_Service SHALL call the Pollinations API endpoint `GET /account/balance` with the Authorization header containing the BYOP_API_Key
2. THE Balance_Service SHALL parse the response and extract the balance value
3. IF the API returns a 401 Unauthorized response, THEN THE Balance_Service SHALL indicate the API key is invalid
4. IF the API returns a 403 Forbidden response, THEN THE Balance_Service SHALL indicate the API key lacks the `account:balance` permission
5. THE Balance_Service SHALL handle network errors gracefully and provide appropriate error states

### Requirement 3: Update Balance After Generation Events

**User Story:** As a user, I want my balance to update after I generate images, so that I can see my remaining credits without manually refreshing.

#### Acceptance Criteria

1. WHEN a single image generation completes (success or failure), THE Balance_Service SHALL trigger a balance refresh
2. WHEN a batch generation item completes, THE Balance_Service SHALL trigger a balance refresh
3. THE Balance_Service SHALL implement a debounce mechanism to prevent excessive API calls during rapid generation events
4. THE Balance_Service SHALL use a minimum refresh interval to avoid rate limiting from the Pollinations API

### Requirement 4: Balance Display Formatting

**User Story:** As a user, I want the balance to be displayed in a clear, readable format, so that I can quickly understand my available credits.

#### Acceptance Criteria

1. THE Pollen_Balance_Display SHALL format the balance as a numeric value with appropriate decimal places
2. THE Pollen_Balance_Display SHALL include a visual indicator (icon or label) identifying it as the Pollen balance
3. THE Pollen_Balance_Display SHALL use consistent styling with other header elements (subscription badge, settings)
4. WHEN the balance is low (configurable threshold), THE Pollen_Balance_Display SHALL provide a visual warning indicator

### Requirement 5: Manual Balance Refresh

**User Story:** As a user, I want to manually refresh my balance, so that I can verify my current credits at any time.

#### Acceptance Criteria

1. THE Pollen_Balance_Display SHALL provide a clickable/tappable area or button to trigger a manual refresh
2. WHILE a manual refresh is in progress, THE Pollen_Balance_Display SHALL show a loading indicator
3. WHEN a manual refresh completes, THE Pollen_Balance_Display SHALL update with the new balance value
