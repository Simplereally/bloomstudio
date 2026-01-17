/**
 * Sensitivity Threshold Migration
 *
 * One-time migration script to update images analyzed by vision (Gate 3)
 * that were marked as sensitive under the old threshold (>= 0.5) but should
 * now be marked as safe under the new threshold (>= 0.8).
 *
 * Run via Convex Dashboard or CLI:
 * npx convex run sensitivityMigration:migrateToNewThreshold
 */
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/** New threshold for isSensitive = true */
const NEW_SENSITIVITY_THRESHOLD = 0.8;

/** Maximum number of documents to process per batch (Convex limit) */
const BATCH_SIZE = 100;

/**
 * Query to find images that need migration.
 * Criteria:
 * - isSensitive = true
 * - sensitiveSource = "vision_analysis" (only Gate 3 analyzed images)
 * - sensitiveConfidence < 0.8 (below new threshold)
 */
export const findImagesToMigrate = internalQuery({
    args: { limit: v.number() },
    handler: async (ctx, args) => {
        // Get images marked sensitive by vision analysis
        const candidates = await ctx.db
            .query("generatedImages")
            .filter((q) =>
                q.and(
                    q.eq(q.field("isSensitive"), true),
                    q.eq(q.field("sensitiveSource"), "vision_analysis"),
                    q.lt(q.field("sensitiveConfidence"), NEW_SENSITIVITY_THRESHOLD)
                )
            )
            .take(args.limit);

        return candidates.map((img) => ({
            _id: img._id,
            sensitiveConfidence: img.sensitiveConfidence,
            contentAnalysis: img.contentAnalysis,
        }));
    },
});

/**
 * Migrate a batch of images to the new sensitivity threshold.
 * Updates isSensitive from true to false for images below the threshold.
 */
export const migrateToNewThreshold = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Find images to migrate
        const candidates = await ctx.db
            .query("generatedImages")
            .filter((q) =>
                q.and(
                    q.eq(q.field("isSensitive"), true),
                    q.eq(q.field("sensitiveSource"), "vision_analysis"),
                    q.lt(q.field("sensitiveConfidence"), NEW_SENSITIVITY_THRESHOLD)
                )
            )
            .take(BATCH_SIZE);

        if (candidates.length === 0) {
            console.log("[Migration] No images to migrate. All done!");
            return { migrated: 0, remaining: false };
        }

        console.log(`[Migration] Processing ${candidates.length} images...`);

        // Update each image
        let migrated = 0;
        for (const image of candidates) {
            await ctx.db.patch(image._id, {
                isSensitive: false,
            });
            migrated++;

            console.log(
                `[Migration] Updated ${image._id}: confidence=${image.sensitiveConfidence} -> isSensitive=false`
            );
        }

        // Check if there are more to process
        const remaining = await ctx.db
            .query("generatedImages")
            .filter((q) =>
                q.and(
                    q.eq(q.field("isSensitive"), true),
                    q.eq(q.field("sensitiveSource"), "vision_analysis"),
                    q.lt(q.field("sensitiveConfidence"), NEW_SENSITIVITY_THRESHOLD)
                )
            )
            .first();

        const hasMore = remaining !== null;

        console.log(`[Migration] Batch complete: ${migrated} migrated, more remaining: ${hasMore}`);

        return { migrated, remaining: hasMore };
    },
});

/**
 * Preview the migration without making changes.
 * Returns a summary of images that would be affected.
 */
export const previewMigration = internalQuery({
    args: {},
    handler: async (ctx) => {
        // Count all affected images
        const affected = await ctx.db
            .query("generatedImages")
            .filter((q) =>
                q.and(
                    q.eq(q.field("isSensitive"), true),
                    q.eq(q.field("sensitiveSource"), "vision_analysis"),
                    q.lt(q.field("sensitiveConfidence"), NEW_SENSITIVITY_THRESHOLD)
                )
            )
            .collect();

        // Group by confidence ranges for analysis
        const byRange = {
            "0.5-0.6": 0,
            "0.6-0.7": 0,
            "0.7-0.8": 0,
        };

        for (const img of affected) {
            const conf = img.sensitiveConfidence ?? 0;
            if (conf >= 0.5 && conf < 0.6) byRange["0.5-0.6"]++;
            else if (conf >= 0.6 && conf < 0.7) byRange["0.6-0.7"]++;
            else if (conf >= 0.7 && conf < 0.8) byRange["0.7-0.8"]++;
        }

        return {
            totalAffected: affected.length,
            byConfidenceRange: byRange,
            sampleIds: affected.slice(0, 10).map((img) => img._id),
        };
    },
});
