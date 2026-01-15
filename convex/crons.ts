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

// Ongoing analysis of unanalyzed images (catch-up mechanism)
// Aggressive schedule to clear backlog (every minute)
crons.interval(
    "analyze unanalyzed images",
    { minutes: 1 },
    internal.contentAnalysis.analyzeRecentImages,
);

export default crons;
