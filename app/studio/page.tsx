import { cookies } from "next/headers"
import { StudioShell } from "@/components/studio"
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

  return <StudioShell defaultLayout={defaultLayout} />
}
