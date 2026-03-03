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
  // IMPORTANT: On mobile, vaul drawers and the Radix Dialog lightbox use
  // separate instances of @radix-ui/react-dismissable-layer (v1.1.3 in vaul
  // vs v1.1.11 at top-level). Each instance independently manages
  // body.style.pointerEvents. When both are open simultaneously, the close
  // order can leave body stuck with pointer-events:none, making the entire
  // page unresponsive. The fix: close drawers before opening the lightbox
  // and defensively reset pointer-events on lightbox close.
  // ========================================
  const openLightbox = React.useCallback(
    (image: LightboxImage | null) => {
      // Close mobile drawers first to avoid the pointer-events race condition
      // between vaul's and Radix Dialog's dismissable-layer instances
      if (isMobile) {
        setShowLeftSidebar(false);
        setShowGallery(false);
      }
      setLightboxImage(image);
      setIsFullscreen(true);
    },
    [isMobile, setShowLeftSidebar, setShowGallery],
  );

  const closeLightbox = React.useCallback(() => {
    setIsFullscreen(false);
    // Defensive cleanup: ensure body pointer-events are restored.
    // The dual dismissable-layer instances can leave pointer-events:none
    // on the body after the lightbox closes. We use rAF to run after
    // Radix's own cleanup microtask.
    requestAnimationFrame(() => {
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
    });
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
