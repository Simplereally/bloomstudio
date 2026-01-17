# Studio Optimization Todo List

## Mobile Experience Optimizations
The following are identified quick wins to improve the mobile user experience without affecting desktop layouts.

### 1. Disable Zoom on Inputs (Priority: High)
iOS devices automatically zoom in when focusing on input fields with a font size smaller than 16px. This creates a disjointed experience where the user has to zoom out manually.

**Implementation Plan:**
- Update all `Input`, `Textarea`, and `Select` components.
- Apply `md:text-sm text-base` classes.
- This ensures inputs are 16px on mobile (preventing zoom) while remaining compact (14px) on desktop.

### 2. Control Overscroll Behavior (Priority: Medium)
On mobile, scrolling to the edge of the sidebar or gallery often causes the entire page (body) to "bounce" or scroll, which feels unpolished for a web app interface.

**Implementation Plan:**
- Add `overscroll-behavior-y: none` to the main scroll containers or the root layout.
- Use the Tailwind utility `overscroll-y-none`.
- Target: `StudioLayout` container or specific scroll areas in `StudioShell`.
