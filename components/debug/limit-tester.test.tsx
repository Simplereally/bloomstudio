import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { LimitTester } from "./limit-tester"

// Mock Next.js Image
vi.mock("next/image", () => ({
    default: ({ src, alt, onLoadingComplete, ...props }: { 
        src: string
        alt: string
        onLoadingComplete?: (img: { naturalWidth: number; naturalHeight: number }) => void
        [key: string]: unknown 
    }) => (
        <img 
            src={src} 
            alt={alt} 
            {...props} 
            data-testid="next-image"
            onLoad={() => {
                onLoadingComplete?.({ naturalWidth: 1024, naturalHeight: 1024 })
            }}
        />
    ),
}))

// Mock Convex hooks
vi.mock("convex/react", () => ({
    useQuery: vi.fn(() => undefined),
    useMutation: vi.fn(() => vi.fn()),
}))

// Mock pollen auth
vi.mock("@/lib/pollen-auth", () => ({
    usePollenApiKey: vi.fn(() => "test-api-key"),
    usePollenAuthActions: vi.fn(() => ({ authorize: vi.fn() })),
}))

// Mock hooks
vi.mock("@/hooks", () => ({
    useRandomSeed: vi.fn(() => ({ generateSeed: vi.fn(() => 12345) })),
}))

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: { error: vi.fn(), success: vi.fn() },
}))

describe("LimitTester", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the header correctly", () => {
        render(<LimitTester />)
        expect(screen.getByText("Model Limit Tester")).toBeInTheDocument()
    })

    it("renders model selector", () => {
        render(<LimitTester />)
        expect(screen.getByText("Model")).toBeInTheDocument()
    })

    it("renders prompt textarea", () => {
        render(<LimitTester />)
        expect(screen.getByText("Prompt")).toBeInTheDocument()
        const textarea = screen.getByRole("textbox")
        expect(textarea).toHaveValue("A glitch art masterpiece of a cyberpunk city, extremely detailed")
    })

    it("renders dimension inputs with default values", () => {
        render(<LimitTester />)
        expect(screen.getByText("Width (px)")).toBeInTheDocument()
        expect(screen.getByText("Height (px)")).toBeInTheDocument()
        
        const inputs = screen.getAllByRole("spinbutton")
        expect(inputs[0]).toHaveValue(1024)
        expect(inputs[1]).toHaveValue(1024)
    })

    it("renders quick preset buttons", () => {
        render(<LimitTester />)
        expect(screen.getByText("Quick Presets")).toBeInTheDocument()
        expect(screen.getByText("SQUARE (1:1)")).toBeInTheDocument()
        expect(screen.getByText("TALL (Portrait)")).toBeInTheDocument()
        expect(screen.getByText("WIDE (Landscape)")).toBeInTheDocument()
    })

    it("updates dimensions when preset is clicked", () => {
        render(<LimitTester />)
        
        // Use a unique preset - 2048x2048 only exists in square presets
        const preset2048 = screen.getByRole("button", { name: "2048x2048" })
        fireEvent.click(preset2048)
        
        const inputs = screen.getAllByRole("spinbutton")
        expect(inputs[0]).toHaveValue(2048)
        expect(inputs[1]).toHaveValue(2048)
    })

    it("displays megapixel calculation", () => {
        render(<LimitTester />)
        // 1024 * 1024 = 1,048,576 pixels = 1.05 MP
        expect(screen.getByText(/Pixels:.*1\.05MP/)).toBeInTheDocument()
    })

    it("displays aspect ratio", () => {
        render(<LimitTester />)
        // 1024 / 1024 = 1.00
        expect(screen.getByText(/Ratio:.*1\.00/)).toBeInTheDocument()
    })

    it("renders test generation button", () => {
        render(<LimitTester />)
        expect(screen.getByRole("button", { name: "TEST GENERATION" })).toBeInTheDocument()
    })

    it("shows no results placeholder initially", () => {
        render(<LimitTester />)
        expect(screen.getByText("No results yet")).toBeInTheDocument()
    })
})
