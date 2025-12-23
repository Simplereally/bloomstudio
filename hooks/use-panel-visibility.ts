"use client"

import * as React from "react"
// Note: This project uses react-resizable-panels@4.0.13, which is a major update from previous versions.
import type { PanelImperativeHandle } from "react-resizable-panels"

/**
 * Hook to safely control panel visibility (expand/collapse)
 * Handles the race condition where the panel group may not be
 * fully registered on initial render.
 */
export function usePanelVisibility(
    panelRef: React.RefObject<PanelImperativeHandle | null>,
    isVisible: boolean
) {
    const hasMounted = React.useRef(false)
    const prevVisible = React.useRef(isVisible)

    React.useEffect(() => {
        // Skip the first render - panel group isn't registered yet
        if (!hasMounted.current) {
            hasMounted.current = true
            prevVisible.current = isVisible
            return
        }

        // Only act if the visibility state actually changed
        if (prevVisible.current === isVisible) {
            return
        }

        const panel = panelRef.current
        if (!panel) return

        try {
            if (isVisible) {
                panel.expand()
            } else {
                panel.collapse()
            }
            prevVisible.current = isVisible
        } catch {
            // Panel group not ready - safe to ignore, initial state is correct
        }
    }, [panelRef, isVisible])
}
