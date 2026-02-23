/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi, describe, it, expect } from "vitest"
import { ActiveFilterBadges, HistoryFiltersDropdown, type HistoryFilterState } from "./history-filters"
import * as React from "react"

// --- Mocks ---

// ResizeObserver mock for cmdk/radix
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

// scrollIntoView mock for cmdk
Element.prototype.scrollIntoView = vi.fn()

// PointerEvent mock for Radix UI
if (!global.PointerEvent) {
    class PointerEvent extends MouseEvent {
        public height: number
        public isPrimary: boolean
        public pointerId: number
        public pointerType: string
        public pressure: number
        public tangentialPressure: number
        public tiltX: number
        public tiltY: number
        public twist: number
        public width: number

        constructor(type: string, params: PointerEventInit = {}) {
            super(type, params)
            this.pointerId = params.pointerId || 0
            this.width = params.width || 0
            this.height = params.height || 0
            this.pressure = params.pressure || 0
            this.tangentialPressure = params.tangentialPressure || 0
            this.tiltX = params.tiltX || 0
            this.tiltY = params.tiltY || 0
            this.twist = params.twist || 0
            this.pointerType = params.pointerType || "mouse"
            this.isPrimary = params.isPrimary || false
        }
    }
     
    global.PointerEvent = PointerEvent as any
}

// Mock hasPointerCapture used by Radix
Element.prototype.hasPointerCapture = vi.fn(() => false)
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()

// Mock logic for MODEL_REGISTRY if needed, but the component imports it directly.
// We'll rely on the actual registry for now as it's likely a static config.
// However, to ensure tests are stable against config changes, we might want to mock it. 
// For now, let's assume the component will render whatever is in the registry.

describe("HistoryFilters", () => {
    describe("ActiveFilterBadges", () => {
        const emptyFilters: HistoryFilterState = {
            selectedVisibility: [],
            selectedModels: [],
        }

        it("renders nothing when no filters are selected", () => {
            const { container } = render(
                <ActiveFilterBadges filters={emptyFilters} onFiltersChange={vi.fn()} />
            )
            expect(container.firstChild).toBeNull()
        })

        it("renders visibility badges", async () => {
            const filters: HistoryFilterState = {
                selectedVisibility: ["public", "unlisted"],
                selectedModels: [],
            }
            const onFiltersChange = vi.fn()
            const user = userEvent.setup()

            render(<ActiveFilterBadges filters={filters} onFiltersChange={onFiltersChange} />)

            expect(screen.getByText("Public")).toBeInTheDocument()
            expect(screen.getByText("Private")).toBeInTheDocument()

            // Test removing a filter
            // The Badge component has the onClick handler.
            // visual content is like "Public <Icon />". getByText("Public") returns the Badge element (div) usually,
            // or a text node container. Clicking it should trigger the handler.
            await user.click(screen.getByText("Public"))

            expect(onFiltersChange).toHaveBeenCalledWith({
                selectedVisibility: ["unlisted"],
                selectedModels: [],
            })
        })

        it("renders model badges", async () => {
            // We assume "flux" or "turbo" etc. might be in the registry.
            // Using IDs we see in the code or seemingly generic ones.
            // Since we didn't mock the models module, we depend on real models.
            // Let's assume there's at least one model or use a generic one if the component handles unknown IDs gracefully
            // The component does: `model?.displayName || modelId`
            const filters: HistoryFilterState = {
                selectedVisibility: [],
                selectedModels: ["unknown-model-id"],
            }
            const onFiltersChange = vi.fn()
            const user = userEvent.setup()

            render(<ActiveFilterBadges filters={filters} onFiltersChange={onFiltersChange} />)

            // Should fall back to ID if not found in registry
            expect(screen.getByText("unknown-model-id")).toBeInTheDocument()

            // Test removing
            await user.click(screen.getByText("unknown-model-id"))

            expect(onFiltersChange).toHaveBeenCalledWith({
                selectedVisibility: [],
                selectedModels: [],
            })
        })
    })

    describe("HistoryFiltersDropdown", () => {
        const defaultFilters: HistoryFilterState = {
            selectedVisibility: [],
            selectedModels: [],
        }

        it("renders the trigger button correctly", () => {
            render(
                <HistoryFiltersDropdown
                    filters={defaultFilters}
                    onFiltersChange={vi.fn()}
                />
            )
            expect(screen.getByRole("button", { name: /filter history/i })).toBeInTheDocument()
            // Should not show badge count if 0
            expect(screen.queryByText("0")).not.toBeInTheDocument()
        })

        it("shows count badge on trigger when filters are active", () => {
            render(
                <HistoryFiltersDropdown
                    filters={{
                        selectedVisibility: ["public"],
                        selectedModels: ["model-1"],
                    }}
                    onFiltersChange={vi.fn()}
                />
            )
            // Expect count "2"
            expect(screen.getByText("2")).toBeInTheDocument()
        })

        it("opens popover and displays options", async () => {
            const user = userEvent.setup()
            render(
                <HistoryFiltersDropdown
                    filters={defaultFilters}
                    onFiltersChange={vi.fn()}
                />
            )

            const trigger = screen.getByRole("button", { name: /filter history/i })
            await user.click(trigger)

            // Popover content should be visible
            expect(screen.getByPlaceholderText("Search filters...")).toBeInTheDocument()
            expect(screen.getByText("Visibility")).toBeInTheDocument()
            expect(screen.getByText("Image Models")).toBeInTheDocument()
        })

        it("buffers changes until popover closes", async () => {
            const onFiltersChange = vi.fn()
            const user = userEvent.setup()
            render(
                <HistoryFiltersDropdown
                    filters={defaultFilters}
                    onFiltersChange={onFiltersChange}
                />
            )

            // Open
            await user.click(screen.getByRole("button", { name: /filter history/i }))

            // Click "Public" option
            // cmdk options are usually buttons or listitems. 
            // The component uses CommandItem which usually renders as div with role="option" or similar.
            // We can search by text.
            const publicOption = screen.getByText("Public")
            await user.click(publicOption)

            // Should NOT have triggered change yet
            expect(onFiltersChange).not.toHaveBeenCalled()

            // Close popover (click the trigger or press ESC)
            await user.keyboard("{Escape}")

            // Now it should have triggered
            expect(onFiltersChange).toHaveBeenCalledTimes(1)
            expect(onFiltersChange).toHaveBeenCalledWith({
                selectedVisibility: ["public"],
                selectedModels: [],
            })
        })

        it("handles 'Select all' for models", async () => {
            const onFiltersChange = vi.fn()
            const user = userEvent.setup()
            render(
                <HistoryFiltersDropdown
                    filters={defaultFilters}
                    onFiltersChange={onFiltersChange}
                />
            )

            await user.click(screen.getByRole("button", { name: /filter history/i }))

            // Find "Select all" button
            const selectAllBtn = screen.getByText("Select all")
            await user.click(selectAllBtn)

            await user.keyboard("{Escape}")

            expect(onFiltersChange).toHaveBeenCalled()
            const calledArg = onFiltersChange.mock.calls[0][0] as HistoryFilterState
            // Should have models selected
            expect(calledArg.selectedModels.length).toBeGreaterThan(0)
        })

        it("handles 'Clear' for models", async () => {
            const filters: HistoryFilterState = {
                selectedVisibility: [],
                selectedModels: ["some-model"],
            }
            const onFiltersChange = vi.fn()
            const user = userEvent.setup()
            render(
                <HistoryFiltersDropdown
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                />
            )

            await user.click(screen.getByRole("button", { name: /filter history/i })) // aria-label is "Filter history (1 active)"

            const clearModelsBtn = screen.getByText("Clear") // Warning: there is also "Clear all filters" at bottom
            // The one in the models section is just "Clear". The one at bottom is "Clear all filters"
            // Let's be specific or rely on order. "Clear" usually appears first in Image Models group
            // We can use getAllByText if needed.

            // Assuming "Clear" is unique enough or we scope it.
            // The header has "Select all" and "Clear" buttons next to each other
            await user.click(clearModelsBtn)

            await user.keyboard("{Escape}")

            expect(onFiltersChange).toHaveBeenCalledWith({
                selectedVisibility: [],
                selectedModels: [],
            })
        })

        it("handles 'Clear all filters' footer button", async () => {
            const filters: HistoryFilterState = {
                selectedVisibility: ["public"],
                selectedModels: ["model-1"],
            }
            const onFiltersChange = vi.fn()
            const user = userEvent.setup()
            render(
                <HistoryFiltersDropdown
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                />
            )

            await user.click(screen.getByRole("button"))

            const clearAllBtn = screen.getByText("Clear all filters")
            await user.click(clearAllBtn)

            await user.keyboard("{Escape}")

            expect(onFiltersChange).toHaveBeenCalledWith({
                selectedVisibility: [],
                selectedModels: [],
            })
        })

        it("syncs internal state when props change while closed", () => {
            const onFiltersChange = vi.fn()
            const { rerender } = render(
                <HistoryFiltersDropdown
                    filters={defaultFilters}
                    onFiltersChange={onFiltersChange}
                />
            )

            // Update props
            rerender(
                <HistoryFiltersDropdown
                    filters={{ selectedVisibility: ["public"], selectedModels: [] }}
                    onFiltersChange={onFiltersChange}
                />
            )

            // Verify visual update (badge count)
            expect(screen.getByText("1")).toBeInTheDocument()
        })
    })
})
