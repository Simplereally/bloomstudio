/**
 * MusicTrackRow — Suno-style track row for the music generation canvas
 *
 * Displays a single track with:
 * - Animated generating state (pulsing bars + shimmer)
 * - Completed state with play button, title, model badge, duration
 * - Inline title editing with edit/save/cancel icon actions
 * - Error state with retry affordance
 * - Lyrics indicator badge when custom lyrics are present
 * - Like/dislike reaction buttons + inline download on hover
 * - Smart relative timestamps ("Just now", "5m ago", "Yesterday", etc.)
 * - Click to select for playback in the bottom player bar
 */

"use client"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { deriveTitleFromPrompt } from "@/lib/music-utils"
import {
  formatMusicDuration,
  MUSIC_MODEL_META,
  type MusicGenerationResult,
} from "@/lib/music-api"
import {
  AlertCircle,
  Check,
  Download,
  Loader2,
  Mic,
  Pencil,
  Play,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react"
import * as React from "react"

// ============================================================================
// Types
// ============================================================================

export interface MusicTrackRowProps {
  /** The track data to display */
  track: MusicGenerationResult
  /** Whether this track is currently selected in the player */
  isActive?: boolean
  /** Whether this track is currently playing audio */
  isPlaying?: boolean
  /** Select this track for playback */
  onSelect: (track: MusicGenerationResult) => void
  /** Set a reaction on this track */
  onReaction: (trackId: string, reaction: "like" | "dislike") => void
  /** Remove this track */
  onRemove: (trackId: string) => void
  /** Rename this track's title */
  onRename?: (trackId: string, title: string) => void
}

// ============================================================================
// Relative Time Formatter
// ============================================================================

const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

/**
 * Formats a timestamp into a human-friendly relative string.
 *
 * - < 1 min → "Just now"
 * - < 60 min → "5m ago"
 * - < 24h → "3h ago"
 * - Yesterday → "Yesterday"
 * - Same year → "Oct 12"
 * - Different year → "Oct 12, 2024"
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const delta = now - timestamp

  if (delta < MINUTE) return "Just now"
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m ago`
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h ago`

  const date = new Date(timestamp)
  const today = new Date(now)

  // Check "Yesterday" — compare calendar dates, not just 24h ago
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday"
  }

  // Same year → short month + day
  const sameYear = date.getFullYear() === today.getFullYear()
  if (sameYear) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }

  // Different year → include year
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ============================================================================
// Generating State
// ============================================================================

function GeneratingRow({ track }: { track: MusicGenerationResult }) {
  return (
    <div className="relative overflow-hidden flex items-center gap-4 px-4 py-3 rounded-xl bg-card/40 border border-border/30 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Spinning disc icon */}
      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="absolute inset-0 rounded-lg animate-ping bg-primary/10" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground/80 line-clamp-1 tracking-tight">
          {track.prompt}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground/60">Generating…</span>
          {/* Mini equalizer bars */}
          <div className="flex items-end gap-[2px] h-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full bg-primary/60"
                style={{
                  animation: `music-bar 1.2s ease-in-out ${i * 0.15}s infinite alternate`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none opacity-30"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.05) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "progress-shimmer 2s ease-in-out infinite",
        }}
      />
    </div>
  )
}

// ============================================================================
// Error State
// ============================================================================

function ErrorRow({
  track,
  onRemove,
}: {
  track: MusicGenerationResult
  onRemove: (trackId: string) => void
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/20 animate-in fade-in duration-200">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground/80 line-clamp-1 tracking-tight">
          {track.prompt}
        </p>
        <p className="text-[10px] text-destructive/80 mt-0.5 line-clamp-1">
          {track.errorMessage ?? "Generation failed"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground/70 hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(track.id)
        }}
      >
        Dismiss
      </Button>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function MusicTrackRow({
  track,
  isActive = false,
  isPlaying = false,
  onSelect,
  onReaction,
  onRemove,
  onRename,
}: MusicTrackRowProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Delegate to sub-components for non-"done" states
  if (track.status === "generating") {
    return <GeneratingRow track={track} />
  }
  if (track.status === "error") {
    return <ErrorRow track={track} onRemove={onRemove} />
  }

  // Resolve display title: stored title → fallback derived from prompt
  const displayTitle = track.title || deriveTitleFromPrompt(track.prompt)
  const modelLabel = MUSIC_MODEL_META[track.model]?.label ?? track.model
  const hasLyrics = Boolean(track.lyrics)

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    const a = document.createElement("a")
    a.href = track.audioUrl
    a.download = `pixelstream-${track.id.slice(0, 8)}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditValue(displayTitle)
    setIsEditing(true)
    // Focus input on next tick after render
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleSave = (e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation()
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== displayTitle) {
      onRename?.(track.id, trimmed)
    }
    setIsEditing(false)
  }

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!isEditing) onSelect(track)
      }}
      onKeyDown={(e) => {
        if (isEditing) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(track)
        }
      }}
      className={cn(
        "group relative overflow-hidden flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-150 cursor-pointer",
        "hover:bg-accent/40",
        isActive
          ? "bg-primary/5 border border-primary/20 shadow-sm"
          : "border border-transparent",
      )}
    >
      {/* Play/Pause indicator */}
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
          isActive
            ? "bg-primary/15 text-primary"
            : "bg-muted/30 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        {isActive && isPlaying ? (
          <div className="flex items-end gap-[2px] h-4" data-testid="equalizer-bars">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-primary"
                style={{
                  animation: `music-bar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                }}
              />
            ))}
          </div>
        ) : isActive ? (
          <Play className="h-4 w-4 ml-0.5" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        {/* Title row: display or inline edit */}
        {isEditing ? (
          <div
            className="mb-0.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <InputGroup className="h-7 text-sm">
              <InputGroupInput
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-7 text-sm px-2"
                aria-label="Track title"
                maxLength={100}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  onClick={handleSave}
                  aria-label="Save title"
                  disabled={!editValue.trim()}
                >
                  <Check className="h-3 w-3" />
                </InputGroupButton>
                <InputGroupButton
                  size="icon-xs"
                  onClick={handleCancel}
                  aria-label="Cancel editing"
                >
                  <X className="h-3 w-3" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 group/title">
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-1 tracking-tight">
              {displayTitle}
            </p>
            {onRename && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="opacity-0 group-hover/title:opacity-100 focus-visible:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted/40"
                aria-label="Edit title"
              >
                <Pencil className="h-3 w-3 text-muted-foreground/60" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Model badge — with lyrics indicator */}
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-muted/30 text-muted-foreground/70">
            {modelLabel}
            {track.instrumental && " · Inst."}
            {hasLyrics && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <Mic className="h-2.5 w-2.5 text-primary/70 flex-shrink-0" />
                <span className="text-primary/70">Lyrics</span>
              </>
            )}
          </span>

          {/* Duration */}
          <span className="text-[10px] text-muted-foreground/60">
            {track.estimatedDuration
              ? `~${formatMusicDuration(track.estimatedDuration)}`
              : "Track"}
          </span>

          {/* Relative timestamp */}
          <span className="text-[10px] text-muted-foreground/40">
            {formatRelativeTime(track.timestamp)}
          </span>
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {/* Download */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-accent/60 transition-colors"
              onClick={handleDownload}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Download</TooltipContent>
        </Tooltip>

        {/* Subtle separator */}
        <div className="w-px h-3.5 bg-border/40 mx-0.5" />

        {/* Like */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-full transition-colors",
                track.reaction === "like"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground/50 hover:text-primary hover:bg-primary/10",
              )}
              onClick={(e) => {
                e.stopPropagation()
                onReaction(track.id, "like")
              }}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Like</TooltipContent>
        </Tooltip>

        {/* Dislike */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-full transition-colors",
                track.reaction === "dislike"
                  ? "text-destructive bg-destructive/10"
                  : "text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10",
              )}
              onClick={(e) => {
                e.stopPropagation()
                onReaction(track.id, "dislike")
              }}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Dislike</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

