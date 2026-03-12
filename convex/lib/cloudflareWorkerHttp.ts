import { httpAction } from "../_generated/server"
import { z } from "zod"

const workerSecretHeader = "x-bloomstudio-worker-secret"

export const nonEmptyStringSchema = z.string().min(1)
export const positiveIntSchema = z.number().int().positive()
export const nonNegativeIntSchema = z.number().int().nonnegative()
export const workerIdSchema = z.string()
export const generationResultSchema = z.object({
    r2Key: nonEmptyStringSchema,
    url: z.string().url(),
    width: positiveIntSchema,
    height: positiveIntSchema,
    seed: nonNegativeIntSchema.optional(),
    contentType: nonEmptyStringSchema,
    sizeBytes: nonNegativeIntSchema,
})
export const secondaryAssetsResultSchema = z.object({
    thumbnailR2Key: nonEmptyStringSchema.optional(),
    thumbnailUrl: z.string().url().optional(),
    previewR2Key: nonEmptyStringSchema.optional(),
    previewUrl: z.string().url().optional(),
})

type WorkerHttpHandler = Parameters<typeof httpAction>[0]
export type WorkerHttpContext = Parameters<WorkerHttpHandler>[0]

function unauthorized(): Response {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
}

function badRequest(message: string): Response {
    return Response.json({ ok: false, error: message }, { status: 400 })
}

async function validateWorkerSecret(request: Request): Promise<boolean> {
    const provided = request.headers.get(workerSecretHeader)
    const expected = process.env.BLOOMSTUDIO_WORKER_SHARED_SECRET
    return !!provided && !!expected && provided === expected
}

export function createWorkerHttpAction(
    schema: z.ZodTypeAny,
    handler: (ctx: WorkerHttpContext, body: unknown) => Promise<unknown>
) {
    return httpAction(async (ctx, request) => {
        if (!(await validateWorkerSecret(request))) {
            return unauthorized()
        }

        let json: unknown
        try {
            json = await request.json()
        } catch {
            return badRequest("Invalid JSON body")
        }

        const parsed = schema.safeParse(json)
        if (!parsed.success) {
            return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
        }

        const result = await handler(ctx, parsed.data)
        return Response.json(result)
    })
}
