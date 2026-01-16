---
name: adding-convex-table
description: |
  Adds a new table to Convex schema with indexes.
  Input: Table name, fields, and query patterns.
  Output: Updated schema.ts with new table definition.
---

# Adding a Convex Table

Adds a new table to `convex/schema.ts` with proper indexes for query performance.

## Preconditions

- Table doesn't already exist in schema
- User has provided: table name, fields, and expected query patterns

## Algorithm

```markdown
1. Read current schema:
   - [ ] Open `convex/schema.ts`
   - [ ] Identify existing tables for pattern reference

2. Define table:
   - [ ] Add `defineTable()` with field validators
   - [ ] Use appropriate `v.*` types for each field
   - [ ] Add `userId` if user-scoped data

3. Add indexes:
   - [ ] Add `.index()` for each field used in queries
   - [ ] Name indexes descriptively: `by_[field]` or `by_[field1]_and_[field2]`

4. Verify:
   - [ ] Save file — Convex auto-pushes in dev
   - [ ] Check Convex dashboard for new table
   - [ ] Run `bun run build` to regenerate types
```

## Validator Reference

| Type | Validator | Example |
|------|-----------|---------|
| String | `v.string()` | `name: v.string()` |
| Number | `v.number()` | `count: v.number()` |
| Boolean | `v.boolean()` | `isActive: v.boolean()` |
| Optional | `v.optional(v.string())` | `bio: v.optional(v.string())` |
| ID reference | `v.id("tableName")` | `userId: v.id("users")` |
| Union | `v.union(v.literal("a"), v.literal("b"))` | `status: v.union(...)` |
| Array | `v.array(v.string())` | `tags: v.array(v.string())` |
| Object | `v.object({ ... })` | Nested objects |
| Any (avoid) | `v.any()` | Only if truly dynamic |

## Template

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Existing tables...

  // NEW TABLE
  myNewTable: defineTable({
    // Required fields
    userId: v.string(),
    title: v.string(),
    
    // Optional fields
    description: v.optional(v.string()),
    
    // Enum/status fields
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    // Indexes for queries
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_created", ["createdAt"]),
});
```

## Existing Tables (Reference)

| Table | Key Fields | Indexes |
|-------|------------|---------|
| `users` | `email`, `stripeCustomerId` | `by_email`, `by_clerk_id` |
| `generatedImages` | `userId`, `model`, `status` | `by_user`, `by_user_and_status` |
| `favorites` | `userId`, `imageId` | `by_user`, `by_image` |
| `follows` | `followerId`, `followedId` | `by_follower`, `by_followed` |
| `promptLibrary` | `userId`, `prompt` | `by_user` |
| `referenceImages` | `userId`, `storageId` | `by_user` |

## Index Strategy

| Query Pattern | Index Needed |
|--------------|--------------|
| Filter by single field | `.index("by_field", ["field"])` |
| Filter by multiple fields | `.index("by_a_and_b", ["a", "b"])` |
| Sort by field | Same as filter (Convex sorts on index) |
| Unique lookup | `.index("by_field", ["field"])` |

## Guardrails

- **Always index** fields used in `.withIndex()` or `.filter()`
- **User-scoped data** must have `userId` field + `by_user` index
- **Timestamps** use `v.number()` (Unix ms), not Date
- **Never use raw SQL** — Convex handles persistence
- **If schema push fails**, report error and stop

## Output Format

```markdown
## Summary
Added table `[tableName]` for [purpose].

## Schema
```typescript
myTable: defineTable({
  field1: v.string(),
  field2: v.number(),
}).index("by_field1", ["field1"])
```

## Indexes
- `by_field1` — For querying by field1

## Verification
- Schema pushed ✅
- Types regenerated ✅
- Table visible in dashboard ✅

## Next Steps
- Create queries/mutations in `convex/[tableName].ts`
```
