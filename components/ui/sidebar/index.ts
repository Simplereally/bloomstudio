/**
 * Sidebar Components - Barrel Export
 *
 * This module re-exports all sidebar components from their respective files.
 * The original sidebar.tsx is kept for backward compatibility and re-exports from here.
 */

// Context and Provider
export {
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
  SIDEBAR_KEYBOARD_SHORTCUT,
  SidebarContext,
  useSidebar,
  SidebarProvider,
  type SidebarContextProps,
} from "./sidebar-context"

// Main Sidebar component
export {
  Sidebar,
  getMobileSidebarTransformClass,
  getMobileSidebarPositionClass,
} from "./sidebar-main"

// Control components (trigger, rail, inset)
export {
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
} from "./sidebar-controls"

// Layout components (input, header, footer, separator, content)
export {
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
} from "./sidebar-layout"

// Group components
export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "./sidebar-group"

// Menu components
export {
  sidebarMenuButtonVariants,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./sidebar-menu"
