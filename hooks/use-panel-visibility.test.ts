/**
 * @vitest-environment jsdom
 *
 * Tests for usePanelVisibility Hook
 */
import { describe, it, expect, vi, type Mock } from "vitest"
import { renderHook } from "@testing-library/react"
import type { PanelImperativeHandle } from "react-resizable-panels"
import { usePanelVisibility } from "./use-panel-visibility"

type MockPanel = {
    expand: Mock;
    collapse: Mock;
    getSize: Mock;
    resize: Mock;
    isExpanded: Mock;
    isCollapsed: Mock;
    getId: Mock;
}

describe("usePanelVisibility", () => {
    it("should not call expand/collapse on initial render", () => {
        const panelRef = {
            current: {
                expand: vi.fn(),
                collapse: vi.fn(),
                getSize: vi.fn(),
                resize: vi.fn(),
                isExpanded: vi.fn(),
                isCollapsed: vi.fn(),
            }
        } as unknown as React.RefObject<MockPanel>

        renderHook(() => usePanelVisibility(panelRef as unknown as React.RefObject<PanelImperativeHandle | null>, true))
        expect(panelRef.current!.expand).not.toHaveBeenCalled()
        expect(panelRef.current!.collapse).not.toHaveBeenCalled()
    })

    it("should call expand when isVisible changes to true", () => {
        const panelRef = {
            current: {
                expand: vi.fn(),
                collapse: vi.fn(),
            }
        } as unknown as React.RefObject<MockPanel>

        const { rerender } = renderHook(
            ({ isVisible }) => usePanelVisibility(panelRef as unknown as React.RefObject<PanelImperativeHandle | null>, isVisible),
            {
                initialProps: { isVisible: false }
            }
        )

        // First render skipped
        expect(panelRef.current!.expand).not.toHaveBeenCalled()

        // Rerender with isVisible = true
        rerender({ isVisible: true })
        expect(panelRef.current!.expand).toHaveBeenCalled()
    })

    it("should call collapse when isVisible changes to false", () => {
        const panelRef = {
            current: {
                expand: vi.fn(),
                collapse: vi.fn(),
            }
        } as unknown as React.RefObject<MockPanel>

        const { rerender } = renderHook(
            ({ isVisible }) => usePanelVisibility(panelRef as unknown as React.RefObject<PanelImperativeHandle | null>, isVisible),
            {
                initialProps: { isVisible: true }
            }
        )

        // First render skipped
        expect(panelRef.current!.collapse).not.toHaveBeenCalled()

        // Rerender with isVisible = false
        rerender({ isVisible: false })
        expect(panelRef.current!.collapse).toHaveBeenCalled()
    })

    it("should not call expand/collapse if isVisible remains the same", () => {
        const panelRef = {
            current: {
                expand: vi.fn(),
                collapse: vi.fn(),
            }
        } as unknown as React.RefObject<MockPanel>

        const { rerender } = renderHook(
            ({ isVisible }) => usePanelVisibility(panelRef as unknown as React.RefObject<PanelImperativeHandle | null>, isVisible),
            {
                initialProps: { isVisible: true }
            }
        )

        rerender({ isVisible: true })
        expect(panelRef.current!.expand).not.toHaveBeenCalled()
        expect(panelRef.current!.collapse).not.toHaveBeenCalled()
    })

    it("should handle null panelRef safely", () => {
        const panelRef = { current: null }

        const { rerender } = renderHook(
            ({ isVisible }) => usePanelVisibility(panelRef as unknown as React.RefObject<PanelImperativeHandle | null>, isVisible),
            {
                initialProps: { isVisible: false }
            }
        )

        expect(() => {
            rerender({ isVisible: true })
        }).not.toThrow()
    })

    it("should catch and ignore errors from panel methods", () => {
        const panelRef = {
            current: {
                expand: vi.fn().mockImplementation(() => {
                    throw new Error("Panel group not ready")
                }),
                collapse: vi.fn(),
            }
        } as unknown as React.RefObject<MockPanel>

        const { rerender } = renderHook(
            ({ isVisible }) => usePanelVisibility(panelRef as unknown as React.RefObject<PanelImperativeHandle | null>, isVisible),
            {
                initialProps: { isVisible: false }
            }
        )

        expect(() => {
            rerender({ isVisible: true })
        }).not.toThrow()
        expect(panelRef.current!.expand).toHaveBeenCalled()
    })
})
