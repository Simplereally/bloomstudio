
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";
import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, unlink, readFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper: Extract Thumbnail Locally
async function extractLocalThumbnail(videoBuffer: Buffer): Promise<Buffer> {
    if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

    const tempDir = join(tmpdir(), "pixelstream-migration");
    await mkdir(tempDir, { recursive: true });

    const inputPath = join(tempDir, `input-${randomUUID()}.mp4`);
    const outputPath = join(tempDir, `output-${randomUUID()}.jpg`);

    try {
        await writeFile(inputPath, videoBuffer);

        await new Promise<void>((resolve, reject) => {
            ffmpeg(inputPath)
                .seekInput(0.5)
                .frames(1)
                .outputOptions([
                    "-vf", `crop=min(iw\\,ih):min(iw\\,ih),scale=128:128`,
                    "-q:v", "6", // ~80% quality (0-31 scale, lower value is better quality)
                ])
                .output(outputPath)
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .run();
        });

        return await readFile(outputPath);
    } finally {
        await unlink(inputPath).catch(() => { });
        await unlink(outputPath).catch(() => { });
    }
}

// Helper: S3 Upload
async function uploadToR2Raw(buffer: Buffer, key: string, contentType: string) {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    // Fallback to constructing endpoint if not explicitly provided
    const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accessKeyId || !secretAccessKey || !bucket || !endpoint || !publicUrl) {
        throw new Error("Missing R2 environment variables");
    }

    const s3 = new S3Client({
        region: "auto",
        endpoint: endpoint,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
    }));

    return `${publicUrl}/${key}`;
}

async function main() {
    console.log("🚀 Starting Local Migration Script (FULL REGENERATION MODE)...");
    console.log("   Quality set to ~80% (low artifacting)");

    let cursor: string | null = null;
    let isDone = false;
    let totalProcessed = 0;

    // Process until done
    while (!isDone) {
        // Fetch Batch with pagination
        // @ts-ignore - paginationOpts type is any in definition
        const result = await client.query(api.thumbnailMigration.getAllImagesBatch, {
            paginationOpts: {
                numItems: 20,
                cursor: cursor
            }
        });

        const batch = result.page;
        cursor = result.continueCursor;
        isDone = result.isDone;

        if (batch.length === 0) {
            console.log("✅ No more images returned. Migration complete.");
            break;
        }

        console.log(`Processing batch of ${batch.length}... (Total so far: ${totalProcessed})`);

        for (const image of batch) {
            try {
                process.stdout.write(`   Processing: ${image._id} (${image.contentType})... `);

                // Fetch Original
                const res = await fetch(image.url);
                if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
                const buffer = Buffer.from(await res.arrayBuffer());

                let thumbnailBuffer: Buffer;

                if (image.contentType.startsWith("video/")) {
                    thumbnailBuffer = await extractLocalThumbnail(buffer);
                } else {
                    // Use Jimp for images
                    const { Jimp } = await import("jimp");
                    const jimg = await Jimp.read(buffer);

                    // Crop and resize
                    const dim = Math.min(jimg.width, jimg.height);
                    jimg.crop({
                        x: (jimg.width - dim) / 2,
                        y: (jimg.height - dim) / 2,
                        w: dim, h: dim
                    });
                    jimg.resize({ w: 128, h: 128 });

                    // Increased quality to 80 to reduce artifacts
                    thumbnailBuffer = await jimg.getBuffer("image/jpeg", { quality: 80 });
                }

                // Upload
                const thumbKey = image.r2Key.replace(/^generated\//, "thumbnails/");
                const thumbUrl = await uploadToR2Raw(thumbnailBuffer, thumbKey, "image/jpeg");

                // Mutate
                await client.mutation(api.thumbnailMigration.updateImageThumbnail, {
                    imageId: image._id,
                    thumbnailR2Key: thumbKey,
                    thumbnailUrl: thumbUrl
                });

                console.log("✅ Done");

            } catch (e: any) {
                console.log(`❌ Failed: ${e.message || e}`);
            }
        }
        totalProcessed += batch.length;
    }

    console.log(`\n🎉 Migration successfully finished! Processed ${totalProcessed} images/videos.`);
}

main().catch(console.error);
