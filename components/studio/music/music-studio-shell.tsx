/**
 * MusicStudioShell — Main composition component for the Music Studio
 *
 * Suno-inspired 3-area layout:
 * - Left sidebar: Prompt input + Generation controls
 * - Main canvas: TopBar filter (All/Liked/Disliked) + scrollable track list
 * - Bottom bar: Spotify-style audio player (slides up when a track is selected)
 *
 * This component owns the fixed viewport behavior to prevent page scroll,
 * matching the image studio's viewport lock pattern.
 */

"use client"

import { cn } from "@/lib/utils"
import { useMusicGeneration } from "@/hooks/use-music-generation"
import { MusicPromptInput, type MusicPromptInputHandle } from "@/components/studio/music/music-prompt-input"
import { MusicGenerationControls } from "@/components/studio/music/music-generation-controls"
import { MusicTrackList } from "@/components/studio/music/music-track-list"
import { MusicPlayerBar } from "@/components/studio/music/music-player-bar"
import { MUSIC_MODEL_META } from "@/lib/music-api"
import { Sparkles, Heart, ThumbsDown, ListMusic, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as React from "react"

// ============================================================================
// Filter Types
// ============================================================================

type TrackFilter = "all" | "liked" | "disliked"

// ============================================================================
// Component
// ============================================================================

export function MusicStudioShell() {
  const {
    status: _status,
    currentTrack,
    tracks,
    error,
    isGenerating,
    inFlightCount,
    options,
    generate,
    cancel: _cancel,
    selectTrack,
    removeTrack,
    clearTracks,
    setOptions,
    setReaction,
    renameTrack,
  } = useMusicGeneration()

  const [filter, setFilter] = React.useState<TrackFilter>("all")
  const [isPlayerPlaying, setIsPlayerPlaying] = React.useState(false)
  const [hasPromptContent, setHasPromptContent] = React.useState(false)
  const promptInputRef = React.useRef<MusicPromptInputHandle>(null)

  // Lock viewport scroll (same pattern as StudioShell)
  React.useEffect(() => {
    document.body.setAttribute("data-fixed-viewport", "true")
    return () => {
      document.body.removeAttribute("data-fixed-viewport")
    }
  }, [])

  const modelMeta = MUSIC_MODEL_META[options.model]

  // Apply filter to tracks
  const filteredTracks = React.useMemo(() => {
    switch (filter) {
      case "liked":
        return tracks.filter((t) => t.reaction === "like")
      case "disliked":
        return tracks.filter((t) => t.reaction === "dislike")
      default:
        return tracks
    }
  }, [tracks, filter])

  // Navigate to previous/next track
  const completedTracks = React.useMemo(
    () => tracks.filter((t) => t.status === "done"),
    [tracks],
  )

  const handlePrevious = React.useCallback(() => {
    if (!currentTrack) return
    const idx = completedTracks.findIndex((t) => t.id === currentTrack.id)
    if (idx > 0) {
      selectTrack(completedTracks[idx - 1])
    }
  }, [currentTrack, completedTracks, selectTrack])

  const handleNext = React.useCallback(() => {
    if (!currentTrack) return
    const idx = completedTracks.findIndex((t) => t.id === currentTrack.id)
    if (idx < completedTracks.length - 1) {
      selectTrack(completedTracks[idx + 1])
    }
  }, [currentTrack, completedTracks, selectTrack])

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-hidden flex">
        {/* ================================================================ */}
        {/* Left Sidebar — Prompt + Controls                                 */}
        {/* ================================================================ */}
        <div className="w-full max-w-sm flex-shrink-0 border-r border-border/30 flex flex-col bg-card/30 backdrop-blur-sm">
          {/* Sidebar header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/30">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Music Generation</h2>
              <p className="text-[10px] text-muted-foreground/70">
                Powered by {modelMeta.label}
                {inFlightCount > 0 && (
                  <span className="ml-1.5 text-primary">
                    · {inFlightCount} generating
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Scrollable content area for prompt + controls */}
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
            {/* Prompt input */}
            <div className="p-4 border-b border-border/30">
              <MusicPromptInput
                ref={promptInputRef}
                onGenerate={generate}
                error={error}
                isInstrumental={options.instrumental}
                onHasContentChange={setHasPromptContent}
              />
            </div>

            {/* Generation controls */}
            <div className="p-4 overflow-y-auto">
              <MusicGenerationControls
                options={options}
                onOptionsChange={setOptions}
                disabled={false}
              />
            </div>
          </div>

          {/* Generate Button — pinned at bottom of sidebar */}
          <div className="p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] border-t border-border/30 bg-background/60">
            <Button
              onClick={() => promptInputRef.current?.submit()}
              disabled={!hasPromptContent}
              className="w-full h-11 text-base font-semibold"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>Generate Music</>
              )}
            </Button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Main Canvas — TopBar + Track List                                */}
        {/* ================================================================ */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Decorative background gradient */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                "w-[600px] h-[600px] rounded-full",
                "bg-gradient-to-br from-primary via-primary/50 to-transparent blur-3xl",
                "transition-all duration-1000 ease-out",
                (isGenerating || currentTrack)
                  ? "opacity-[0.05] scale-110"
                  : "opacity-[0.02] scale-100",
              )}
            />
          </div>

          {/* TopBar — Filter tabs */}
          <div className="relative z-10 flex items-center gap-1 px-4 py-2.5 border-b border-border/30 bg-card/20 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/15 border border-border/30">
              <FilterButton
                active={filter === "all"}
                onClick={() => setFilter("all")}
                icon={<ListMusic className="h-3 w-3" />}
                label="All"
                count={tracks.length}
              />
              <FilterButton
                active={filter === "liked"}
                onClick={() => setFilter("liked")}
                icon={<Heart className="h-3 w-3" />}
                label="Liked"
                count={tracks.filter((t) => t.reaction === "like").length}
              />
              <FilterButton
                active={filter === "disliked"}
                onClick={() => setFilter("disliked")}
                icon={<ThumbsDown className="h-3 w-3" />}
                label="Disliked"
                count={tracks.filter((t) => t.reaction === "dislike").length}
              />
            </div>

            {/* Clear all button — right side */}
            {tracks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2.5 text-[10px] text-muted-foreground/60 hover:text-destructive"
                onClick={clearTracks}
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Track list */}
          <div className="relative z-10 flex-1 min-h-0">
            <MusicTrackList
              tracks={filteredTracks}
              activeTrackId={currentTrack?.id}
              isPlaying={isPlayerPlaying}
              onSelectTrack={selectTrack}
              onReaction={setReaction}
              onRemoveTrack={removeTrack}
              onRenameTrack={renameTrack}
            />
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Bottom Player Bar                                                */}
      {/* ================================================================ */}
      <MusicPlayerBar
        track={currentTrack}
        onReaction={setReaction}
        onPlayingChange={setIsPlayerPlaying}
        onPrevious={completedTracks.length > 1 ? handlePrevious : undefined}
        onNext={completedTracks.length > 1 ? handleNext : undefined}
      />
    </div>
  )
}

// ============================================================================
// Filter Button
// ============================================================================

function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20",
      )}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            "text-[9px] tabular-nums ml-0.5",
            active ? "text-primary/70" : "text-muted-foreground/40",
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
