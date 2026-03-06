// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStudioUI } from "./use-studio-ui";
import { createMockImage } from "@/lib/test-utils";

// Mock useKeyboardShortcuts
vi.mock("@/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

// Mock useIsMobile - default to desktop (false)
const mockUseIsMobile = vi.fn(() => false);
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

describe("useStudioUI", () => {
  const mockImage = createMockImage({
    id: "test-image-1",
    url: "https://example.com/image.jpg",
    prompt: "A beautiful sunset",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false);
    // Clear localStorage to prevent cross-test state contamination
    // (useLocalStorage persists showLeftSidebar/showGallery between tests)
    window.localStorage.clear();
  });

  describe("Desktop behavior (default)", () => {
    it("initializes with default values on desktop", () => {
      const { result } = renderHook(() => useStudioUI());

      expect(result.current.showLeftSidebar).toBe(true);
      expect(result.current.showGallery).toBe(true);
      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.lightboxImage).toBeNull();
    });

    it("toggles left sidebar", () => {
      const { result } = renderHook(() => useStudioUI());

      expect(result.current.showLeftSidebar).toBe(true);

      act(() => {
        result.current.toggleLeftSidebar();
      });

      expect(result.current.showLeftSidebar).toBe(false);

      act(() => {
        result.current.toggleLeftSidebar();
      });

      expect(result.current.showLeftSidebar).toBe(true);
    });

    it("toggles gallery panel", () => {
      const { result } = renderHook(() => useStudioUI());

      expect(result.current.showGallery).toBe(true);

      act(() => {
        result.current.toggleGallery();
      });

      expect(result.current.showGallery).toBe(false);

      act(() => {
        result.current.toggleGallery();
      });

      expect(result.current.showGallery).toBe(true);
    });

    it("sets left sidebar state directly", () => {
      const { result } = renderHook(() => useStudioUI());

      act(() => {
        result.current.setShowLeftSidebar(false);
      });

      expect(result.current.showLeftSidebar).toBe(false);
    });

    it("sets gallery state directly", () => {
      const { result } = renderHook(() => useStudioUI());

      act(() => {
        result.current.setShowGallery(false);
      });

      expect(result.current.showGallery).toBe(false);
    });
  });

  describe("Mobile behavior", () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    /**
     * CRITICAL: Drawers must NOT be visible on mobile page load
     * 
     * This test verifies:
     * - Editor drawer (showLeftSidebar) is closed on mobile
     * - History drawer (showGallery) is closed on mobile
     * 
     * Background:
     * - During SSR, isMobile returns false (server doesn't know viewport)
     * - This causes state to initialize as true (open)
     * - The useEffect in useStudioUI must close drawers on mobile after hydration
     */
    it("drawers are NOT visible on mobile page load", () => {
      const { result } = renderHook(() => useStudioUI());

      // CRITICAL: Both drawers must be closed on mobile
      expect(result.current.showLeftSidebar).toBe(false);
      expect(result.current.showGallery).toBe(false);
    });

    it("closes sidebar and gallery on mobile after effect runs", () => {
      const { result } = renderHook(() => useStudioUI());

      // After the effect runs, both should be closed on mobile
      expect(result.current.showLeftSidebar).toBe(false);
      expect(result.current.showGallery).toBe(false);
    });

    /**
     * SSR Hydration Behavior Note
     * 
     * In production, the SSR/hydration flow works as follows:
     * 1. Server renders with isMobile = false (states initialized as open)
     * 2. Client hydrates - React reuses server HTML
     * 3. useSyncExternalStore in useIsMobile returns the correct value on first client render
     * 4. The useEffect runs once and closes drawers if we're on mobile
     * 
     * The key test is that when isMobile is true (mobile client), drawers are closed.
     * This is verified by "drawers are NOT visible on mobile page load" test above.
     * 
     * This test verifies that desktop users aren't affected - their drawers stay open.
     */
    it("desktop users have drawers open by default", () => {
      mockUseIsMobile.mockReturnValue(false);
      const { result } = renderHook(() => useStudioUI());

      // Desktop users should have both drawers open
      expect(result.current.showLeftSidebar).toBe(true);
      expect(result.current.showGallery).toBe(true);
    });

    it("allows opening sidebar on mobile after initialization", () => {
      const { result } = renderHook(() => useStudioUI());

      // Initially closed on mobile
      expect(result.current.showLeftSidebar).toBe(false);

      // User can still open it
      act(() => {
        result.current.setShowLeftSidebar(true);
      });

      expect(result.current.showLeftSidebar).toBe(true);
    });

    it("allows opening gallery on mobile after initialization", () => {
      const { result } = renderHook(() => useStudioUI());

      // Initially closed on mobile
      expect(result.current.showGallery).toBe(false);

      // User can still open it
      act(() => {
        result.current.setShowGallery(true);
      });

      expect(result.current.showGallery).toBe(true);
    });

    /**
     * Regression Test: Drawers should not auto-close after user opens them
     * 
     * The hydration fix should only run once on initial mount.
     * If the user opens a drawer, subsequent re-renders should not close it.
     */
    it("does not auto-close drawers after user explicitly opens them", () => {
      const { result, rerender } = renderHook(() => useStudioUI());

      // Initially closed on mobile
      expect(result.current.showLeftSidebar).toBe(false);

      // User opens the drawer
      act(() => {
        result.current.setShowLeftSidebar(true);
      });
      expect(result.current.showLeftSidebar).toBe(true);

      // Re-render should not close it (simulates any state change causing re-render)
      rerender();
      expect(result.current.showLeftSidebar).toBe(true);
    });
  });

  describe("SSR hydration mismatch behavior", () => {
    it("closes drawers when isMobile flips to true after mount", async () => {
      mockUseIsMobile.mockReturnValue(false);
      const { result, rerender } = renderHook(() => useStudioUI());

      expect(result.current.showLeftSidebar).toBe(true);
      expect(result.current.showGallery).toBe(true);

      mockUseIsMobile.mockReturnValue(true);
      rerender();

      await waitFor(() => {
        expect(result.current.showLeftSidebar).toBe(false);
        expect(result.current.showGallery).toBe(false);
      });
    });
  });

  describe("Lightbox functionality", () => {
    it("opens lightbox with image", () => {
      const { result } = renderHook(() => useStudioUI());

      act(() => {
        result.current.openLightbox(mockImage);
      });

      expect(result.current.isFullscreen).toBe(true);
      expect(result.current.lightboxImage).toEqual(mockImage);
    });

    it("opens lightbox with null image", () => {
      const { result } = renderHook(() => useStudioUI());

      act(() => {
        result.current.openLightbox(null);
      });

      expect(result.current.isFullscreen).toBe(true);
      expect(result.current.lightboxImage).toBeNull();
    });

    it("closes lightbox", () => {
      const { result } = renderHook(() => useStudioUI());

      // First open lightbox
      act(() => {
        result.current.openLightbox(mockImage);
      });

      expect(result.current.isFullscreen).toBe(true);

      // Then close it
      act(() => {
        result.current.closeLightbox();
      });

      expect(result.current.isFullscreen).toBe(false);
    });

    it("sets fullscreen state directly", () => {
      const { result } = renderHook(() => useStudioUI());

      act(() => {
        result.current.setIsFullscreen(true);
      });

      expect(result.current.isFullscreen).toBe(true);
    });

    it("sets lightbox image directly", () => {
      const { result } = renderHook(() => useStudioUI());

      act(() => {
        result.current.setLightboxImage(mockImage);
      });

      expect(result.current.lightboxImage).toEqual(mockImage);
    });
  });

  describe("Mobile lightbox – drawer close sequencing (bug fix)", () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /**
     * Regression test: opening lightbox while the history drawer is open must
     * close the drawer first and only open the lightbox after the drawer's
     * close animation completes (300ms).  Previously both state updates were
     * batched in the same render, leaving two concurrent dismissable-layer
     * instances that corrupted body pointer-events / aria-hidden state.
     */
    it("delays lightbox open until after drawer close animation when gallery is open", () => {
      const { result } = renderHook(() => useStudioUI());

      // Simulate user opening the history drawer
      act(() => {
        result.current.setShowGallery(true);
      });
      expect(result.current.showGallery).toBe(true);

      // User clicks an image inside the history drawer
      act(() => {
        result.current.openLightbox(mockImage);
      });

      // Drawer must close immediately
      expect(result.current.showGallery).toBe(false);

      // Lightbox must NOT be open yet (waiting for animation to complete)
      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.lightboxImage).toBeNull();

      // Advance past the 300ms delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now the lightbox should be open
      expect(result.current.isFullscreen).toBe(true);
      expect(result.current.lightboxImage).toEqual(mockImage);
    });

    it("delays lightbox open until after drawer close animation when sidebar is open", () => {
      const { result } = renderHook(() => useStudioUI());

      // Simulate user opening the sidebar
      act(() => {
        result.current.setShowLeftSidebar(true);
      });
      expect(result.current.showLeftSidebar).toBe(true);

      act(() => {
        result.current.openLightbox(mockImage);
      });

      // Sidebar must close immediately
      expect(result.current.showLeftSidebar).toBe(false);
      // Lightbox not yet open
      expect(result.current.isFullscreen).toBe(false);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isFullscreen).toBe(true);
      expect(result.current.lightboxImage).toEqual(mockImage);
    });

    it("opens lightbox immediately on mobile when no drawer is open", () => {
      const { result } = renderHook(() => useStudioUI());

      // Both drawers closed (default on mobile after init effect)
      expect(result.current.showGallery).toBe(false);
      expect(result.current.showLeftSidebar).toBe(false);

      act(() => {
        result.current.openLightbox(mockImage);
      });

      // No delay needed – opens immediately
      expect(result.current.isFullscreen).toBe(true);
      expect(result.current.lightboxImage).toEqual(mockImage);
    });

    it("cancels pending lightbox open when closeLightbox is called before the timer fires", () => {
      const { result } = renderHook(() => useStudioUI());

      act(() => {
        result.current.setShowGallery(true);
      });

      // Queue a delayed open
      act(() => {
        result.current.openLightbox(mockImage);
      });
      expect(result.current.isFullscreen).toBe(false);

      // Close (e.g., user presses Escape) before the timer fires
      act(() => {
        result.current.closeLightbox();
      });

      // Advance past the delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // The lightbox should NOT have opened
      expect(result.current.isFullscreen).toBe(false);
    });

    it("closeLightbox resets stuck body pointer-events after 300ms", () => {
      const { result } = renderHook(() => useStudioUI());

      // Simulate the body getting stuck with pointer-events:none
      document.body.style.pointerEvents = "none";

      act(() => {
        result.current.openLightbox(mockImage);
        vi.advanceTimersByTime(300);
      });

      act(() => {
        result.current.closeLightbox();
      });

      // Before 300ms the body is still stuck
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(document.body.style.pointerEvents).toBe("none");

      // After 300ms the cleanup has run
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(document.body.style.pointerEvents).toBe("");

      // Restore
      document.body.style.pointerEvents = "";
    });
  });

  describe("Callback stability", () => {
    it("toggle functions have stable references", () => {
      const { result, rerender } = renderHook(() => useStudioUI());

      const toggleLeft1 = result.current.toggleLeftSidebar;
      const toggleGallery1 = result.current.toggleGallery;
      const openLightbox1 = result.current.openLightbox;
      const closeLightbox1 = result.current.closeLightbox;

      rerender();

      expect(result.current.toggleLeftSidebar).toBe(toggleLeft1);
      expect(result.current.toggleGallery).toBe(toggleGallery1);
      expect(result.current.openLightbox).toBe(openLightbox1);
      expect(result.current.closeLightbox).toBe(closeLightbox1);
    });
  });
});
