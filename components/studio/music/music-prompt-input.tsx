/**
 * MusicPromptInput — Prompt textarea for music generation
 *
 * Features:
 * - Auto-resizing textarea with character count
 * - Keyboard shortcut (Cmd/Ctrl+Enter) to generate
 * - Prompt validation feedback
 * - Optional lyrics textarea (visible only when not in instrumental mode)
 * - Imperative handle for external trigger (e.g. sidebar generate button)
 *
 * Generation can be triggered via ⌘⏎ or the external generate button.
 */

"use client"

import { cn } from "@/lib/utils"
import { SUNO_MAX_PROMPT_LENGTH } from "@/lib/music-api"
import { Music, MicVocal } from "lucide-react"
import * as React from "react"

// ============================================================================
// Types
// ============================================================================

/** Imperative handle exposed to parent components via ref */
export interface MusicPromptInputHandle {
  /** Trigger generation with the current prompt + lyrics */
  submit: () => void
}

export interface MusicPromptInputProps {
  /** Callback to trigger generation (prompt + optional lyrics) */
  onGenerate: (prompt: string, lyrics?: string) => void
  /** Error message to display */
  error?: string | null
  /** Whether instrumental mode is active (hides lyrics input) */
  isInstrumental?: boolean
  /** Called when prompt content presence changes (has text or not) */
  onHasContentChange?: (hasContent: boolean) => void
  /** Additional class names */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export const MusicPromptInput = React.forwardRef<
  MusicPromptInputHandle,
  MusicPromptInputProps
>(function MusicPromptInput(
  { onGenerate, error, isInstrumental = false, onHasContentChange, className },
  ref,
) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const lyricsRef = React.useRef<HTMLTextAreaElement>(null)
  const [prompt, setPrompt] = React.useState("")
  const [lyrics, setLyrics] = React.useState("")

  const trimmedPrompt = prompt.trim()
  const charCount = trimmedPrompt.length
  const isOverLimit = charCount > SUNO_MAX_PROMPT_LENGTH
  const canGenerate = charCount > 0 && !isOverLimit

  // Notify parent when prompt content presence changes
  React.useEffect(() => {
    onHasContentChange?.(canGenerate)
  }, [canGenerate, onHasContentChange])

  // Auto-resize style textarea
  const resizeTextarea = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [])

  // Auto-resize lyrics textarea
  const resizeLyrics = React.useCallback(() => {
    const textarea = lyricsRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [])

  React.useEffect(() => {
    resizeTextarea()
  }, [prompt, resizeTextarea])

  React.useEffect(() => {
    resizeLyrics()
  }, [lyrics, resizeLyrics])

  // Handle submit
  const handleSubmit = React.useCallback(() => {
    if (!canGenerate) return
    const trimmedLyrics = lyrics.trim()
    // Only pass lyrics when not in instrumental mode and there are actual lyrics
    const lyricsToSend =
      !isInstrumental && trimmedLyrics ? trimmedLyrics : undefined
    onGenerate(trimmedPrompt, lyricsToSend)
  }, [canGenerate, onGenerate, trimmedPrompt, lyrics, isInstrumental])

  // Expose submit method to parent via ref
  React.useImperativeHandle(
    ref,
    () => ({
      submit: handleSubmit,
    }),
    [handleSubmit],
  )

  // Keyboard shortcut: Cmd/Ctrl + Enter to generate (works in both textareas)
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Style/Prompt textarea wrapper */}
      <div className="relative group">
        <div
          className={cn(
            "relative rounded-xl border bg-gradient-to-b from-card/60 to-card/30 backdrop-blur-sm transition-all duration-200",
            "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
            error ? "border-destructive/50" : "border-border/40",
          )}
        >
          {/* Icon */}
          <div className="absolute left-3.5 top-3.5 text-muted-foreground/50">
            <Music className="h-4 w-4" />
          </div>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the music you want to create... e.g. 'A chill lo-fi hip-hop beat with soft piano and vinyl crackle'"
            rows={3}
            className={cn(
              "w-full resize-none bg-transparent pl-10 pr-4 pt-3 pb-8 text-sm leading-relaxed",
              "placeholder:text-muted-foreground/40 focus:outline-none",
              "min-h-[84px]",
            )}
          />

          {/* Bottom bar: char count + hint */}
          <div className="absolute bottom-2 left-3.5 right-3.5 flex items-center justify-between">
            <span
              className={cn(
                "text-[10px] tabular-nums transition-colors",
                isOverLimit
                  ? "text-destructive font-medium"
                  : charCount > SUNO_MAX_PROMPT_LENGTH * 0.9
                    ? "text-amber-500"
                    : "text-muted-foreground/35",
              )}
            >
              {charCount > 0 && (
                <>
                  {charCount.toLocaleString()}/
                  {SUNO_MAX_PROMPT_LENGTH.toLocaleString()}
                </>
              )}
            </span>
            <span className="text-[10px] text-muted-foreground/35">
              ⌘⏎ to generate
            </span>
          </div>
        </div>
      </div>

      {/* Lyrics textarea — visible only when NOT instrumental */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          !isInstrumental
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
        aria-hidden={isInstrumental}
      >
        <div className="overflow-hidden">
          <div className="relative group mt-1">
            <div
              className={cn(
                "relative rounded-xl border bg-gradient-to-b from-card/40 to-card/20 backdrop-blur-sm transition-all duration-200",
                "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
                "border-border/30",
              )}
            >
              {/* Lyrics icon */}
              <div className="absolute left-3.5 top-3 text-muted-foreground/40">
                <MicVocal className="h-4 w-4" />
              </div>

              <textarea
                ref={lyricsRef}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add lyrics (optional)... e.g. verse, chorus, bridge sections"
                rows={2}
                data-testid="lyrics-textarea"
                disabled={isInstrumental}
                className={cn(
                  "w-full resize-none bg-transparent pl-10 pr-4 pt-3 pb-7 text-sm leading-relaxed",
                  "placeholder:text-muted-foreground/30 focus:outline-none",
                  "min-h-[64px]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              />

              {/* Label */}
              <div className="absolute bottom-1.5 left-3.5 right-3.5 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/30 font-medium">
                  Lyrics (Optional)
                </span>
                <span className="text-[10px] text-muted-foreground/30">
                  ⌘⏎ to generate
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  )
})
