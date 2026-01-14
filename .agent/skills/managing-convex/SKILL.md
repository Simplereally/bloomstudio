---
name: managing-convex
description: |
  Manages Convex backend: schema, queries, mutations, and actions.
  Use for: database operations, server logic, real-time subscriptions.
  DO NOT use for: frontend components (use developing-nextjs), API routes (use Next.js actions).
---

# Managing Convex

Convex backend overview. **Use the specific skills below for actual tasks.**

## Skill Routing

| Task | Use Skill |
|------|-----------|
| Add a new database table | `adding-convex-table` |
| Write query/mutation/action | `writing-convex-functions` |
| Preload data for SSR | `preloading-convex-data` |

## Source of Truth

| Concern | Location |
|---------|----------|
| Schema | `convex/schema.ts` |
| Functions | `convex/*.ts` |
| Lib Utilities | `convex/lib/` |
| Generated Types | `convex/_generated/` |

## Function Types

| Type | Use Case | Access |
|------|----------|--------|
| `query` | Read data (reactive) | `ctx.db.query()` |
| `mutation` | Write data | `ctx.db.insert/patch/delete()` |
| `action` | External APIs | `fetch()`, `ctx.runQuery()` |

## Current Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `generatedImages` | Generation history |
| `favorites` | Saved images |
| `follows` | User follows |
| `promptLibrary` | Saved prompts |
| `referenceImages` | Uploaded references |

## Lib Utilities

| File | Purpose |
|------|---------|
| `convex/lib/pollinations.ts` | API URL building |
| `convex/lib/r2.ts` | Cloudflare R2 storage |
| `convex/lib/retry.ts` | Retry with backoff |
| `convex/lib/subscription.ts` | Subscription helpers |
| `convex/lib/videoThumbnail.ts` | FFmpeg thumbnails |

## Auth Pattern

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthenticated");
const userId = identity.subject; // Clerk user ID
```

## Guardrails

- **Always index** fields used in queries
- **Always validate** args with `v.*` validators
- **Auth required** for user-scoped data
- **Actions can't access db** — use `ctx.runQuery/runMutation`
