/**
 * Mobile Studio Components - Public Exports
 *
 * Bespoke mobile experience components for the Studio.
 * These components provide a "thumb-first" interface optimized
 * for mobile devices, separate from the desktop experience.
 */

// Layout
export {
  MobileStudioLayout,
  type MobileStudioLayoutProps,
} from "./mobile-studio-layout";

// Navigation
export {
  MobileStudioNavigation,
  type MobileStudioNavigationProps,
} from "./mobile-studio-navigation";

// Drawers & Sheets
export {
  MobileEditorDrawer,
  type MobileEditorDrawerProps,
} from "./mobile-editor-drawer";
export {
  MobileHistorySheet,
  type MobileHistorySheetProps,
} from "./mobile-history-sheet";
export {
  MobileHistoryDrawer,
  type MobileHistoryDrawerProps,
  useMobileDrawerVisibility,
} from "./mobile-history-drawer";
