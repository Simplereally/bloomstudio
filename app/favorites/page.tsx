import { FavoritesClient } from "@/components/gallery/favorites-client";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Your Favorites | Bloom Studio",
  description: "View all your favorited images in one place.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Favorites page - displays all images favorited by the current user.
 */
export default async function FavoritesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Favorites</h1>
          <p className="text-muted-foreground">Images {"you've"} loved from across the community.</p>
        </div>
        <FavoritesClient />
      </div>
    </div>
  );
}
