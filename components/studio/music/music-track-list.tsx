/**
 * MusicTrackList — ScrollArea wrapper for the track canvas
 *
 * Renders a scrollable list of MusicTrackRow components with
 * an empty-state placeholder when no tracks exist.
 */

"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { type MusicGenerationResult } from "@/lib/music-api"
import { MusicTrackRow } from "@/components/studio/music/music-track-row"
import { Music } from "lucide-react"

// ============================================================================
// Types
// ============================================================================

export interface MusicTrackListProps {
  /** All tracks (newest first) */
  tracks: MusicGenerationResult[]
  /** Currently selected track ID */
  activeTrackId?: string | null
  /** Whether the active track is playing */
  isPlaying?: boolean
  /** Select a track for playback */
  onSelectTrack: (track: MusicGenerationResult) => void
  /** Set a reaction on a track */
  onReaction: (trackId: string, reaction: "like" | "dislike") => void
  /** Remove a track */
  onRemoveTrack: (trackId: string) => void
  /** Additional class names */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function MusicTrackList({
  tracks,
  activeTrackId,
  isPlaying = false,
  onSelectTrack,
  onReaction,
  onRemoveTrack,
  className,
}: MusicTrackListProps) {
  if (tracks.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center h-full",
          "text-muted-foreground",
          className,
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/20 border border-border/30 mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <Music className="h-6 w-6 opacity-50" />
        </div>
        <p className="text-sm font-medium text-foreground/60">No tracks yet</p>
        <p className="text-xs text-muted-foreground/40 mt-1.5 max-w-xs leading-relaxed">
          Describe the music you want — style, mood, instruments, tempo, lyrics — and hit ⌘⏎ to generate.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-3 space-y-1">
        {tracks.map((track) => (
          <MusicTrackRow
            key={track.id}
            track={track}
            isActive={track.id === activeTrackId}
            isPlaying={track.id === activeTrackId && isPlaying}
            onSelect={onSelectTrack}
            onReaction={onReaction}
            onRemove={onRemoveTrack}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
