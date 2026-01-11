# Paused Batch Job Cleanup (Nice-to-Have)

## Context

Investigated on 2026-01-12.

When users pause a batch generation, the `batchJobs` document stays in `status: "paused"` state indefinitely. There are **no technical constraints** on how long this can persist:

- Convex documents persist indefinitely (only old *revisions* are cleaned up after 80 days)
- No scheduled functions are running while paused
- No cron jobs currently target paused batch jobs

The current implementation is architecturally sound and works correctly with Convex's reactive system - the generation button stays synced across tabs and refreshes.

## Future Enhancement

Consider adding an optional cleanup mechanism for abandoned paused jobs:

### Option 1: Auto-Cancel After Inactivity

Add a cron job to auto-cancel paused batches after a configurable period (e.g., 30 days):

```typescript
// convex/crons.ts
crons.daily(
    "cleanup abandoned paused batches",
    { hourUTC: 4, minuteUTC: 0 },
    internal.batchGeneration.cleanupAbandonedPausedJobs,
);

// convex/batchGeneration.ts
export const cleanupAbandonedPausedJobs = internalMutation({
    args: {},
    handler: async (ctx) => {
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
        const cutoff = Date.now() - THIRTY_DAYS_MS

        const abandonedJobs = await ctx.db
            .query("batchJobs")
            .withIndex("by_status", (q) => q.eq("status", "paused"))
            .filter((q) => q.lt(q.field("updatedAt"), cutoff))
            .collect()

        for (const job of abandonedJobs) {
            await ctx.db.patch(job._id, {
                status: "cancelled",
                updatedAt: Date.now(),
            })
        }

        return { cancelledCount: abandonedJobs.length }
    },
})
```

### Option 2: User Notification

Send a reminder email/notification to users with long-paused batches before auto-cancelling.

### Option 3: Dashboard Indicator

Add a visual indicator in the UI for "stale" paused batches (e.g., paused > 7 days) prompting user action.

## Priority

**Low** - The current system works correctly. This is purely a housekeeping optimization to prevent database clutter from forgotten paused jobs.

## Related Files

- `convex/batchGeneration.ts` - Pause/resume logic
- `convex/batchProcessor.ts` - Processing action
- `convex/schema.ts` - `batchJobs` table definition
- `convex/crons.ts` - Scheduled jobs
