import { FavoritesClient } from "@/components/gallery/favorites-client"
import { getFavoritesPageCached } from "@/app/_server/cache/favorites"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Your Favorites | Bloom Studio",
  description: "View all your favorited images in one place.",
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Favorites page - displays all images favorited by the current user.
 * Fetches initial page from server-side cache for faster load and reduced Convex bandwidth.
 */
export default async function FavoritesPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Fetch initial page on server (cached per-user)
  const initialPage = await getFavoritesPageCached(userId, null)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Favorites</h1>
          <p className="text-muted-foreground">
            Images {"you've"} loved from across the community.
          </p>
        </div>
        <FavoritesClient initialPage={initialPage} />
      </div>
    </div>
  )
}

