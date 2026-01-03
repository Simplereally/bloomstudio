import { describe, it, expect, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SelectionProvider, useSelection, useSelectionMode, useIsSelected } from "./selection-context"

// Test component that uses the selection context
function TestConsumer() {
    const { 
        selectionMode, 
        selectedIds, 
        toggleSelectionMode,
        toggleSelection,
        selectAll,
        deselectAll,
    } = useSelection()
    
    return (
        <div>
            <span data-testid="selection-mode">{selectionMode ? "on" : "off"}</span>
            <span data-testid="selected-count">{selectedIds.size}</span>
            <span data-testid="selected-ids">{Array.from(selectedIds).join(",")}</span>
            <button data-testid="toggle-mode" onClick={toggleSelectionMode}>Toggle Mode</button>
            <button data-testid="toggle-item-1" onClick={() => toggleSelection("item-1")}>Toggle Item 1</button>
            <button data-testid="toggle-item-2" onClick={() => toggleSelection("item-2")}>Toggle Item 2</button>
            <button data-testid="select-all" onClick={() => selectAll(["item-1", "item-2", "item-3"])}>Select All</button>
            <button data-testid="deselect-all" onClick={deselectAll}>Deselect All</button>
        </div>
    )
}

// Test component for useSelectionMode hook
function SelectionModeConsumer() {
    const { selectionMode, toggleSelectionMode } = useSelectionMode()
    return (
        <div>
            <span data-testid="mode-only">{selectionMode ? "on" : "off"}</span>
            <button data-testid="toggle-mode-only" onClick={toggleSelectionMode}>Toggle</button>
        </div>
    )
}

// Test component for useIsSelected hook
function IsSelectedConsumer({ id }: { id: string }) {
    const isSelected = useIsSelected(id)
    return <span data-testid={`is-selected-${id}`}>{isSelected ? "yes" : "no"}</span>
}

describe("SelectionContext", () => {
    describe("SelectionProvider", () => {
        it("provides default state", () => {
            render(
                <SelectionProvider>
                    <TestConsumer />
                </SelectionProvider>
            )
            
            expect(screen.getByTestId("selection-mode")).toHaveTextContent("off")
            expect(screen.getByTestId("selected-count")).toHaveTextContent("0")
        })
        
        it("toggles selection mode", async () => {
            const user = userEvent.setup()
            render(
                <SelectionProvider>
                    <TestConsumer />
                </SelectionProvider>
            )
            
            expect(screen.getByTestId("selection-mode")).toHaveTextContent("off")
            
            await user.click(screen.getByTestId("toggle-mode"))
            expect(screen.getByTestId("selection-mode")).toHaveTextContent("on")
            
            await user.click(screen.getByTestId("toggle-mode"))
            expect(screen.getByTestId("selection-mode")).toHaveTextContent("off")
        })
        
        it("clears selection when exiting selection mode", async () => {
            const user = userEvent.setup()
            render(
                <SelectionProvider>
                    <TestConsumer />
                </SelectionProvider>
            )
            
            // Enter selection mode and select items
            await user.click(screen.getByTestId("toggle-mode"))
            await user.click(screen.getByTestId("toggle-item-1"))
            await user.click(screen.getByTestId("toggle-item-2"))
            expect(screen.getByTestId("selected-count")).toHaveTextContent("2")
            
            // Exit selection mode
            await user.click(screen.getByTestId("toggle-mode"))
            expect(screen.getByTestId("selected-count")).toHaveTextContent("0")
        })
        
        it("toggles individual item selection", async () => {
            const user = userEvent.setup()
            render(
                <SelectionProvider>
                    <TestConsumer />
                </SelectionProvider>
            )
            
            await user.click(screen.getByTestId("toggle-item-1"))
            expect(screen.getByTestId("selected-ids")).toHaveTextContent("item-1")
            
            await user.click(screen.getByTestId("toggle-item-2"))
            expect(screen.getByTestId("selected-ids")).toHaveTextContent("item-1,item-2")
            
            // Toggle off
            await user.click(screen.getByTestId("toggle-item-1"))
            expect(screen.getByTestId("selected-ids")).toHaveTextContent("item-2")
        })
        
        it("selects all items", async () => {
            const user = userEvent.setup()
            render(
                <SelectionProvider>
                    <TestConsumer />
                </SelectionProvider>
            )
            
            await user.click(screen.getByTestId("select-all"))
            expect(screen.getByTestId("selected-count")).toHaveTextContent("3")
        })
        
        it("deselects all items", async () => {
            const user = userEvent.setup()
            render(
                <SelectionProvider>
                    <TestConsumer />
                </SelectionProvider>
            )
            
            await user.click(screen.getByTestId("select-all"))
            expect(screen.getByTestId("selected-count")).toHaveTextContent("3")
            
            await user.click(screen.getByTestId("deselect-all"))
            expect(screen.getByTestId("selected-count")).toHaveTextContent("0")
        })
    })
    
    describe("useSelectionMode", () => {
        it("provides selection mode state", async () => {
            const user = userEvent.setup()
            render(
                <SelectionProvider>
                    <SelectionModeConsumer />
                </SelectionProvider>
            )
            
            expect(screen.getByTestId("mode-only")).toHaveTextContent("off")
            
            await user.click(screen.getByTestId("toggle-mode-only"))
            expect(screen.getByTestId("mode-only")).toHaveTextContent("on")
        })
    })
    
    describe("useIsSelected", () => {
        it("returns whether an item is selected", async () => {
            const user = userEvent.setup()
            render(
                <SelectionProvider>
                    <TestConsumer />
                    <IsSelectedConsumer id="item-1" />
                    <IsSelectedConsumer id="item-2" />
                </SelectionProvider>
            )
            
            expect(screen.getByTestId("is-selected-item-1")).toHaveTextContent("no")
            expect(screen.getByTestId("is-selected-item-2")).toHaveTextContent("no")
            
            await user.click(screen.getByTestId("toggle-item-1"))
            expect(screen.getByTestId("is-selected-item-1")).toHaveTextContent("yes")
            expect(screen.getByTestId("is-selected-item-2")).toHaveTextContent("no")
        })
    })
    
    describe("error handling", () => {
        it("throws when useSelection is used outside provider", () => {
            // Suppress console.error for this test
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
            
            expect(() => {
                render(<TestConsumer />)
            }).toThrow("useSelection must be used within a SelectionProvider")
            
            consoleSpy.mockRestore()
        })
    })
})
