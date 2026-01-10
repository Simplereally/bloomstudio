import { Zap } from "lucide-react"

/**
 * Root Loading UI - Provides an instant shell for the application.
 * Part of Next.js 16 Best Practices for "Extremely Fast Content for Paint".
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16 animate-pulse">
            <Zap className="h-full w-full text-primary" />
            <div className="absolute inset-0 animate-ping opacity-20">
                <Zap className="h-full w-full text-primary" />
            </div>
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full animate-loading-bar bg-primary origin-left" />
        </div>
        <p className="text-sm font-medium animate-pulse text-muted-foreground">Bloom Studio</p>
      </div>
    </div>
  )
}
