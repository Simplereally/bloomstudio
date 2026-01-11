"use node"

/**
 * R2 Orphan Cleanup Actions
 * 
 * Identifies and optionally deletes orphaned R2 objects that have no
 * corresponding Convex database records. These can accumulate when:
 * - Delete operations fail to clean up R2 after Convex deletion
 * - Uploads succeed to R2 but fail to record in Convex
 * 
 * Run manually via Convex dashboard or automatically via cron.
 */

import { v } from "convex/values"
import { internalAction } from "./_generated/server"
import {
    S3Client,
    ListObjectsV2Command,
    DeleteObjectsCommand,
    type _Object,
} from "@aws-sdk/client-s3"
import { NodeHttpHandler } from "@smithy/node-http-handler"
import { Agent as HttpsAgent } from "https"
import { internal } from "./_generated/api"

// ============================================================
// S3 Client (separate from r2.ts to avoid circular deps)
// ============================================================

let s3ClientInstance: S3Client | null = null

function getS3Client(): S3Client {
    if (!s3ClientInstance) {
        const accountId = process.env.R2_ACCOUNT_ID
        const accessKeyId = process.env.R2_ACCESS_KEY_ID
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

        if (!accountId || !accessKeyId || !secretAccessKey) {
            throw new Error("R2 configuration incomplete. Check environment variables.")
        }

        const httpsAgent = new HttpsAgent({
            keepAlive: true,
            maxSockets: 25,
            keepAliveMsecs: 360000,
        })

        s3ClientInstance = new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
            requestHandler: new NodeHttpHandler({
                httpsAgent,
                connectionTimeout: 10000,
                socketTimeout: 120000, // Long timeout for listing large buckets
            }),
        })
    }
    return s3ClientInstance
}

// ============================================================
// Types
// ============================================================

export interface OrphanedObject {
    key: string
    size: number
    lastModified: Date | undefined
}

export interface OrphanAuditResult {
    /** Number of objects scanned in R2 */
    totalR2Objects: number
    /** Number of objects with matching Convex records */
    matchedObjects: number
    /** Number of orphaned objects (no Convex record) */
    orphanedCount: number
    /** Total size of orphaned objects in bytes */
    orphanedSizeBytes: number
    /** Sample of orphaned keys (first 100) */
    sampleOrphanedKeys: string[]
    /** Prefixes scanned */
    prefixesScanned: string[]
    /** Any errors encountered */
    errors: string[]
}

export interface OrphanCleanupResult extends OrphanAuditResult {
    /** Number of objects deleted */
    deletedCount: number
    /** Keys that failed to delete */
    failedDeletes: string[]
}

// ============================================================
// Helper: List all R2 objects with a prefix
// ============================================================

async function listAllR2Objects(prefix: string): Promise<_Object[]> {
    const client = getS3Client()
    const bucketName = process.env.R2_BUCKET_NAME

    if (!bucketName) {
        throw new Error("R2_BUCKET_NAME not configured")
    }

    const allObjects: _Object[] = []
    let continuationToken: string | undefined

    console.log(`[OrphanCleanup] Listing R2 objects with prefix: ${prefix}`)

    do {
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            MaxKeys: 1000,
            ContinuationToken: continuationToken,
        })

        const response = await client.send(command)
        
        if (response.Contents) {
            allObjects.push(...response.Contents)
        }

        continuationToken = response.NextContinuationToken
        
        console.log(`[OrphanCleanup] Listed ${allObjects.length} objects so far...`)
    } while (continuationToken)

    console.log(`[OrphanCleanup] Total ${allObjects.length} objects with prefix: ${prefix}`)
    return allObjects
}

// ============================================================
// Helper: Delete R2 objects in batches
// ============================================================

async function deleteR2ObjectsBatch(keys: string[]): Promise<{ deleted: number; failed: string[] }> {
    if (keys.length === 0) {
        return { deleted: 0, failed: [] }
    }

    const client = getS3Client()
    const bucketName = process.env.R2_BUCKET_NAME

    if (!bucketName) {
        throw new Error("R2_BUCKET_NAME not configured")
    }

    const failed: string[] = []
    let deleted = 0

    // S3/R2 DeleteObjects supports up to 1000 objects per request
    const BATCH_SIZE = 1000

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        const batch = keys.slice(i, i + BATCH_SIZE)

        try {
            const command = new DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: {
                    Objects: batch.map(key => ({ Key: key })),
                    Quiet: false, // Get detailed response
                },
            })

            const response = await client.send(command)

            if (response.Deleted) {
                deleted += response.Deleted.length
            }

            if (response.Errors) {
                for (const error of response.Errors) {
                    failed.push(error.Key ?? "unknown")
                    console.error(`[OrphanCleanup] Failed to delete ${error.Key}: ${error.Message}`)
                }
            }

            console.log(`[OrphanCleanup] Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${response.Deleted?.length ?? 0} succeeded`)
        } catch (error) {
            console.error(`[OrphanCleanup] Batch delete failed:`, error)
            failed.push(...batch)
        }
    }

    return { deleted, failed }
}

// ============================================================
// Audit Action: Find orphaned objects (non-destructive)
// ============================================================

/**
 * Audit R2 storage to identify orphaned objects.
 * 
 * This action:
 * 1. Lists all R2 objects under "generated/" and "thumbnails/" prefixes
 * 2. Queries Convex for all r2Key and thumbnailR2Key references
 * 3. Identifies R2 objects with no matching Convex record
 * 
 * Non-destructive - only reports findings.
 */
export const auditOrphanedR2Objects = internalAction({
    args: {},
    handler: async (ctx): Promise<OrphanAuditResult> => {
        const startTime = Date.now()
        const errors: string[] = []
        const prefixes = ["generated/", "thumbnails/", "reference/"]

        console.log("[OrphanCleanup] Starting audit of orphaned R2 objects...")

        // Step 1: List all R2 objects
        let allR2Objects: _Object[] = []
        for (const prefix of prefixes) {
            try {
                const objects = await listAllR2Objects(prefix)
                allR2Objects = allR2Objects.concat(objects)
            } catch (error) {
                const msg = `Failed to list objects with prefix ${prefix}: ${error}`
                console.error(`[OrphanCleanup] ${msg}`)
                errors.push(msg)
            }
        }

        console.log(`[OrphanCleanup] Total R2 objects found: ${allR2Objects.length}`)

        // Step 2: Get all Convex r2Keys in a single query
        // This calls a query that collects all r2Keys from generatedImages
        const convexKeys = await ctx.runQuery(internal.orphanCleanupQueries.getAllR2Keys)
        const convexKeySet = new Set(convexKeys)

        console.log(`[OrphanCleanup] Convex references: ${convexKeySet.size} keys`)

        // Step 3: Identify orphaned objects
        const orphanedObjects: OrphanedObject[] = []
        let matchedCount = 0

        for (const obj of allR2Objects) {
            if (!obj.Key) continue

            if (convexKeySet.has(obj.Key)) {
                matchedCount++
            } else {
                orphanedObjects.push({
                    key: obj.Key,
                    size: obj.Size ?? 0,
                    lastModified: obj.LastModified,
                })
            }
        }

        const orphanedSizeBytes = orphanedObjects.reduce((sum, o) => sum + o.size, 0)
        const sampleKeys = orphanedObjects.slice(0, 100).map(o => o.key)

        const duration = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`[OrphanCleanup] Audit complete in ${duration}s`)
        console.log(`[OrphanCleanup] Results: ${orphanedObjects.length} orphaned, ${matchedCount} matched, ${orphanedSizeBytes} bytes orphaned`)

        return {
            totalR2Objects: allR2Objects.length,
            matchedObjects: matchedCount,
            orphanedCount: orphanedObjects.length,
            orphanedSizeBytes,
            sampleOrphanedKeys: sampleKeys,
            prefixesScanned: prefixes,
            errors,
        }
    },
})

// ============================================================
// Cleanup Action: Delete orphaned objects (destructive)
// ============================================================

/**
 * Clean up orphaned R2 objects.
 * 
 * This action:
 * 1. Performs the audit to identify orphaned objects
 * 2. Deletes all orphaned objects from R2
 * 
 * DESTRUCTIVE - permanently deletes orphaned files.
 * 
 * @param dryRun - If true, only reports what would be deleted without actually deleting
 */
export const cleanupOrphanedR2Objects = internalAction({
    args: {
        dryRun: v.optional(v.boolean()),
    },
    handler: async (ctx, args): Promise<OrphanCleanupResult> => {
        const dryRun = args.dryRun ?? false
        const startTime = Date.now()

        console.log(`[OrphanCleanup] Starting cleanup (dryRun: ${dryRun})...`)

        // First, run the audit
        const auditResult = await ctx.runAction(internal.orphanCleanup.auditOrphanedR2Objects)

        if (auditResult.orphanedCount === 0) {
            console.log("[OrphanCleanup] No orphaned objects found. Nothing to clean up.")
            return {
                ...auditResult,
                deletedCount: 0,
                failedDeletes: [],
            }
        }

        if (dryRun) {
            console.log(`[OrphanCleanup] DRY RUN: Would delete ${auditResult.orphanedCount} objects (${(auditResult.orphanedSizeBytes / 1024 / 1024).toFixed(2)} MB)`)
            return {
                ...auditResult,
                deletedCount: 0,
                failedDeletes: [],
            }
        }

        // Get all orphaned keys (not just the sample)
        // We need to re-list and compare since audit only returns sample
        const prefixes = ["generated/", "thumbnails/", "reference/"]
        let allR2Objects: _Object[] = []
        
        for (const prefix of prefixes) {
            try {
                const objects = await listAllR2Objects(prefix)
                allR2Objects = allR2Objects.concat(objects)
            } catch (error) {
                console.error(`[OrphanCleanup] Failed to re-list objects:`, error)
            }
        }

        const convexKeys = await ctx.runQuery(internal.orphanCleanupQueries.getAllR2Keys)
        const convexKeySet = new Set(convexKeys)

        const orphanedKeys = allR2Objects
            .filter(obj => obj.Key && !convexKeySet.has(obj.Key))
            .map(obj => obj.Key!)

        console.log(`[OrphanCleanup] Deleting ${orphanedKeys.length} orphaned objects...`)

        const { deleted, failed } = await deleteR2ObjectsBatch(orphanedKeys)

        const duration = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`[OrphanCleanup] Cleanup complete in ${duration}s. Deleted: ${deleted}, Failed: ${failed.length}`)

        return {
            ...auditResult,
            deletedCount: deleted,
            failedDeletes: failed,
        }
    },
})

// ============================================================
// Scheduled Cleanup (called by cron)
// ============================================================

/**
 * Scheduled cleanup action for cron.
 * Runs the cleanup with dryRun=false.
 * Logs results for dashboard visibility.
 */
export const scheduledCleanup = internalAction({
    args: {},
    handler: async (ctx): Promise<void> => {
        console.log("[OrphanCleanup] Running scheduled cleanup...")

        try {
            const result = await ctx.runAction(internal.orphanCleanup.cleanupOrphanedR2Objects, {
                dryRun: false,
            })

            console.log("[OrphanCleanup] Scheduled cleanup results:", {
                totalR2Objects: result.totalR2Objects,
                orphanedCount: result.orphanedCount,
                deletedCount: result.deletedCount,
                orphanedSizeMB: (result.orphanedSizeBytes / 1024 / 1024).toFixed(2),
                failedDeletes: result.failedDeletes.length,
            })
        } catch (error) {
            console.error("[OrphanCleanup] Scheduled cleanup failed:", error)
            throw error // Re-throw so Convex logs it as a failure
        }
    },
})
