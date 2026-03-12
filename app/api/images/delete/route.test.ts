import crypto from "crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"

const { mockAuth, mockDeleteImage } = vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockDeleteImage: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({
    auth: mockAuth,
}))

vi.mock("@/lib/storage", () => ({
    deleteImage: mockDeleteImage,
}))

function buildRequest(body: string): NextRequest {
    return new NextRequest("http://localhost:3000/api/images/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
    })
}

describe("/api/images/delete", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it("returns 400 for malformed JSON payloads", async () => {
        mockAuth.mockResolvedValue({ userId: "user_123" })

        const response = await POST(buildRequest("{"))
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data).toEqual({
            success: false,
            error: {
                code: "INVALID_JSON",
                message: "Invalid JSON body",
            },
        })
        expect(mockDeleteImage).not.toHaveBeenCalled()
    })

    it("returns 400 when r2Key is missing", async () => {
        mockAuth.mockResolvedValue({ userId: "user_123" })

        const response = await POST(buildRequest(JSON.stringify({})))
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data).toEqual({
            success: false,
            error: {
                code: "MISSING_KEY",
                message: "Missing r2Key",
            },
        })
    })

    it("returns 403 when user does not own the object key", async () => {
        mockAuth.mockResolvedValue({ userId: "user_123" })

        const otherUserHash = crypto.createHash("sha256").update("different_user").digest("hex")
        const response = await POST(buildRequest(JSON.stringify({ r2Key: `generated/${otherUserHash}/image.png` })))
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data).toEqual({
            success: false,
            error: {
                code: "FORBIDDEN",
                message: "Not authorized to delete this image",
            },
        })
        expect(mockDeleteImage).not.toHaveBeenCalled()
    })

    it("deletes object when authenticated user owns the key", async () => {
        const userId = "user_123"
        mockAuth.mockResolvedValue({ userId })

        const userHash = crypto.createHash("sha256").update(userId).digest("hex")
        const r2Key = `generated/${userHash}/image.png`

        const response = await POST(buildRequest(JSON.stringify({ r2Key })))
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({ success: true })
        expect(mockDeleteImage).toHaveBeenCalledWith(r2Key)
    })
})
