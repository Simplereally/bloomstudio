import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ImageMetadata } from "./image-metadata"
import type { GeneratedImage } from "@/types/pollinations"

const mockImage: GeneratedImage = {
    id: "test-1",
    url: "https://example.com/image.jpg",
    prompt: "A beautiful sunset over the ocean with vibrant colors",
    params: {
        prompt: "A beautiful sunset over the ocean with vibrant colors",
        width: 1024,
        height: 768,
        model: "flux-realism",
        seed: 12345,
        enhance: true,
        quality: "medium",
        private: false,
        nologo: false,
        nofeed: false,
        safe: false,
        transparent: false,
    },
    timestamp: Date.now(),
}

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
    },
})

describe("ImageMetadata", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders nothing when no image is provided", () => {
        render(<ImageMetadata image={null} />)

        expect(screen.queryByTestId("image-metadata")).not.toBeInTheDocument()
    })

    describe("Compact variant (default)", () => {
        it("renders the metadata container", () => {
            render(<ImageMetadata image={mockImage} />)

            expect(screen.getByTestId("image-metadata")).toBeInTheDocument()
        })

        it("displays the prompt text", () => {
            render(<ImageMetadata image={mockImage} />)

            expect(screen.getByText(mockImage.prompt)).toBeInTheDocument()
        })

        it("shows model badge", () => {
            render(<ImageMetadata image={mockImage} />)

            expect(screen.getByText("flux-realism")).toBeInTheDocument()
        })

        it("shows dimension badge", () => {
            render(<ImageMetadata image={mockImage} />)

            expect(screen.getByText("1024×768")).toBeInTheDocument()
        })

        it("shows seed badge when seed is set", () => {
            render(<ImageMetadata image={mockImage} />)

            expect(screen.getByText("12345")).toBeInTheDocument()
        })

        it("shows copy prompt button", () => {
            render(<ImageMetadata image={mockImage} />)

            expect(screen.getByTestId("copy-prompt")).toBeInTheDocument()
        })

        it("copies prompt to clipboard when button is clicked", async () => {
            render(<ImageMetadata image={mockImage} />)

            await userEvent.click(screen.getByTestId("copy-prompt"))
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockImage.prompt)
        })
    })

    describe("Expanded variant", () => {
        it("renders expanded view", () => {
            render(<ImageMetadata image={mockImage} variant="expanded" />)

            expect(screen.getByTestId("image-metadata")).toBeInTheDocument()
        })

        it("shows enhanced badge when enhance is true", () => {
            render(<ImageMetadata image={mockImage} variant="expanded" />)

            expect(screen.getByText("Enhanced")).toBeInTheDocument()
        })

        it("shows expand params button", () => {
            render(<ImageMetadata image={mockImage} variant="expanded" />)

            expect(screen.getByTestId("expand-params")).toBeInTheDocument()
        })

        it("expands to show full params when clicked", async () => {
            render(<ImageMetadata image={mockImage} variant="expanded" />)

            await userEvent.click(screen.getByTestId("expand-params"))
            expect(screen.getByTestId("full-params")).toBeInTheDocument()
        })

        it("calls onCopyPrompt callback", async () => {
            const onCopyPrompt = vi.fn()
            render(
                <ImageMetadata
                    image={mockImage}
                    variant="expanded"
                    onCopyPrompt={onCopyPrompt}
                />
            )

            await userEvent.click(screen.getByTestId("copy-prompt"))
            expect(onCopyPrompt).toHaveBeenCalledTimes(1)
        })
    })

    it("applies custom className", () => {
        render(<ImageMetadata image={mockImage} className="custom-class" />)

        expect(screen.getByTestId("image-metadata")).toHaveClass("custom-class")
    })
})
