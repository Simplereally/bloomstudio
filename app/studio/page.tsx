import { cookies } from "next/headers"
import { StudioShell } from "@/components/studio"
import { getMyImagesPageCached } from "@/app/_server/cache/history"
import { getCurrentUserId } from "@/app/_server/convex/client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Studio",
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * StudioPage - Main studio page
 * Now a Server Component to handle layout persistence via cookies,
 * eliminating the hydration flash.
 * 
 * Also fetches initial gallery data from server cache to reduce
 * Convex bandwidth on initial page load.
 */
export default async function StudioPage() {
  const cookieStore = await cookies()
  const layoutCookie = cookieStore.get("studio-layout-v1")

  let defaultLayout: Record<string, number> | undefined = undefined

  if (layoutCookie) {
    try {
      defaultLayout = JSON.parse(layoutCookie.value)
    } catch (e) {
      console.error("Failed to parse layout cookie", e)
    }
  }

  // Fetch initial gallery page from server cache (if authenticated)
  const userId = await getCurrentUserId()
  const initialGalleryPage = userId 
    ? await getMyImagesPageCached(userId, null).catch(() => undefined)
    : undefined

  return (
    <StudioShell 
      defaultLayout={defaultLayout} 
      initialGalleryPage={initialGalleryPage}
    />
  )
}
