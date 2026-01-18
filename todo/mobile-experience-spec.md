# Studio Mobile Experience Specification
> **Status**: Review Phase
> **Target**: Mobile Web (iOS/Android)
> **Aesthetic Goal**: Premium, Native-Feel, "Thumb-First"
> **Design Philosophy**: "Unapologetically Mobile" — not a responsive adapter, but a bespoke mobile interface.

---

## 1. Vision & Aesthetic Direction

We are discarding the "desktop squished down" approach. The mobile Studio is a creative tool that fits in your pocket, feeling more like a native iOS app than a website.

### Aesthetic Pillars (per `brainstorming-ui-and-design`)
1.  **Immersive Canvas**: The viewport is sacred. The UI recedes when not in use. "Content First".
2.  **Tactile & Organic**: Use bottom sheets, fluid gestures, and subtle haptics (visual micro-interactions) to make creation feel physical.
3.  **Bold Typography**: Use `font-brand` (Bricolage Grotesque) for key headers (e.g., "History", "Generate") to own the brand identity, while keeping `font-sans` (Geist) for high-scannability controls.
4.  **Dark Mode First**: The studio defaults to a deep, rich dark theme (using `bg-background` and `bg-card` effectively) to make images pop.

### Design System Alignment (per `styling-ui`)
-   **Animations**: Standard `animate-scale-in` for new images, `animate-fade-in` for overlays.
-   **Shadows**: Deep, diffused shadows for floating elements (`shadow-xl`).
-   **Glass**: Use `glass-effect` judiciously — primarily on the Bottom Navigation Bar and Floating Action Buttons (FABs). **Avoid** large blur areas on scrollable surfaces to maintain 60fps on mobile.
-   **Viewport**: Use `dvh` (Dynamic Viewport Height) for the main container to prevent address bar layout shifts on iOS.

---

## 2. Core Layout Architecture

### 2.1 The "Thumb Zone" Navigation
**Problem**: Top-heavy controls are unreachable. Desktop sidebars are clunky on mobile.
**Solution**: A fixed **Bottom Action Bar** that houses primary navigation.

**Component Blueprint: `MobileStudioNavigation`**
```tsx
<div className="fixed bottom-0 left-0 right-0 h-16 glass-effect border-t border-border/20 z-40 flex items-center justify-evenly px-4 pb-safe">
    <NavButton icon={Settings} label="Editor" onClick={openLeftDrawer} />
    <GenerateFAB onClick={handleGenerate} isGenerating={isGenerating} />
    <NavButton icon={History} label="History" onClick={openRightDrawer} />
</div>
```

*   **Generate FAB (Floating Action Button)**:
    *   **Style**: Central, elevated, `bg-primary` gradient.
    *   **Interaction**: Pulses when generating (`animate-pulse-glow`). Slightly larger (56px) than other icons.
    *   **Feedback**: Scales down on press (`active:scale-95`).
    *   **Z-Index**: Ensure it sits above the base canvas but *below* full-screen sheets if they are meant to cover it (or manage occlusion).

### 2.2 The History Feature (Right Sheet)
**Goal**: A dedicated "Review Mode".
**Interaction**: Swiping from the right edge (carefully managed to avoid browser back/forward conflicts) or tapping "History" reveals the sheet.
**Component**: `Sheet` (Side Drawer).

**Visual Updates**:
*   **Header**: Sticky header with `font-brand` title "Your Creations".
*   **Grid Layout**:
    *   **Pinterest Style**: `gap-2`, `rounded-md`.
    *   **Masonry**: Since aspect ratios vary ("truthful shapes"), use a Masonry layout logic (or simple 2-column if complexity is too high, but ensure `object-cover` doesn't crop important details if strict grid is used).
*   **Selection Mode**:
    *   **Gesture**: Long-press on any image triggers "Selection Mode".
    *   **Feedback**: The pressed image scales down slightly, and a nice blue checkbox animates in (`animate-scale-in`).
    *   **Bulk Actions**: When in selection mode, the Bottom Bar morphs into [Delete] [Make Public] [Cancel].

### 2.3 The Editor/Controls Feature (Left Sheet)
**Goal**: Focused "Tweak & Compose Mode".
**Interaction**: Tap "Editor" (bottom left) to slide up a **Bottom Sheet** (using `vaul` / `Drawer` primitive).
**Reasoning**: A bottom sheet is more ergonomic for one-handed parameter adjustment.

**Content Refinement**:
*   **Prompt Input**: Crucial. Must be the first element in the sheet or easily accessible. Ensure the virtual keyboard pushes the sheet up (Vaul handles this well, but verify).
*   **Sliders**: Make thumb-draggables larger (hit slop 44px).
*   **Scroll Handling**: Remove nested `ScrollArea` if the Drawer handles scrolling nativey, to prevent "scroll chaining" issues.
*   **Inputs**: Ensure inputs don't zoom the page (font-size 16px minimum).
*   **Collapsibles**: Accordions for "Advanced" settings to keep the initial view clean.

---

## 3. Component Specifications

### 3.1 Adaptive Image Gallery (`ImageGallery.tsx`)
We need to decouple the desktop "thumbnail size" preference from the mobile layout.

```typescript
// Logic Update
const isMobile = useIsMobile();
// Mobile always gets 2 columns (or masonry). Desktop respects user preference.
const columns = isMobile ? 2 : GRID_COLUMNS[thumbnailSize];
```

**Mobile Item Spec**:
*   **Aspect Ratio**: `aspect-[user-selected-ratio]` (display truthful shapes).
*   **Metadata**: On mobile, hide prompt text overlay to reduce noise. Show only visual status indicators (e.g., "Private" padlock icon).

### 3.2 Mobile-Aware Studio Layout (`StudioLayout.tsx`)
*   **State Control**: `StudioLayout` acts as the traffic controller.
*   **Render**:
    *   `!isMobile` (Desktop): Renders existing `SidebarProvider` + `Sidebar` setup.
    *   `isMobile` (Mobile): Renders `Canvas` (full width) + `MobileStudioNavigation` + `Drawers`.
*   **State Sync**:
    *   The `showSidebar / onSidebarOpenChange` props (controlled by `studioUI`) should be reused to control the Mobile Drawers.
    *   e.g., `showSidebar` === true means the Left Editor Sheet is open on mobile.

---

## 4. Implementation phases

### Phase 1: Structural Separation (The "Split")
1.  **Refactor `StudioLayout`**: Introduce a clean fork in the render method for `isMobile`.
2.  **Scaffold `MobileStudioNavigation`**: Build the bottom glass bar.
3.  **Connect State**: Map the existing `studioUI` open states to the new Sheet/Drawer `open` props.
4.  **Z-Index Check**: Ensure `MobileStudioNavigation` (z-40) sits below Sheets (z-50) but above Canvas.

### Phase 2: The Drawer Experience
1.  **Replace Sidebars**: On mobile, wrap the `SidebarContent` (which includes `PromptFeature` + `ControlsFeature`) in a `Drawer` (Bottom Sheet) for the Left side, and `GalleryFeature` in a `Sheet` (Side Panel) for the Right side.
2.  **Keyboard safety**: Verify `PromptFeature` usage inside the Drawer doesn't cause UI to jump or close unexpectedly on iOS.
3.  **Styling**: Apply `glass-effect` to drawer backdrops.

### Phase 3: Gallery Polish
1.  **Grid Optimization**: Force 2-columns (Pinterest/Masonry style) on mobile.
2.  **Long-Press Selection**: Implement `useLongPress` hook for the gallery thumbnails.
3.  **Haptic Feedback**: (Optional) `navigator.vibrate(5)` on long-press if supported.

### Phase 4: Safety & Architecture (The "Firewall")
**CRITICAL**: The Desktop experience must remain untouched. We are building a parallel experience, not just styling tweaks.

1.  **Isolation Strategy**:
    *   **Strict Conditional Rendering**: Use the `useIsMobile` hook validation at the root level.
    *   **CSS Containment**: Ensure NO CSS overrides affect desktop classes (use `md:` prefixes or separate mobile-only CSS modules if needed).
    *   **Traffic Controller Pattern**: `StudioLayout` will act as the traffic controller:
        ```tsx
        if (isMobile) return <MobileLayout />
        return <DesktopLayout /> // Exact current implementation
        ```

---

## 5. Verification Plan

### 5.1 Manual Verification
*   **Devices**: Chrome DevTools (iPhone 14 Pro), Physical iOS Device (if available) or Simulator.
*   **Key Flows**:
    *   **Generation**: Open Editor -> Type Prompt -> Close/Minimize -> Tap Generate. (Or tap Generate from within Editor?). *Preferred: Add "Generate" button inside Editor sheet too for convenience.*
    *   **Review**: Swipe open History -> Long press to select -> Delete.
*   **Keyboard**: Focus Prompt Input -> Ensure visibility -> Dismiss Keyboard.

### 5.2 Visual Regression
*   **Desktop**: Must be pixel-identical to current production. 0% tolerance for layout shifts.
*   **Mobile Actions**:
    *   Touch targets > 44px.
    *   Safe area insets honored (bottom bar doesn't overlap Home Indicator).
