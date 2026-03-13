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

// Cleanup stuck single generations (pending/processing > 15 min)
// Runs every 5 minutes to quickly recover from orphaned action crashes
crons.interval(
    "cleanup stuck generations",
    { minutes: 5 },
    internal.singleGeneration.cleanupStuckGenerations,
);

// Ongoing analysis of unanalyzed images (catch-up mechanism)
// Runs hourly to restart processing if recursive chain stops
crons.interval(
    "analyze unanalyzed images",
    { hours: 1 },
    internal.contentAnalysis.analyzeRecentImages,
    {},
);

export default crons;
