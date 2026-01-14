---
name: styling-ui
description: |
  Enforces design system using Tailwind CSS v4 and shadcn/ui.
  Use for: all styling, theming, responsive design, animations.
  DO NOT use for: component logic (use developing-nextjs), data fetching (use managing-convex).
---

# Styling UI

Tailwind CSS v4 + shadcn/ui design system. Semantic tokens are mandatory.

## Source of Truth

- **Globals + Tokens**: `app/globals.css`
- **UI Primitives**: `components/ui/` (shadcn/ui)
- **Class Merger**: `import { cn } from "@/lib/utils"`

## Mandatory Standards

| Requirement | Correct | Incorrect |
|-------------|---------|-----------|
| Class merging | `cn("base", className)` | `className={...}` only |
| Colors | `bg-background`, `text-foreground` | `bg-white`, `text-black` |
| Spacing | `gap-4`, `p-6` | `gap-[18px]`, `padding: 20px` |
| Fonts | `font-sans`, `font-brand`, `font-mono` | `font-family: Arial` |
| Responsive | `md:flex`, `lg:grid-cols-3` | Fixed widths |

## Font System

| Token | Font | Usage |
|-------|------|-------|
| `font-sans` | Geist | Default body/UI text |
| `font-brand` | Bricolage Grotesque | Headings, brand moments |
| `font-mono` | Geist Mono | Code, numbers, IDs |

## Color Tokens (oklch-based)

Use semantic tokens exclusively:

```css
/* From app/globals.css */
--background       /* Page background */
--foreground       /* Primary text */
--card             /* Card surfaces */
--muted            /* Secondary backgrounds */
--muted-foreground /* Secondary text */
--primary          /* Brand color (orange ember) */
--accent           /* Hover highlights */
--destructive      /* Error states */
--border           /* Borders */
```

## Animation Utilities

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-fade-in` | Fade + slide up | 0.6s |
| `animate-scale-in` | Pop in | 0.3s |
| `animate-shimmer` | Loading shimmer | 2s loop |
| `animate-float` | Levitation | 6s loop |
| `animate-pulse-glow` | Attention glow | 3s loop |
| `animate-lightbulb-glow` | Subtle glow | 1.5s loop |
| `animate-loading-bar` | Progress bar | 1.5s loop |

## Custom Utilities

| Class | Purpose |
|-------|---------|
| `glass-effect` | Frosted glass panels (blur + transparency) |
| `glass-effect-home` | Dark glass for landing page |
| `container` | Centered content with responsive padding |

## Workflow: Style Component

```markdown
- [ ] 1. Import `cn` from `@/lib/utils`
- [ ] 2. Use semantic HTML (`<main>`, `<section>`, `<article>`)
- [ ] 3. Apply `font-sans` (default) or `font-brand` for headings
- [ ] 4. Use tokens: `bg-card`, `text-foreground`, `border-border`
- [ ] 5. Layout with `flex`/`grid` and `gap-*`
- [ ] 6. Add responsive: mobile-first, then `md:`, `lg:` overrides
- [ ] 7. Add interactivity: `hover:bg-muted/50 transition-colors cursor-pointer`
- [ ] 8. Polish: animations, `glass-effect` where appropriate
```

## Common Patterns

### Card Component

```tsx
<div className={cn(
  "rounded-lg border bg-card p-6 shadow-sm",
  "hover:shadow-md transition-shadow",
  className
)}>
  {children}
</div>
```

### Interactive Button

```tsx
<button className={cn(
  "px-4 py-2 rounded-md font-medium",
  "bg-primary text-primary-foreground",
  "hover:bg-primary/90 transition-colors",
  "focus-visible:ring-2 focus-visible:ring-ring"
)}>
  Click Me
</button>
```

### Responsive Grid

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Glass Panel

```tsx
<div className="glass-effect rounded-xl p-6">
  {/* Content with frosted glass background */}
</div>
```

## Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |
| `3xl` | 2000px | 1440p monitors |
| `4xl` | 2400px | 2K monitors |
| `5xl` | 3600px | 4K monitors |

## Guardrails

- **Never** use hardcoded colors (`#fff`, `rgb(...)`, `bg-gray-100`)
- **Never** use inline styles (`style={{ padding: 20 }}`)
- **Never** create custom CSS files — use `globals.css` utilities only
- **Always** use `cn()` for className props to enable overrides
- **Always** test mobile-first, then add `md:` / `lg:` variants

## Output Format

```markdown
## Summary
Styled [component] with [pattern].

## Tokens Used
- Colors: `bg-card`, `text-foreground`
- Spacing: `p-4`, `gap-2`
- Animation: `animate-fade-in`

## Responsive
- Mobile: single column
- `md:`: 2 columns
- `lg:`: 3 columns

## Verification
- Dark mode tested ✅
- Mobile tested ✅
```
