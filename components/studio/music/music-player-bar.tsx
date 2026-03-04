/**
 * MusicPlayerBar — Spotify-style sticky bottom audio player bar
 *
 * Features:
 * - Slides up from the bottom when a track is selected
 * - Play/pause, progress scrubbing, time display
 * - Track info (prompt excerpt, model badge)
 * - Like/dislike reactions
 * - Download button (right section)
 * - Lyrics toggle with glassmorphism popover panel (right section)
 * - Responsive and keyboard accessible
 *
 * Layout: [Track Info + Reactions] — [Playback Controls] — [Download · Lyrics · Time]
 */

"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  formatMusicDuration,
  MUSIC_MODEL_META,
  type MusicGenerationResult,
} from "@/lib/music-api"
import {
  Download,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import * as React from "react"

// ============================================================================
// Types
// ============================================================================

export interface MusicPlayerBarProps {
  /** The track to play */
  track: MusicGenerationResult | null
  /** Callback for reaction changes */
  onReaction: (trackId: string, reaction: "like" | "dislike") => void
  /** Callback when playing state changes — parent tracks this for TrackRow icons */
  onPlayingChange?: (isPlaying: boolean) => void
  /** Navigate to previous track */
  onPrevious?: () => void
  /** Navigate to next track */
  onNext?: () => void
  /** Additional class names */
  className?: string
}

// ============================================================================
// Lyrics Panel
// ============================================================================

function LyricsPanel({
  lyrics,
  onClose,
}: {
  lyrics: string
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "absolute bottom-full right-4 mb-3 w-80 max-h-[360px]",
        "rounded-2xl overflow-hidden",
        // Glassmorphism: blurred, semi-transparent card
        "bg-card/70 dark:bg-card/60 backdrop-blur-2xl backdrop-saturate-150",
        "border border-border/40 dark:border-white/[0.08]",
        "shadow-[0_-8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)]",
        // Subtle inner highlight
        "ring-1 ring-inset ring-white/10 dark:ring-white/[0.04]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Mic2 className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Lyrics
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-muted/30"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Divider with gradient fade */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* Lyrics body */}
      <ScrollArea className="max-h-[290px]">
        <div className="px-4 py-3">
          <p className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-wrap font-[425] tracking-tight">
            {lyrics}
          </p>
        </div>
      </ScrollArea>

      {/* Bottom fade overlay for scroll indication */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/70 dark:from-card/60 to-transparent" />
    </motion.div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function MusicPlayerBar({
  track,
  onReaction,
  onPlayingChange,
  onPrevious,
  onNext,
  className,
}: MusicPlayerBarProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const progressRef = React.useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [isSeeking, setIsSeeking] = React.useState(false)
  const [showLyrics, setShowLyrics] = React.useState(false)

  // Close lyrics panel when track changes
  const prevTrackIdRef = React.useRef<string | null>(null)

  // Notify parent of playing state changes
  React.useEffect(() => {
    onPlayingChange?.(isPlaying)
  }, [isPlaying, onPlayingChange])

  // Release seeking state when mouse is released anywhere on the page
  React.useEffect(() => {
    if (!isSeeking) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const audio = audioRef.current
      const bar = progressRef.current
      if (!audio || !bar || !duration) return

      const rect = bar.getBoundingClientRect()
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const newTime = fraction * duration
      setCurrentTime(newTime)
      audio.currentTime = newTime
    }

    const handleGlobalMouseUp = () => setIsSeeking(false)

    document.addEventListener("mousemove", handleGlobalMouseMove)
    document.addEventListener("mouseup", handleGlobalMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isSeeking, duration])

  // Auto-play when a new track arrives
  React.useEffect(() => {
    if (track && track.status === "done" && track.id !== prevTrackIdRef.current) {
      // Close lyrics panel on track change
      setShowLyrics(false)
      prevTrackIdRef.current = track.id
      const audio = audioRef.current
      if (audio) {
        audio.src = track.audioUrl
        audio.load()
        audio.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false)
        })
      }
    }
  }, [track])

  // Time update handler
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime)
      }
    }
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("durationchange", onDurationChange)
    audio.addEventListener("loadedmetadata", onDurationChange)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("durationchange", onDurationChange)
      audio.removeEventListener("loadedmetadata", onDurationChange)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
    }
  }, [isSeeking])

  const togglePlayPause = React.useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {/* Browser blocked */})
    }
  }, [isPlaying])

  const handleRestart = React.useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play().catch(() => {/* Browser blocked */})
  }, [])

  const handleProgressClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      const bar = progressRef.current
      if (!audio || !bar || !duration) return

      const rect = bar.getBoundingClientRect()
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      audio.currentTime = fraction * duration
      setCurrentTime(fraction * duration)
    },
    [duration],
  )

  const SEEK_STEP = 5
  const handleProgressKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      if (!audio || !duration) return

      let newTime: number | null = null

      switch (e.key) {
        case "ArrowLeft":
          newTime = Math.max(0, audio.currentTime - SEEK_STEP)
          break
        case "ArrowRight":
          newTime = Math.min(duration, audio.currentTime + SEEK_STEP)
          break
        case "Home":
          newTime = 0
          break
        case "End":
          newTime = duration
          break
        default:
          return
      }

      e.preventDefault()
      audio.currentTime = newTime
      setCurrentTime(newTime)
    },
    [duration],
  )

  const handleDownload = React.useCallback(() => {
    if (!track) return
    const a = document.createElement("a")
    a.href = track.audioUrl
    a.download = `bloom-music-${track.id.slice(0, 8)}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [track])

  const toggleLyrics = React.useCallback(() => {
    setShowLyrics((prev) => !prev)
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const hasLyrics = Boolean(track?.lyrics)

  // Don't render if no track
  if (!track || track.status !== "done") return null

  const modelLabel = MUSIC_MODEL_META[track.model]?.label ?? track.model

  return (
    <div
      className={cn(
        "relative border-t border-border/40 bg-card/80 backdrop-blur-xl",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        className,
      )}
    >
      {/* Lyrics popover panel — positioned above the bar */}
      <AnimatePresence>
        {showLyrics && hasLyrics && track.lyrics && (
          <LyricsPanel
            lyrics={track.lyrics}
            onClose={() => setShowLyrics(false)}
          />
        )}
      </AnimatePresence>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Progress bar — full width across the top of the bar */}
      <div
        ref={progressRef}
        role="slider"
        aria-label="Track progress"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        tabIndex={0}
        className="group relative h-1 w-full cursor-pointer hover:h-1.5 transition-all bg-muted/30"
        onClick={handleProgressClick}
        onMouseDown={() => setIsSeeking(true)}
        onKeyDown={handleProgressKeyDown}
      >
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Scrub handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--primary),0.3)] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Main bar content */}
      <div className="flex items-center gap-4 px-4 py-2.5">
        {/* Left: Track info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Track icon */}
          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
              "bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20",
              isPlaying && "shadow-[0_0_10px_rgba(var(--primary),0.12)]",
            )}
          >
            {isPlaying ? (
              <div className="flex items-end gap-[2px] h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-primary"
                    style={{
                      animation: `musicBar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <Volume2 className="h-4 w-4 text-primary" />
            )}
          </div>

          {/* Track text */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1 tracking-tight">
              {track.prompt}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground/60">
                {modelLabel}
              </span>
              {track.instrumental && (
                <span className="text-[10px] text-muted-foreground/40">· Instrumental</span>
              )}
            </div>
          </div>

          {/* Like / Dislike */}
          <div className="flex items-center gap-0.5 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-full transition-colors",
                track.reaction === "like"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground/40 hover:text-primary hover:bg-primary/10",
              )}
              onClick={() => onReaction(track.id, "like")}
              title="Like"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-full transition-colors",
                track.reaction === "dislike"
                  ? "text-destructive bg-destructive/10"
                  : "text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10",
              )}
              onClick={() => onReaction(track.id, "dislike")}
              title="Dislike"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Center: Playback controls — pure media transport */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            onClick={handleRestart}
            title="Restart"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          {onPrevious && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={onPrevious}
              title="Previous track"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full shadow-md transition-shadow",
              isPlaying && "shadow-[0_0_16px_rgba(var(--primary),0.2)]",
            )}
            onClick={togglePlayPause}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          {onNext && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={onNext}
              title="Next track"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Right: Secondary actions + Time display */}
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {/* Download */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Download track
            </TooltipContent>
          </Tooltip>

          {/* Lyrics toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!hasLyrics}
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  showLyrics && hasLyrics
                    ? "text-primary bg-primary/10 hover:bg-primary/15"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30",
                  !hasLyrics && "opacity-30 cursor-not-allowed",
                )}
                onClick={toggleLyrics}
              >
                <Mic2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {hasLyrics ? (showLyrics ? "Hide lyrics" : "Show lyrics") : "No lyrics available"}
            </TooltipContent>
          </Tooltip>

          {/* Divider dot */}
          <div className="h-3 w-px bg-border/40 mx-1" />

          {/* Time display */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] tabular-nums text-muted-foreground/70">
              {formatMusicDuration(currentTime)}
            </span>
            <span className="text-[10px] text-muted-foreground/40">/</span>
            <span className="text-[11px] tabular-nums text-muted-foreground/70">
              {duration > 0 ? formatMusicDuration(duration) : "--:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
