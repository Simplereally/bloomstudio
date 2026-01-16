# Implementation Plan: Pollen Balance Display

## Overview

This implementation plan creates a Pollen Balance Display component for the application header. The approach follows the existing codebase patterns: service layer for API calls, TanStack Query for data fetching, custom hooks for logic, and container/view component separation.

## Tasks

- [x] 1. Create balance service for Pollinations API
  - [x] 1.1 Create `lib/pollen-auth/balance-service.ts` with types and fetch function
    - Define `PollenBalanceResponse`, `BalanceErrorCode`, and `BalanceError` interfaces
    - Implement `fetchPollenBalance(apiKey: string)` function
    - Handle 401, 403, and network errors with appropriate error codes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 1.2 Write property test for API request construction
    - **Property 1: API Request Construction**
    - **Validates: Requirements 2.1**
  - [x] 1.3 Write property test for response parsing
    - **Property 2: Response Parsing Round-Trip**
    - **Validates: Requirements 2.2**
  - [x] 1.4 Write unit tests for error handling
    - Test 401 returns UNAUTHORIZED error
    - Test 403 returns FORBIDDEN error
    - Test network failure returns NETWORK_ERROR
    - _Requirements: 2.3, 2.4, 2.5_

- [x] 2. Extend query keys with pollen balance
  - [x] 2.1 Add `pollen` namespace to `lib/query/query-keys.ts`
    - Add `pollen.all`, `pollen.balance()`, `pollen.profile()`, `pollen.usage()` keys
    - Add `allPollen` to invalidation patterns
    - _Requirements: 3.1, 3.2_

- [x] 3. Create usePollenBalance hook
  - [x] 3.1 Create `hooks/use-pollen-balance.ts` with TanStack Query integration
    - Implement `UsePollenBalanceReturn` interface
    - Use `usePollenAuth` for API key access
    - Configure query with infinite retry and exponential backoff (capped at 60s)
    - Implement `invalidateBalance` for post-generation refresh
    - Implement `formatBalance` helper function
    - Implement `isLowBalance` threshold check
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.4_
  - [x] 3.2 Write property test for balance formatting
    - **Property 4: Balance Formatting**
    - **Validates: Requirements 4.1**
  - [x] 3.3 Write property test for low balance threshold
    - **Property 5: Low Balance Threshold Detection**
    - **Validates: Requirements 4.4**
  - [x] 3.4 Write unit tests for hook behavior
    - Test loading state
    - Test successful fetch
    - Test error states
    - Test disabled when not authorized
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Checkpoint - Ensure service and hook tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create PollenBalanceDisplay components
  - [x] 5.1 Create `components/pollen-balance/pollen-balance-display-view.tsx`
    - Implement presentational component with loading skeleton, error state, balance display
    - Add refresh button with loading indicator
    - Add low balance warning styling
    - Use consistent styling with SubscriptionBadge
    - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3_
  - [x] 5.2 Create `components/pollen-balance/pollen-balance-display.tsx`
    - Implement container component using usePollenBalance hook
    - Gate rendering behind usePollenAuth authorization check
    - Wire up refresh handler
    - _Requirements: 1.1, 1.4, 5.1, 5.2, 5.3_
  - [x] 5.3 Create `components/pollen-balance/index.ts` barrel export
    - Export PollenBalanceDisplay component
  - [x] 5.4 Write unit tests for view component
    - Test renders balance when provided
    - Test shows skeleton during loading
    - Test shows error state
    - Test shows low balance warning
    - Test refresh button triggers callback
    - _Requirements: 1.2, 1.3, 4.4, 5.1, 5.2_
  - [x] 5.5 Write unit tests for container component
    - Test renders when authorized
    - Test does not render when not authorized
    - _Requirements: 1.1, 1.4_

- [x] 6. Integrate into Header component
  - [x] 6.1 Add PollenBalanceDisplay to `components/layout/header.tsx`
    - Position near SubscriptionBadge and UserButton
    - Only render for authenticated users with BYOP key
    - _Requirements: 1.1, 1.4, 1.5_
  - [x] 6.2 Write integration test for header with balance display
    - Test balance appears in header for authorized users
    - Test balance hidden for unauthorized users
    - _Requirements: 1.1, 1.4, 1.5_

- [x] 7. Checkpoint - Ensure component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Wire up generation event invalidation
  - [x] 8.1 Add balance invalidation to single generation completion
    - Update generation hooks/components to call `invalidateBalance` on completion
    - Implement debounce to prevent excessive API calls
    - _Requirements: 3.1, 3.3, 3.4_
  - [x] 8.2 Add balance invalidation to batch generation completion
    - Update batch generation hooks/components to call `invalidateBalance` on item completion
    - Use same debounce mechanism
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 8.3 Write property test for rate limiting behavior
    - **Property 3: Rate Limiting Behavior**
    - **Validates: Requirements 3.3, 3.4**

- [x] 9. Export balance service from pollen-auth module
  - [x] 9.1 Update `lib/pollen-auth/index.ts` to export balance service
    - Export `fetchPollenBalance`, `PollenBalanceResponse`, `BalanceError`, `BalanceErrorCode`

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows existing patterns: SubscriptionBadge for component structure, useSubscriptionStatus for hook patterns
