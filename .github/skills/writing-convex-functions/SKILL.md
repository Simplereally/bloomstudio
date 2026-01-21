---
name: writing-convex-functions
description: |
  Creates Convex queries, mutations, or actions for database operations.
  Input: Function type (query/mutation/action), table, and operation.
  Output: Typed Convex function with args validation.
---

# Writing Convex Functions

Creates queries (read), mutations (write), or actions (external APIs) in Convex.

## Preconditions

- Table exists in `convex/schema.ts`
- User has provided: function type, table name, operation purpose

## Decision: Which Type?

| Need | Type | Can Access |
|------|------|------------|
| Read data (reactive) | `query` | `ctx.db.query()`, `ctx.db.get()` |
| Write data | `mutation` | `ctx.db.insert/patch/delete()` |
| Call external API | `action` | `fetch()`, but NOT `ctx.db` directly |
| Scheduled job | `action` | Use with `ctx.scheduler` |

## Algorithm

```markdown
1. Create or open function file:
   - [ ] File: `convex/[tableName].ts` (or existing file)
   - [ ] Import `query`, `mutation`, or `action` from `./_generated/server`

2. Define function:
   - [ ] Add `args` with `v.*` validators
   - [ ] Implement `handler` with correct return type
   - [ ] Check auth if user-specific

3. Export function:
   - [ ] Use descriptive name: `get`, `list`, `create`, `update`, `delete`
   - [ ] Named export for client access

4. Verify:
   - [ ] Run `bun run build` to check types
   - [ ] Test in Convex dashboard
```

## Template: Query

```typescript
// convex/users.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

// Get single record by ID
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List with filter
export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generatedImages")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(50);
  },
});

// User-scoped query
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    return await ctx.db
      .query("generatedImages")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});
```

## Template: Mutation

```typescript
// convex/generatedImages.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create record
export const create = mutation({
  args: {
    prompt: v.string(),
    model: v.string(),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db.insert("generatedImages", {
      ...args,
      userId: identity.subject,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Update record
export const updateStatus = mutation({
  args: { 
    id: v.id("generatedImages"),
    status: v.union(v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Delete record
export const remove = mutation({
  args: { id: v.id("generatedImages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const record = await ctx.db.get(args.id);
    if (!record || record.userId !== identity.subject) {
      throw new Error("Not found or unauthorized");
    }
    
    await ctx.db.delete(args.id);
  },
});
```

## Template: Action

```typescript
// convex/singleGenerationProcessor.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const processGeneration = action({
  args: { generationId: v.id("generatedImages") },
  handler: async (ctx, args) => {
    // 1. Get data via runQuery (actions can't access db directly)
    const generation = await ctx.runQuery(api.generatedImages.get, {
      id: args.generationId,
    });
    if (!generation) throw new Error("Not found");

    // 2. Call external API
    const response = await fetch("https://api.pollinations.ai/...");
    const result = await response.json();

    // 3. Update via runMutation
    await ctx.runMutation(api.generatedImages.updateStatus, {
      id: args.generationId,
      status: "completed",
    });

    return result;
  },
});
```

## Auth Pattern

```typescript
// Always check auth for user-specific operations
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error("Unauthenticated");
}
const userId = identity.subject; // Clerk user ID
```

## Lib Utilities

| File | Purpose |
|------|---------|
| `convex/lib/pollinations.ts` | Build API URLs |
| `convex/lib/r2.ts` | Cloudflare R2 storage |
| `convex/lib/retry.ts` | Retry with backoff |
| `convex/lib/subscription.ts` | Subscription checks |

## Guardrails

- **Always validate args** with `v.*` validators
- **Always check auth** for user-scoped data
- **Never use `any`** in args or return types
- **Actions can't access `ctx.db`** — use `ctx.runQuery`/`ctx.runMutation`
- **If index doesn't exist**, add it in schema first

## Output Format

```markdown
## Summary
Added `[functionType]` `[name]` for [purpose].

## Function
```typescript
export const myFunction = query({
  args: { ... },
  handler: async (ctx, args) => { ... },
});
```

## Usage (Client)
```tsx
const data = useQuery(api.table.myFunction, { arg: value });
```

## Verification
- Types check ✅
- Tested in dashboard ✅

## Related
- Index used: `by_field` ✅
```
