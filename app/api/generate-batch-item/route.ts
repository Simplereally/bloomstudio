/**
 * POST /api/generate-batch-item
 *
 * Internal endpoint for Convex batch generation action.
 * Generates a single image as part of a batch job.
 */
import { api } from "@/convex/_generated/api"
import { getAuthorizationHeader, hasSecretKey } from "@/lib/auth"
import { PollinationsApiError, isFluxModelUnavailable } from "@/lib/errors"
import { PollinationsAPI } from "@/lib/pollinations-api"
import { generateImageKey, uploadImage } from "@/lib/storage"
import { fetchMutation } from "convex/nextjs"
import { NextRequest, NextResponse } from "next/server"

interface BatchItemRequest {
    batchJobId: string
    itemIndex: number
    ownerId: string
    generationParams: {
        prompt: string
        negativePrompt?: string
        model?: string
        width?: number
        height?: number
        seed?: number
        enhance?: boolean
        private?: boolean
        safe?: boolean
        image?: string
    }
}

interface BatchItemSuccessResponse {
    success: true
    imageId: string
}

interface BatchItemErrorResponse {
    success: false
    error: string
}

type BatchItemResponse = BatchItemSuccessResponse | BatchItemErrorResponse

export async function POST(request: NextRequest): Promise<NextResponse<BatchItemResponse>> {
    try {
        // Check if secret key is configured
        if (!hasSecretKey()) {
            return NextResponse.json(
                { success: false, error: "Server-side generation not configured" },
                { status: 503 }
            )
        }

        // Parse request body
        const body: BatchItemRequest = await request.json()
        const { batchJobId, itemIndex, ownerId, generationParams } = body

        if (!batchJobId || !ownerId || !generationParams?.prompt) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            )
        }

        // For batch items, generate a unique seed per item if not locked
        // This ensures variety in batch generations
        const effectiveSeed = generationParams.seed !== undefined && generationParams.seed >= 0
            ? generationParams.seed
            : Math.floor(Math.random() * 1844674407370955)

        const params = {
            ...generationParams,
            seed: effectiveSeed,
        }

        // Build the generation URL
        const generationUrl = PollinationsAPI.buildImageUrl(params)

        // Get the secret key authorization header
        const secretKey = process.env.POLLINATIONS_SECRET_KEY
        const authHeader = getAuthorizationHeader(secretKey)

        console.log(`[/api/generate-batch-item] Batch ${batchJobId}, item ${itemIndex}: ${generationUrl}`)

        // Make the request to Pollinations API
        const response = await fetch(generationUrl, {
            method: "GET",
            headers: {
                ...(authHeader && { Authorization: authHeader }),
            },
            cache: "no-store",
        })

        if (!response.ok) {
            const apiError = await PollinationsApiError.fromResponse(response)
            console.error(`[/api/generate-batch-item] Pollinations API error:`, apiError.toJSON())

            if (isFluxModelUnavailable(apiError.message)) {
                return NextResponse.json(
                    { success: false, error: "Model temporarily unavailable" },
                    { status: 503 }
                )
            }

            return NextResponse.json(
                { success: false, error: apiError.message },
                { status: apiError.status }
            )
        }

        // Consume the response body to ensure the image is fully generated
        const imageBuffer = await response.arrayBuffer()
        const contentType = response.headers.get("content-type") || "image/jpeg"
        const imageData = Buffer.from(imageBuffer)

        // Generate unique R2 key and upload to storage
        const r2Key = generateImageKey(ownerId, "generated", contentType)
        const uploadResult = await uploadImage({
            data: imageData,
            contentType,
            key: r2Key,
        })

        console.log(`[/api/generate-batch-item] Uploaded to R2: ${r2Key}`)

        // Store image metadata in Convex
        const imageId = await fetchMutation(api.generatedImages.create, {
            visibility: params.private ? "unlisted" : "public",
            r2Key: uploadResult.key,
            url: uploadResult.url,
            filename: `batch_${batchJobId}_${itemIndex}`,
            contentType,
            sizeBytes: uploadResult.sizeBytes,
            width: params.width,
            height: params.height,
            prompt: params.prompt,
            model: params.model || "zimage",
            seed: effectiveSeed,
            generationParams: params,
        })

        return NextResponse.json({
            success: true,
            imageId: imageId as string,
        })
    } catch (error) {
        console.error("[/api/generate-batch-item] Unexpected error:", error)
        return NextResponse.json(
            { success: false, error: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
