/**
 * Generated Image Details Migration
 *
 * Two-phase migration to complete the P0 table split optimization.
 * This moves heavy fields from generatedImages to generatedImageDetails.
 *
 * STATUS: ✅ Migration complete for development. Schema is finalized.
 *
 * FOR PRODUCTION DEPLOYMENT:
 * After `npx convex deploy`, run these on production data:
 *
 * Phase 1 - Copy legacy data to details table:
 *   npx convex run detailsMigration:previewMigration --prod
 *   npx convex run detailsMigration:migrateDetails --prod  (repeat until hasMore: false)
 *   npx convex run detailsMigration:isMigrationComplete --prod
 *
 * Phase 2 - Strip legacy fields from main records:
 *   npx convex run detailsMigration:previewPhase2 --prod
 *   npx convex run detailsMigration:stripLegacyFields --prod  (repeat until hasMore: false)
 *   npx convex run detailsMigration:isPhase2Complete --prod
 *
 * Preview commands (safe, read-only):
 *   npx convex run detailsMigration:previewMigration --prod
 *   npx convex run detailsMigration:previewPhase2 --prod
 */
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/** Maximum number of documents to process per batch (Convex limit) */
const BATCH_SIZE = 100;

/**
 * Query to find images that don't have a corresponding details record.
 * Returns lightweight projection of just the IDs and any legacy fields.
 */
export const findImagesWithoutDetails = internalQuery({
    args: { limit: v.number() },
    handler: async (ctx, args) => {
        // Get a batch of images
        const images = await ctx.db
            .query("generatedImages")
            .order("desc")
            .take(args.limit * 2); // Over-fetch to account for filtering

        // Check which ones are missing details records
        const imagesNeedingDetails: Array<{
            _id: typeof images[0]["_id"];
            // These fields may exist on legacy records (before table split)
            // They are typed as 'any' because they're no longer in the schema
        }> = [];

        for (const image of images) {
            if (imagesNeedingDetails.length >= args.limit) break;

            const details = await ctx.db
                .query("generatedImageDetails")
                .withIndex("by_image", (q) => q.eq("imageId", image._id))
                .unique();

            if (!details) {
                imagesNeedingDetails.push({
                    _id: image._id,
                });
            }
        }

        return imagesNeedingDetails;
    },
});

/**
 * Migrate a batch of images by creating their details records.
 * PHASE 1: Copies legacy data from generatedImages to generatedImageDetails.
 * After Phase 1 completes, run Phase 2 to strip legacy fields from main records.
 * 
 * This scans ALL images in the database (not just recent) to find those without details.
 */
export const migrateDetails = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Collect ALL images to properly find ones missing details
        // Note: This is acceptable for migration as it runs infrequently
        const allImages = await ctx.db.query("generatedImages").collect();

        let created = 0;
        let skipped = 0;

        for (const image of allImages) {
            if (created >= BATCH_SIZE) break;

            // Check if details already exist
            const existing = await ctx.db
                .query("generatedImageDetails")
                .withIndex("by_image", (q) => q.eq("imageId", image._id))
                .unique();

            if (existing) {
                skipped++;
                continue;
            }

            // Extract legacy fields from the main record (if present)
            // These are typed as 'any' in schema so we cast to access them
            const imageDoc = image as typeof image & {
                generationParams?: unknown;
                contentAnalysis?: {
                    nudity?: string;
                    sexual?: string;
                    violence?: string;
                    analyzedAt: number;
                };
                promptInference?: {
                    category: string;
                    confidence: number;
                    reasoning: string;
                    provider: string;
                    analyzedAt: number;
                };
            };

            // Create details record with copied legacy data
            await ctx.db.insert("generatedImageDetails", {
                imageId: image._id,
                generationParams: imageDoc.generationParams ?? {
                    // Fallback if no legacy params exist
                    migrated: true,
                    migratedAt: Date.now(),
                    note: "No legacy generationParams found on source record.",
                },
                // Copy contentAnalysis if present
                contentAnalysis: imageDoc.contentAnalysis,
                // Copy promptInference if present
                promptInference: imageDoc.promptInference,
            });

            created++;
        }

        // Count remaining
        const totalImages = allImages.length;
        const totalDetails = (await ctx.db.query("generatedImageDetails").collect()).length;
        const remaining = totalImages - totalDetails;

        console.log(
            `[Migration Phase 1] Batch complete: ${created} copied, ${skipped} already had details, ${remaining} remaining`
        );

        return { created, skipped, remaining, hasMore: remaining > 0 };
    },
});


/**
 * Run migration in a loop until all images have details.
 * This is useful for running from the dashboard.
 */
export const migrateAllDetails = internalMutation({
    args: {},
    handler: async (ctx) => {
        let totalCreated = 0;
        let batchCount = 0;
        const maxBatches = 50; // Safety limit

        // Process batches until done or safety limit reached
        while (batchCount < maxBatches) {
            batchCount++;

            // Find images needing details
            const images = await ctx.db
                .query("generatedImages")
                .order("desc")
                .take(BATCH_SIZE * 2);

            let batchCreated = 0;
            let needsMore = false;

            for (const image of images) {
                if (batchCreated >= BATCH_SIZE) {
                    needsMore = true;
                    break;
                }

                const existing = await ctx.db
                    .query("generatedImageDetails")
                    .withIndex("by_image", (q) => q.eq("imageId", image._id))
                    .unique();

                if (existing) continue;

                await ctx.db.insert("generatedImageDetails", {
                    imageId: image._id,
                    generationParams: {
                        migrated: true,
                        migratedAt: Date.now(),
                        note: "Created during P0 table split migration. Original params not available.",
                    },
                });

                batchCreated++;
                totalCreated++;
            }

            if (batchCreated === 0 && !needsMore) {
                console.log(`[Migration] Complete! Total created: ${totalCreated}`);
                return { totalCreated, complete: true };
            }

            console.log(`[Migration] Batch ${batchCount}: created ${batchCreated}`);
        }

        console.log(
            `[Migration] Safety limit reached after ${batchCount} batches. Total created: ${totalCreated}`
        );
        return { totalCreated, complete: false, batchesRun: batchCount };
    },
});

/**
 * Preview the migration without making changes.
 * Returns a summary of images that would be affected.
 */
export const previewMigration = internalQuery({
    args: {},
    handler: async (ctx) => {
        // Sample images to check
        const sampleSize = 200;
        const images = await ctx.db
            .query("generatedImages")
            .order("desc")
            .take(sampleSize);

        let withDetails = 0;
        let withoutDetails = 0;
        const sampleMissing: string[] = [];

        for (const image of images) {
            const details = await ctx.db
                .query("generatedImageDetails")
                .withIndex("by_image", (q) => q.eq("imageId", image._id))
                .unique();

            if (details) {
                withDetails++;
            } else {
                withoutDetails++;
                if (sampleMissing.length < 10) {
                    sampleMissing.push(image._id);
                }
            }
        }

        // Estimate total based on sample
        const totalImages = await ctx.db.query("generatedImages").collect();
        const totalDetails = await ctx.db.query("generatedImageDetails").collect();

        return {
            sampleSize,
            sampleWithDetails: withDetails,
            sampleWithoutDetails: withoutDetails,
            estimatedMissingPercentage: Math.round((withoutDetails / sampleSize) * 100),
            totalImages: totalImages.length,
            totalDetails: totalDetails.length,
            estimatedMissing: totalImages.length - totalDetails.length,
            sampleMissingIds: sampleMissing,
        };
    },
});

/**
 * Check if migration is complete.
 */
export const isMigrationComplete = internalQuery({
    args: {},
    handler: async (ctx) => {
        // Quick check: compare counts
        const images = await ctx.db.query("generatedImages").collect();
        const details = await ctx.db.query("generatedImageDetails").collect();

        if (images.length === details.length) {
            return { complete: true, imageCount: images.length, detailsCount: details.length };
        }

        // Find first missing
        for (const image of images.slice(0, 100)) {
            const detail = await ctx.db
                .query("generatedImageDetails")
                .withIndex("by_image", (q) => q.eq("imageId", image._id))
                .unique();

            if (!detail) {
                return {
                    complete: false,
                    imageCount: images.length,
                    detailsCount: details.length,
                    firstMissing: image._id,
                };
            }
        }

        return {
            complete: false,
            imageCount: images.length,
            detailsCount: details.length,
            note: "Difference detected but first 100 images all have details",
        };
    },
});

// =============================================================================
// PHASE 2: Strip Legacy Fields from Main Records
// =============================================================================
// Run these AFTER Phase 1 is complete (all images have details records)
// This removes the deprecated fields from generatedImages documents
// =============================================================================

/**
 * Preview Phase 2: Check how many records still have legacy fields.
 */
export const previewPhase2 = internalQuery({
    args: {},
    handler: async (ctx) => {
        const sampleSize = 100;
        const images = await ctx.db
            .query("generatedImages")
            .order("desc")
            .take(sampleSize);

        let withLegacyFields = 0;
        let withoutLegacyFields = 0;

        for (const image of images) {
            // Check if any legacy fields exist on this document
            const doc = image as typeof image & {
                generationParams?: unknown;
                contentAnalysis?: unknown;
                promptInference?: unknown;
            };

            const hasLegacy = 
                doc.generationParams !== undefined ||
                doc.contentAnalysis !== undefined ||
                doc.promptInference !== undefined;

            if (hasLegacy) {
                withLegacyFields++;
            } else {
                withoutLegacyFields++;
            }
        }

        return {
            sampleSize,
            withLegacyFields,
            withoutLegacyFields,
            percentWithLegacy: Math.round((withLegacyFields / sampleSize) * 100),
            note: "Run stripLegacyFields to remove deprecated fields from documents",
        };
    },
});

/**
 * PHASE 2: Strip legacy fields from generatedImages documents.
 * 
 * Prerequisites:
 * 1. Phase 1 must be complete (run isMigrationComplete to verify)
 * 2. All images must have corresponding generatedImageDetails records
 * 
 * Note: Schema has already been updated (deprecated fields removed).
 * This function is for production migrations only.
 * 
 * This scans ALL images to find those with legacy fields.
 */
export const stripLegacyFields = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Collect ALL images to properly find ones with legacy fields
        const allImages = await ctx.db.query("generatedImages").collect();

        let stripped = 0;
        let skipped = 0;
        let withLegacy = 0;

        for (const image of allImages) {
            if (stripped >= BATCH_SIZE) break;

            // Check if this document has legacy fields
            const doc = image as typeof image & {
                generationParams?: unknown;
                contentAnalysis?: unknown;
                promptInference?: unknown;
            };

            const hasLegacy = 
                doc.generationParams !== undefined ||
                doc.contentAnalysis !== undefined ||
                doc.promptInference !== undefined;

            if (!hasLegacy) {
                skipped++;
                continue;
            }

            withLegacy++;

            // Verify details record exists before stripping
            const details = await ctx.db
                .query("generatedImageDetails")
                .withIndex("by_image", (q) => q.eq("imageId", image._id))
                .unique();

            if (!details) {
                console.warn(`[Phase 2] Skipping ${image._id}: No details record found!`);
                continue;
            }

            // Strip legacy fields by setting them to undefined
            // Convex will remove undefined fields from the document
            // Note: Using 'as' cast because fields no longer exist in schema after Phase 3
            await ctx.db.patch(image._id, {
                generationParams: undefined,
                contentAnalysis: undefined,
                promptInference: undefined,
            } as Record<string, undefined>);

            stripped++;
        }

        // Count remaining with legacy fields
        const remaining = withLegacy - stripped;

        console.log(
            `[Phase 2] Batch complete: ${stripped} stripped, ${skipped} already clean, ${remaining} remaining`
        );

        return { stripped, skipped, remaining, hasMore: remaining > 0 };
    },
});


/**
 * Check if Phase 2 is complete (no more legacy fields).
 */
export const isPhase2Complete = internalQuery({
    args: {},
    handler: async (ctx) => {
        const sampleSize = 500;
        const images = await ctx.db
            .query("generatedImages")
            .order("desc")
            .take(sampleSize);

        for (const image of images) {
            const doc = image as typeof image & {
                generationParams?: unknown;
                contentAnalysis?: unknown;
                promptInference?: unknown;
            };

            if (doc.generationParams !== undefined ||
                doc.contentAnalysis !== undefined ||
                doc.promptInference !== undefined) {
                return {
                    complete: false,
                    foundLegacyIn: image._id,
                    note: "Run stripLegacyFields to remove remaining legacy fields",
                };
            }
        }

        return {
            complete: true,
            sampleChecked: sampleSize,
            note: "All sampled documents are clean. You can now remove deprecated fields from schema.ts",
        };
    },
});
