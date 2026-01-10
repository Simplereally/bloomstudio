# Studio Layout Refactor Story

## Narrative
As a user, I want a stable and predictable interface for the Creation Studio.
The previous resizable panels were difficult to manage and often resulted in awkward layouts.
Now, the control pane (left) and history pane (right) are fixed-width sidebars that can be easily toggled.

## Acceptance Criteria

### Left Sidebar (Controls)
- Width: Fixed (e.g., 20rem / 320px).
- Behavior: Collapsible via button or keyboard shortcut.
- Content: Contains Prompt Input and Generation Settings.
- Responsive: Slides out on mobile (Sheet behavior) or collapses to icon on tablet if desired (though "offcanvas" is default for pure visibility toggle).

### Right Sidebar (History/Gallery)
- Width: Fixed (e.g., 20rem / 320px).
- Behavior: Collapsible via button.
- Content: Contains Session History / Gallery.
- Side: Positioned on the right.

### Main Canvas
- Takes up remaining space.
- Centered content.

### Interaction
- Toggling a sidebar smoothly animates the canvas width.
- State is persisted (cookies).

## Technical Implementation
- Use `components/ui/sidebar.tsx`.
- Wrap Left Sidebar in a `SidebarProvider`.
- Wrap Right Sidebar in a nested `SidebarProvider` or use specific composition if supported.
- Remove `react-resizable-panels` dependencies from this specific view.
