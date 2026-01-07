import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "cleanup expired rate limits",
    { hours: 1 },
    internal.rateLimits.cleanupExpiredLimits,
);

export default crons;
