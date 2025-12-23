// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { ModelSelector } from "./model-selector"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ImageModelInfo } from "@/lib/schemas/pollinations.schema"

// Mock the useImageModels hook
const mockModels: ImageModelInfo[] = [
    {
        name: "flux",
        aliases: ["default"],
        pricing: { currency: "pollen" },
        description: "Fast image generation",
    },
    {
        name: "turbo",
        aliases: [],
        pricing: { currency: "pollen" },
        description: "High-speed generation",
    },
]

const mockUseImageModels = vi.fn()

vi.mock("@/hooks/queries", () => ({
    useImageModels: () => mockUseImageModels(),
}))

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    })
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
    Wrapper.displayName = "TestQueryWrapper"
    return Wrapper
}

describe("ModelSelector", () => {
    const defaultProps = {
        value: "flux",
        onChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockUseImageModels.mockReturnValue({
            models: mockModels,
            isLoading: false,
            isError: false,
            getModel: (name: string) => mockModels.find((m) => m.name === name),
        })
    })

    it("renders with current model value", () => {
        render(<ModelSelector {...defaultProps} />, { wrapper: createWrapper() })
        
        expect(screen.getByTestId("model-selector")).toBeInTheDocument()
        expect(screen.getByRole("combobox")).toHaveTextContent("Flux")
    })

    it("shows loading skeleton when loading", () => {
        mockUseImageModels.mockReturnValue({
            models: [],
            isLoading: true,
            isError: false,
            getModel: () => undefined,
        })

        render(<ModelSelector {...defaultProps} />, { wrapper: createWrapper() })
        
        expect(screen.getByText("Model")).toBeInTheDocument()
        // Skeleton should be visible (no combobox when loading)
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    })

    it("shows offline badge when there is an error", () => {
        mockUseImageModels.mockReturnValue({
            models: mockModels,
            isLoading: false,
            isError: true,
            getModel: (name: string) => mockModels.find((m) => m.name === name),
        })

        render(<ModelSelector {...defaultProps} />, { wrapper: createWrapper() })
        
        expect(screen.getByText("Offline")).toBeInTheDocument()
    })

    it("disables select when disabled prop is true", () => {
        render(<ModelSelector {...defaultProps} disabled />, {
            wrapper: createWrapper(),
        })
        
        expect(screen.getByRole("combobox")).toBeDisabled()
    })

    it("capitalizes model names for display", () => {
        render(<ModelSelector {...defaultProps} />, { wrapper: createWrapper() })
        
        // Should display "Flux" not "flux" in the trigger
        expect(screen.getByRole("combobox")).toHaveTextContent("Flux")
    })

    it("displays different model when value changes", () => {
        render(
            <ModelSelector {...defaultProps} value="turbo" />,
            { wrapper: createWrapper() }
        )
        
        expect(screen.getByRole("combobox")).toHaveTextContent("Turbo")
    })

    // Note: Tests that interact with Radix Select dropdown items are skipped
    // due to jsdom limitations with hasPointerCapture. Use e2e tests for full interaction testing.
})
