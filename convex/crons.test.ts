import { describe, it, expect, vi } from "vitest";
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Mock convex/server
vi.mock("convex/server", () => ({
    cronJobs: vi.fn(() => ({
        interval: vi.fn(),
        daily: vi.fn(),
        weekly: vi.fn(),
        monthly: vi.fn(),
    })),
}));

// Mock _generated/api
vi.mock("./_generated/api", () => ({
    internal: {
        rateLimits: {
            cleanupExpiredLimits: "cleanupExpiredLimits",
        },
        orphanCleanup: {
            scheduledCleanup: "scheduledCleanup",
        },
        contentAnalysis: {
            analyzeRecentImages: "analyzeRecentImages",
        },
    },
}));

describe("crons.ts", () => {
    it("should register the expected cron jobs", async () => {
        // Import crons to trigger registration
        await import("./crons");
        
        const mockCronJobs = vi.mocked(cronJobs);
        const cronsInstance = mockCronJobs.mock.results[0].value;

        // Verify cleanup expired rate limits
        expect(cronsInstance.interval).toHaveBeenCalledWith(
            "cleanup expired rate limits",
            { hours: 1 },
            internal.rateLimits.cleanupExpiredLimits
        );

        // Verify cleanup orphaned R2 objects
        expect(cronsInstance.daily).toHaveBeenCalledWith(
            "cleanup orphaned R2 objects",
            { hourUTC: 3, minuteUTC: 0 },
            internal.orphanCleanup.scheduledCleanup
        );

        // Verify analyze unanalyzed images
        expect(cronsInstance.interval).toHaveBeenCalledWith(
            "analyze unanalyzed images",
            { hours: 1 },
            internal.contentAnalysis.analyzeRecentImages
        );
    });
});
