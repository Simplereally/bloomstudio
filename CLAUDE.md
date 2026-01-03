---

---

# .agent — Development Guidelines

## Stack
- Next.js (App Router, latest stable patch)
- React 19
- TypeScript (strict)
- Convex
- shadcn/ui + Tailwind CSS

---

## Defaults
- **Server Components by default.** Add `'use client'` only at the leaves that need interactivity/hooks.
- **Convex is the source of truth** for server state; local state is for UI-only concerns.
- **Always leverage typescript**; avoid usage of `any` which defeats the point of using Typescript.

---

## Components & Composition
- Prefer **small, focused components**. Split when a component mixes concerns or becomes hard to scan.
- **Presentational components:** props in → JSX out (no data fetching; minimal/no app logic).
- **Feature components:** coordinate data + state + composition.
- Prefer **composition** (children, slots) over giant prop APIs.

---

## State & Side Effects
- Keep state **closest to where it’s used**; lift only for shared ownership.
- Don’t mirror Convex query results into local state. Store **UI state** (selection, filters, draft text), not server data.
- Avoid `useEffect` for app data fetching. Use it for **browser-only side effects** (subscriptions, observers, localStorage).

---

## Convex + Next.js (Best Practice Patterns)
- **Client reactivity:** `useQuery` / `useMutation` in Client Components.
- **SSR + reactivity:** in a Server Component, `preloadQuery(...)` and pass the payload to a Client Component using `usePreloadedQuery(...)`.
- **Server-only (non-reactive) rendering:** `fetchQuery(...)` in Server Components.
- **Server Actions / Route Handlers:** call Convex via `fetchMutation` / `fetchAction` when you must mutate from the server boundary (e.g., form action, webhook, route handler).
- **Optimistic UI:** prefer Convex optimistic updates (`useMutation(...).withOptimisticUpdate(...)`) over duplicating server logic in ad-hoc local state.
- **Consistency:** avoid multiple `preloadQuery` calls on the same page; consolidate queries or design around a single preload.

---

## Next.js App Router Conventions
- Use `loading.tsx` and `error.tsx` for route-segment UX.
- Use `not-found.tsx` for 404 states.
- Prefer colocating components with the route/feature that owns them; extract to shared only when reused.

---

## React 19 Usage
- Prefer **Actions + `useActionState`** for form submission state when using form actions.
- Use `useOptimistic` for instant UI feedback when appropriate.
- Use `useFormStatus` inside design-system components that need form pending state.
- `use` can read a Promise/Context during render (only where Suspense semantics make sense).

---

## TypeScript (Strict, Practical)
- Let inference work; **export explicit prop types** for shared/public components.
- No `any`. Use `unknown` and narrow.
- Avoid `as` casts; prefer `satisfies`, generics, and runtime validation.
- `@ts-expect-error` allowed only with a comment explaining why + link/TODO to remove.

---

## Performance
- Minimize client bundles: keep heavy logic/components server-side when possible.
- Use dynamic imports for non-critical client UI.
- Use `next/image` for images.
- Memoization is opt-in: use `memo`/`useMemo`/`useCallback` only when profiling shows value.

---

## Styling (shadcn/ui + Tailwind)
- Use shadcn/ui as the base; extend via composition + variants.
- Tailwind utilities in JSX; extract repetition into components, not `@apply`.
- Theme via CSS variables; keep design tokens centralized.