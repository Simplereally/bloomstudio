/**
 * @vitest-environment jsdom
 * 
 * Tests for SelectionToolbar Component
 */
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SelectionToolbar } from "./selection-toolbar"

describe("SelectionToolbar", () => {
    const defaultProps = {
        selectionMode: false,
        onToggleSelectionMode: vi.fn(),
        selectedCount: 0,
        totalCount: 10,
        onSelectAll: vi.fn(),
        onDeselectAll: vi.fn(),
        onDeleteSelected: vi.fn(),
        onSetVisibility: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders 'Select' button when selectionMode is false", () => {
        render(<SelectionToolbar {...defaultProps} />)
        
        const selectButton = screen.getByRole("button", { name: /^select$/i })
        expect(selectButton).toBeInTheDocument()
    })

    it("disables 'Select' button when totalCount is 0", () => {
        render(<SelectionToolbar {...defaultProps} totalCount={0} />)
        
        const selectButton = screen.getByRole("button", { name: /^select$/i })
        expect(selectButton).toBeDisabled()
    })

    it("renders 'Select All', 'Done' and NO actions when selectionMode is true and count is 0", () => {
        render(<SelectionToolbar {...defaultProps} selectionMode={true} />)
        
        expect(screen.getByRole("button", { name: /select all/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument()
        expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument()
    })

    it("renders 'Deselect All' when all items are selected", () => {
        render(
            <SelectionToolbar 
                {...defaultProps} 
                selectionMode={true} 
                selectedCount={10} 
                totalCount={10} 
            />
        )
        
        expect(screen.getByRole("button", { name: /deselect all/i })).toBeInTheDocument()
    })

    it("renders 'Actions' button with count when items are selected", () => {
        render(
            <SelectionToolbar 
                {...defaultProps} 
                selectionMode={true} 
                selectedCount={5} 
            />
        )
        
        expect(screen.getByRole("button", { name: /actions \(5\)/i })).toBeInTheDocument()
    })

    it("shows dropdown options when Actions button is clicked", async () => {
        const user = userEvent.setup()
        render(
            <SelectionToolbar 
                {...defaultProps} 
                selectionMode={true} 
                selectedCount={5} 
            />
        )
        
        const actionsButton = screen.getByRole("button", { name: /actions/i })
        await user.click(actionsButton)
        
        // Wait for dropdown content to appear
        expect(await screen.findByText(/make public/i)).toBeInTheDocument()
        expect(await screen.findByText(/make private/i)).toBeInTheDocument()
        expect(await screen.findByText(/delete selected/i)).toBeInTheDocument()
    })

    it("hides visibility options when onSetVisibility is not provided", async () => {
        const user = userEvent.setup()
        render(
            <SelectionToolbar 
                {...defaultProps} 
                selectionMode={true} 
                selectedCount={5} 
                onSetVisibility={undefined}
            />
        )
        
        const actionsButton = screen.getByRole("button", { name: /actions/i })
        await user.click(actionsButton)
        
        expect(screen.queryByText(/make public/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/make private/i)).not.toBeInTheDocument()
        expect(await screen.findByText(/delete selected/i)).toBeInTheDocument()
    })

    it("disables all buttons during loading states", () => {
        render(
            <SelectionToolbar 
                {...defaultProps} 
                selectionMode={true} 
                selectedCount={5} 
                isDeleting={true}
            />
        )
        
        expect(screen.getByRole("button", { name: /select all/i })).toBeDisabled()
        expect(screen.getByRole("button", { name: /actions/i })).toBeDisabled()
        expect(screen.getByRole("button", { name: /done/i })).toBeDisabled()
    })

    it("shows loading spinner in Actions button when loading", () => {
        const { container } = render(
            <SelectionToolbar 
                {...defaultProps} 
                selectionMode={true} 
                selectedCount={5} 
                isUpdatingVisibility={true}
            />
        )
        
        const loader = container.querySelector(".animate-spin")
        expect(loader).toBeInTheDocument()
    })

    it("calls onToggleSelectionMode when Select or Done is clicked", async () => {
        const user = userEvent.setup()
        const onToggleSelectionMode = vi.fn()
        const { rerender } = render(
            <SelectionToolbar {...defaultProps} onToggleSelectionMode={onToggleSelectionMode} />
        )
        
        await user.click(screen.getByRole("button", { name: /^select$/i }))
        expect(onToggleSelectionMode).toHaveBeenCalledTimes(1)

        rerender(
            <SelectionToolbar 
                {...defaultProps} 
                selectionMode={true} 
                onToggleSelectionMode={onToggleSelectionMode} 
            />
        )
        await user.click(screen.getByRole("button", { name: /done/i }))
        expect(onToggleSelectionMode).toHaveBeenCalledTimes(2)
    })
})
