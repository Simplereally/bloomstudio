import { MusicStudioShell } from "@/components/studio/music/music-studio-shell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Music Studio",
  description: "Generate original music tracks with AI using Bloom Studio",
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * MusicStudioPage — Server Component route for /studio/music
 *
 * Follows the same pattern as the image studio page:
 * - Server Component renders immediately
 * - Client-side shell handles all interactivity
 */
export default function MusicStudioPage() {
  return <MusicStudioShell />
}
