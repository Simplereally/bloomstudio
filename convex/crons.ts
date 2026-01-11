import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "cleanup expired rate limits",
    { hours: 1 },
    internal.rateLimits.cleanupExpiredLimits,
);

// Daily cleanup of orphaned R2 objects (images/thumbnails with no Convex record)
// Runs at 3:00 AM UTC daily
crons.daily(
    "cleanup orphaned R2 objects",
    { hourUTC: 3, minuteUTC: 0 },
    internal.orphanCleanup.scheduledCleanup,
);

export default crons;

