# Lightbox Navigation Implementation Plan

The current architecture of the Studio separates the **Gallery** (history list) from the **Lightbox** (fullscreen view) in a way that prevents them from communicating about "next" or "previous" images.

This report outlines the architectural changes required to support idiomatic left/right navigation with infinite scrolling.

## 1. Architectural Analysis
Currently, the `PersistentImageGallery` component is fully autonomous—it manages its own data fetching, filtering, and pagination state internally. The `StudioShell` (which renders the Lightbox) has no visibility into the gallery's list of images. It only receives the *single* selected image when a user clicks a thumbnail.

To enable navigation, the properties of the list (the array of images and the `loadMore` function) must be shared with the Lightbox.

## 2. Proposed Solution: State Lifting
We should lift the history management logic out of `PersistentImageGallery` and into a custom hook (e.g., `useHistoryGallery`) that is consumed by the parent `StudioShell`.

### Step A: Create `useHistoryGallery` Controller
Create a new hook that encapsulates the logic currently inside `PersistentImageGallery`:
-   **State**: Manages filter state (public/private, models) using `useLocalStorage`.
-   **Data**: Calls `useImageHistory` (the Convex paginated query).
-   **Output**: Returns `{ images, loadMore, status, filters, setFilters }`.

### Step B: Integrate into `StudioShell`
The `StudioShell` becomes the orchestrator:
1.  It calls `useHistoryGallery()` to get the live list of images.
2.  It passes this data *down* to the `GalleryFeature` (and subsequently `PersistentImageGallery`) to render the sidebar.
3.  It uses this data to drive the **Lightbox Navigation**.

## 3. Navigation Implementation
In `StudioShell`, we would implement the navigation logic that connects the active lightbox image with the history list.

### Determining "Next" and "Previous"
When the Lightbox is open:
1.  Find the index of the `currentImage.id` within the `images` array.
2.  **Next**: `images[index + 1]` (if available).
3.  **Previous**: `images[index - 1]` (if available).

### The "Pre-loading" Strategy (Sentinel)
To answer the specific question about uninterrupted scrolling: **Yes, we should pre-load.**

We can use a reactive effect in `StudioShell` or the Lightbox logic:
-   **Threshold Check**: When the user navigates to an image at index `N`, check if `(Total Images - N) < Threshold` (e.g., 5 images).
-   **Trigger**: If below the threshold and `canLoadMore` is true, silently call the `loadMore()` function derived from the pagination hook.
-   **Result**: By the time the user clicks "Right" 5 more times, the new batch of 20 images will likely have arrived, seamlessly extending the array.

## 4. Component Updates

### `ImageLightbox.tsx`
Update the component to accept navigation props:
-   `onNext: () => void`
-   `onPrevious: () => void`
-   `hasNext: boolean`
-   `hasPrevious: boolean`

**UI Additions**:
-   Add absolute positioned Chevron Left/Right buttons.
-   Bind keyboard listeners (ArrowLeft, ArrowRight) to these handlers.

### Loading Edge Case
If the user navigates faster than the network (hitting the absolute end before the pre-load completes):
-   The "Next" button should ideally show a loading spinner or accept the click but display a skeleton state until the new images arrive in the `images` array.

## 5. Summary of Changes
| Component | Change Required |
| :--- | :--- |
| **PersistentImageGallery** | Remove internal fetching logic; accept `images`, `isLoading`, and `loadMore` as props. |
| **StudioShell** | Implement `useHistoryGallery`; handle Next/Prev logic; pass list data to Gallery and navigation handlers to Lightbox. |
| **ImageLightbox** | Add navigation UI (arrows) and keyboard shortcuts. |
| **New Hook** | `useHistoryGallery.ts` to centralize filter and pagination logic. |

This approach is idiomatic to React and your current architecture because it preserves the "One Source of Truth" (Convex) while allowing `StudioShell` to coordinate the interaction between two unrelated UI features (the Sidebar and the Lightbox).
