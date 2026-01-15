---
name: developing-nextjs
description: |
  Creates pages, layouts, and server/client components in Next.js 16 App Router.
  Use for: new routes, RSC/RCC decisions, Server Actions, loading/error states.
  DO NOT use for: Convex mutations (use managing-convex), styling (use styling-ui).
---

# Developing with Next.js 16

Next.js 16 App Router overview. **Use the specific skills below for actual tasks.**

## Skill Routing

| Task | Use Skill |
|------|-----------|
| Create a new page/route | `adding-route` |
| Build interactive component | `creating-client-component` |
| Server-side form mutation | `writing-server-actions` |
| SSR with Convex reactivity | `preloading-convex-data` |
| Styling components | `styling-ui` |

## Core Principles

- **Server Components Default**: All components are Server Components unless marked `'use client'`
- **Client Leaves**: Use `'use client'` only for interactive leaves (hooks, events)
- **Strict Types**: No `any`. Explicitly type props.
- **Convex is Truth**: Don't mirror Convex data to local state

## Decision Tree

```
Need data from Convex?
├─ Server Component → preloadQuery() → see `preloading-convex-data`
├─ Client-only reactive → useQuery() directly
└─ Non-reactive SSR → fetchQuery()

Need interactivity?
├─ Yes → see `creating-client-component`
└─ No → Server Component (default)

Need form mutation?
├─ Yes → see `writing-server-actions`
└─ No → Use what's appropriate
```

## Source of Truth

| Concern | Location |
|---------|----------|
| Routes | `app/` |
| Shared Components | `components/` |
| UI Primitives | `components/ui/` |
| Providers | `components/providers/` |
| Layouts | `components/layout/` |

## Guardrails

- **Never** call `fetch()` directly — use Convex or Server Actions
- **Never** mirror Convex data to `useState`
- **Never** add `'use client'` unless hooks/events are needed
- **If build fails**, report error and stop
