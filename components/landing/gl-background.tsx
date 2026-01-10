"use client"

import { Leva } from "leva"
import dynamic from "next/dynamic"
import { Suspense } from "react"

/**
 * Dynamically import GL with SSR disabled - this ensures WebGL code
 * is never included in the server-rendered HTML, which is critical for SEO.
 */
const GL = dynamic(() => import("@/components/gl/gl").then((mod) => ({ default: mod.GL })), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-svh justify-between relative overflow-hidden">
    </div>
  ),
})

/**
 * WebGL background wrapper for the landing page.
 * This is a Client Component that handles:
 * - Dynamic import of the GL canvas (SSR disabled)
 * - Leva controls (hidden in production)
 * - Suspense boundary for loading state
 * 
 * Separated from the main page to ensure static content is server-rendered
 * while WebGL enhances the page on the client only.
 */
export function GLBackground() {
  return (
    <>
      {/* Override body background to allow backdrop-filter to see WebGL canvas */}
      <style>{`body { background: transparent !important; }`}</style>
      
      <Leva hidden />

      {/* GL Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Suspense
          fallback={
            <div className="absolute bg-background flex items-center justify-center">
              <div className="text-muted-foreground">Initializing...</div>
            </div>
          }
        >
          <GL hovering={true} />
        </Suspense>
      </div>
    </>
  )
}
