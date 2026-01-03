import { redirect } from "next/navigation"

/**
 * Feed index page - redirects to the public feed.
 * This ensures /feed always has a consistent destination.
 */
export default function FeedPage() {
    redirect("/feed/public")
}
