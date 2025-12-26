/**
 * @vitest-environment jsdom
 * 
 * Tests for VisibilityToggle Component
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { VisibilityToggle } from "./visibility-toggle"
import { useMutation } from "convex/react"
import { toast } from "sonner"

// Mock Convex
const mockSetVisibility = vi.fn() as any
mockSetVisibility.withOptimisticUpdate = vi.fn().mockReturnValue(mockSetVisibility)

vi.mock("convex/react", () => ({
    useMutation: vi.fn(() => mockSetVisibility),
}))

// Mock Sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

describe("VisibilityToggle", () => {
    const imageId = "image123" as any

    beforeEach(() => {
        vi.clearAllMocks()
        // Reset withOptimisticUpdate to return the mock itself
        mockSetVisibility.withOptimisticUpdate.mockReturnValue(mockSetVisibility)
    })

    it("renders public state correctly", () => {
        render(<VisibilityToggle imageId={imageId} currentVisibility="public" />)
        expect(screen.getByTitle("Make unlisted")).toBeInTheDocument()
    })

    it("renders unlisted state correctly", () => {
        render(<VisibilityToggle imageId={imageId} currentVisibility="unlisted" />)
        expect(screen.getByTitle("Make public")).toBeInTheDocument()
    })

    it("calls mutation and shows toast on toggle", async () => {
        mockSetVisibility.mockResolvedValue({ success: true })

        render(<VisibilityToggle imageId={imageId} currentVisibility="unlisted" />)

        fireEvent.click(screen.getByRole("button"))

        await vi.waitFor(() => {
            expect(mockSetVisibility).toHaveBeenCalledWith({
                imageId,
                visibility: "public",
            })
            expect(toast.success).toHaveBeenCalledWith("Image is now public")
        })
    })

    it("handles error and shows error toast", async () => {
        mockSetVisibility.mockRejectedValue(new Error("Failed"))

        render(<VisibilityToggle imageId={imageId} currentVisibility="public" />)

        fireEvent.click(screen.getByRole("button"))

        await vi.waitFor(() => {
            expect(mockSetVisibility).toHaveBeenCalled()
            expect(toast.error).toHaveBeenCalledWith("Failed to update visibility")
        })
    })
})
