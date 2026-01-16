import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Efficiently detect mobile viewport.
 * Uses useSyncExternalStore-like pattern to avoid hydration mismatch
 * and eliminate the extra render cycle from useEffect.
 */
export function useIsMobile() {
  // On server, we don't know - default to false (desktop-first)
  // On client, we can check immediately
  const getSnapshot = React.useCallback(() => {
    return typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  }, [])

  // Server snapshot always returns false to avoid hydration mismatch
  const getServerSnapshot = React.useCallback(() => false, [])

  // Subscribe to resize events
  const subscribe = React.useCallback((callback: () => void) => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", callback)
    window.addEventListener("resize", callback)
    return () => {
      mql.removeEventListener("change", callback)
      window.removeEventListener("resize", callback)
    }
  }, [])

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
