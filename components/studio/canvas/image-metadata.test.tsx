import type { GeneratedImage } from "@/types/pollinations"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ImageMetadata } from "./image-metadata"

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

// Mock UI components to avoid Radix overhead
vi.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div hidden>{children}</div>,
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/ui/collapsible", async () => {
    const React = await import("react")
    const CollapsibleContext = React.createContext({ open: false, onOpenChange: (_open: boolean) => {} })

    return {
        Collapsible: ({ children, open, onOpenChange }: any) => (
            <CollapsibleContext.Provider value={{ open, onOpenChange }}>
                {children}
            </CollapsibleContext.Provider>
        ),
        CollapsibleTrigger: ({ children, onClick, ...props }: any) => {
            const ctx = React.useContext(CollapsibleContext)
            return (
                <button
                    onClick={(e) => {
                        onClick?.(e)
                        ctx.onOpenChange(!ctx.open)
                    }}
                    {...props}
                >
                    {children}
                </button>
            )
        },
        CollapsibleContent: ({ children }: any) => {
            const ctx = React.useContext(CollapsibleContext)
            return ctx.open ? <div>{children}</div> : null
        },
    }
})

describe("ImageMetadata", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Ensure clipboard mock exists
        if (!navigator.clipboard) {
            Object.assign(navigator, {
                clipboard: {
                    writeText: vi.fn().mockResolvedValue(undefined),
                },
            })
        } else {
             // If it exists (e.g. from previous tests), reset it to a spy if needed or just clear mocks
             if (!vi.isMockFunction(navigator.clipboard.writeText)) {
                  Object.assign(navigator.clipboard, {
                      writeText: vi.fn().mockResolvedValue(undefined)
                  })
             }
        }
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
            const user = userEvent.setup()
            // Spy on the method explicitly to ensure we capture the call on the current instance
            const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')
            
            render(<ImageMetadata image={mockImage} />)

            await user.click(screen.getByTestId("copy-prompt"))
            expect(writeTextSpy).toHaveBeenCalledWith(mockImage.prompt)
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
            const user = userEvent.setup()
            render(<ImageMetadata image={mockImage} variant="expanded" />)

            await user.click(screen.getByTestId("expand-params"))
            expect(screen.getByTestId("full-params")).toBeInTheDocument()
        })

        it("calls onCopyPrompt callback", async () => {
            const user = userEvent.setup()
            const onCopyPrompt = vi.fn()
            render(
                <ImageMetadata
                    image={mockImage}
                    variant="expanded"
                    onCopyPrompt={onCopyPrompt}
                />
            )

            await user.click(screen.getByTestId("copy-prompt"))
            expect(onCopyPrompt).toHaveBeenCalledTimes(1)
        })
    })

    it("applies custom className", () => {
        render(<ImageMetadata image={mockImage} className="custom-class" />)

        expect(screen.getByTestId("image-metadata")).toHaveClass("custom-class")
    })
})
