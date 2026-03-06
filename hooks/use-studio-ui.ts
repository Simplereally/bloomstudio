"use client";

/**
 * useStudioUI Hook
 *
 * Manages Studio UI state: panel visibility, fullscreen, lightbox.
 * Completely isolated from generation logic for optimal performance.
 *
 * Features:
 * - Left sidebar toggle state
 * - Right gallery panel toggle state
 * - Fullscreen/lightbox state
 * - Lightbox image selection
 * - Keyboard shortcuts integration
 * - Mobile-aware default states (drawers closed on mobile)
 *
 * This hook follows the "Headless UI" pattern - pure logic with stable callbacks.
 */

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LightboxImage } from "@/hooks/use-image-lightbox";
import * as React from "react";

/**
 * Return type for useStudioUI hook
 */
export interface UseStudioUIReturn {
  // Sidebar state
  showLeftSidebar: boolean;
  setShowLeftSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLeftSidebar: () => void;

  // Gallery panel state
  showGallery: boolean;
  setShowGallery: React.Dispatch<React.SetStateAction<boolean>>;
  toggleGallery: () => void;

  // Fullscreen/Lightbox state
  isFullscreen: boolean;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  lightboxImage: LightboxImage | null;
  setLightboxImage: React.Dispatch<React.SetStateAction<LightboxImage | null>>;

  // Open lightbox with specific image
  openLightbox: (image: LightboxImage | null) => void;
  closeLightbox: () => void;
}

/**
 * Hook for managing Studio UI state.
 *
 * @example
 * ```tsx
 * const {
 *     showLeftSidebar,
 *     toggleLeftSidebar,
 *     showGallery,
 *     openLightbox,
 * } = useStudioUI()
 *
 * // Toggle sidebar
 * <Button onClick={toggleLeftSidebar}>Toggle Sidebar</Button>
 *
 * // Open lightbox
 * <ImageThumbnail onClick={() => openLightbox(image)} />
 * ```
 */
export function useStudioUI(): UseStudioUIReturn {
  const isMobile = useIsMobile();

  // ========================================
  // Panel Visibility State (persisted)
  //
  // IMPORTANT: SSR Hydration Behavior
  // - useLocalStorage initializes with the provided default during SSR
  // - On desktop clients, persisted value is restored before paint via useLayoutEffect
  // - On mobile clients, we override to closed after hydration (drawers should start closed)
  // ========================================
  const [showLeftSidebar, setShowLeftSidebar] = useLocalStorage<boolean>("ps:ui:showLeftSidebar", true);
  const [showGallery, setShowGallery] = useLocalStorage<boolean>("ps:ui:showGallery", true);

  // Track if we've done the initial mobile sync
  const hasInitializedMobileRef = React.useRef(false);

  // Sync drawer state on mobile after hydration
  // This runs once after the client-side isMobile value is determined
  React.useEffect(() => {
    if (!isMobile) return;
    if (hasInitializedMobileRef.current) return;
    hasInitializedMobileRef.current = true;
    setShowLeftSidebar(false);
    setShowGallery(false);
  }, [isMobile, setShowLeftSidebar, setShowGallery]);

  // ========================================
  // Fullscreen/Lightbox State
  // ========================================
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [lightboxImage, setLightboxImage] =
    React.useState<LightboxImage | null>(null);

  // ========================================
  // Stable Toggle Callbacks
  // ========================================
  const toggleLeftSidebar = React.useCallback(() => {
    setShowLeftSidebar((prev) => !prev);
  }, [setShowLeftSidebar]);

  const toggleGallery = React.useCallback(() => {
    setShowGallery((prev) => !prev);
  }, [setShowGallery]);

  // ========================================
  // Lightbox Handlers
  //
  // IMPORTANT: On mobile, vaul drawers and the Radix Dialog lightbox share
  // the same @radix-ui/react-dismissable-layer but their close sequences can
  // race. When both are active simultaneously (drawer animating out while
  // dialog opens), the cleanup order leaves body.style.pointerEvents:"none"
  // and/or aria-hidden/inert stuck on elements, making the entire page
  // unresponsive. The fix:
  //   1. Close drawers first, THEN open the lightbox after the drawer's
  //      close animation completes (300ms > 200ms animation duration).
  //   2. After the lightbox closes, defensively reset body attributes once
  //      Radix's own close-animation cleanup has fully run (setTimeout > rAF).
  // ========================================

  // Pending-lightbox refs: used to delay the open on mobile until drawer
  // animation completes, keeping openLightbox's dep array stable.
  const pendingLightboxTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLightboxRef = React.useRef<{ pending: boolean; image: LightboxImage | null }>({
    pending: false,
    image: null,
  });
  // Latest drawer state, read inside openLightbox without adding to deps
  const drawerOpenRef = React.useRef({ showGallery, showLeftSidebar });
  drawerOpenRef.current = { showGallery, showLeftSidebar };

  // Cancel any pending timer when the hook unmounts
  React.useEffect(() => {
    return () => {
      if (pendingLightboxTimerRef.current !== null) {
        clearTimeout(pendingLightboxTimerRef.current);
      }
    };
  }, []);

  const openLightbox = React.useCallback(
    (image: LightboxImage | null) => {
      const { showGallery: isGalleryOpen, showLeftSidebar: isSidebarOpen } =
        drawerOpenRef.current;
      const hasOpenDrawer = isMobile && (isGalleryOpen || isSidebarOpen);

      // Cancel any previous pending open
      if (pendingLightboxTimerRef.current !== null) {
        clearTimeout(pendingLightboxTimerRef.current);
        pendingLightboxTimerRef.current = null;
      }

      if (hasOpenDrawer) {
        // Close drawers first, then wait for the drawer close animation to
        // finish (200ms CSS transition + 100ms safety margin = 300ms) before
        // opening the lightbox. This prevents concurrent dismissable-layer
        // instances from corrupting body pointer-events / aria-hidden state.
        setShowLeftSidebar(false);
        setShowGallery(false);

        pendingLightboxRef.current = { pending: true, image };
        pendingLightboxTimerRef.current = setTimeout(() => {
          pendingLightboxTimerRef.current = null;
          if (pendingLightboxRef.current.pending) {
            const { image: pendingImage } = pendingLightboxRef.current;
            pendingLightboxRef.current = { pending: false, image: null };
            setLightboxImage(pendingImage);
            setIsFullscreen(true);
          }
        }, 300);
      } else {
        setLightboxImage(image);
        setIsFullscreen(true);
      }
    },
    [isMobile, setShowLeftSidebar, setShowGallery],
  );

  // Ref for the closeLightbox cleanup timer so it can be cancelled on unmount
  const closeLightboxTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (closeLightboxTimerRef.current !== null) {
        clearTimeout(closeLightboxTimerRef.current);
      }
    };
  }, []);

  const closeLightbox = React.useCallback(() => {
    setIsFullscreen(false);

    // Cancel any pending lightbox open (in case the user closes while one is
    // queued, e.g. via keyboard shortcut)
    if (pendingLightboxTimerRef.current !== null) {
      clearTimeout(pendingLightboxTimerRef.current);
      pendingLightboxTimerRef.current = null;
      pendingLightboxRef.current = { pending: false, image: null };
    }

    // Defensive cleanup: run AFTER Radix Dialog's close animation (75ms via
    // !duration-75 class) and its aria-hidden / react-remove-scroll teardown.
    // A single rAF (~16ms) is too early; use 300ms to be well clear of all
    // async cleanup paths. Only resets attributes when no other modal is open.
    if (closeLightboxTimerRef.current !== null) {
      clearTimeout(closeLightboxTimerRef.current);
    }
    closeLightboxTimerRef.current = setTimeout(() => {
      closeLightboxTimerRef.current = null;
      const openModal = document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
      );
      if (!openModal) {
        if (document.body.style.pointerEvents === "none") {
          document.body.style.pointerEvents = "";
        }
        // Remove any stuck aria-hidden / inert from direct body children that
        // Radix/vaul may have left behind when concurrent modals raced on close.
        document
          .querySelectorAll("body > [aria-hidden], body > [inert]")
          .forEach((el) => {
            el.removeAttribute("aria-hidden");
            el.removeAttribute("inert");
          });
      }
    }, 300);
  }, []);

  // ========================================
  // Keyboard Shortcuts
  // ========================================
  useKeyboardShortcuts({
    onToggleSidebar: toggleLeftSidebar,
    onToggleGallery: toggleGallery,
  });

  return {
    // Sidebar state
    showLeftSidebar,
    setShowLeftSidebar,
    toggleLeftSidebar,

    // Gallery panel state
    showGallery,
    setShowGallery,
    toggleGallery,

    // Fullscreen/Lightbox state
    isFullscreen,
    setIsFullscreen,
    lightboxImage,
    setLightboxImage,
    openLightbox,
    closeLightbox,
  };
}
