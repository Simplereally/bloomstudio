/**
 * useMusicGeneration - Client-side hook for concurrent music generation
 *
 * Manages the full lifecycle of multiple concurrent music generations:
 * - Prompt validation
 * - Multiple in-flight API calls via Map<trackId, AbortController>
 * - Per-track status (generating/done/error)
 * - Generated track history (in-memory session with Convex persistence)
 * - Audio URL lifecycle (revoke on cleanup)
 * - Reaction (like/dislike) management via Convex mutations
 *
 * The generate button is NOT blocked by isGenerating — only by
 * empty prompt or prompt over the character limit.
 */

"use client"

import {
  MusicAPI,
  MusicGenerationError,
  type MusicGenerationParams,
  type MusicGenerationResult,
  type MusicErrorCode,
  type MusicProvider,
  type MusicModel,
  DEFAULT_MUSIC_PROVIDER,
  DEFAULT_MUSIC_MODEL,
  ELEVENMUSIC_DEFAULT_DURATION,
} from "@/lib/music-api"
import * as React from "react"
import { usePollenApiKey, usePollenAuthActions } from "@/lib/pollen-auth"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

// ============================================================================
// Types
// ============================================================================

export type MusicGenerationStatus = "idle" | "generating" | "success" | "error"

/** UI-level generation options that the controls panel manages */
export interface MusicGenerationOptions {
  /** Which provider to use */
  provider: MusicProvider
  /** Which model to use */
  model: MusicModel
  /** Track duration in seconds (elevenmusic only) */
  duration: number
  /** Whether to generate instrumental only (elevenmusic only) */
  instrumental: boolean
}

export const DEFAULT_MUSIC_OPTIONS: MusicGenerationOptions = {
  provider: DEFAULT_MUSIC_PROVIDER,
  model: DEFAULT_MUSIC_MODEL,
  duration: ELEVENMUSIC_DEFAULT_DURATION,
  instrumental: false,
}

export interface MusicGenerationState {
  /** Current generation status (reflects most recent event) */
  status: MusicGenerationStatus
  /** The currently playing or most recently generated track */
  currentTrack: MusicGenerationResult | null
  /** All generated tracks in the session (newest first) */
  tracks: MusicGenerationResult[]
  /** Error message from the most recent failure */
  error: string | null
  /** Error code from the most recent failure */
  errorCode: MusicErrorCode | null
  /** Whether ANY generation is in progress */
  isGenerating: boolean
  /** Number of concurrent in-flight generations */
  inFlightCount: number
  /** Current generation options */
  options: MusicGenerationOptions
}

export interface UseMusicGenerationReturn extends MusicGenerationState {
  /** Trigger music generation with a prompt (non-blocking, allows concurrent calls) */
  generate: (prompt: string, lyrics?: string) => Promise<void>
  /** Cancel a specific in-flight generation by track ID, or all if no ID given */
  cancel: (trackId?: string) => void
  /** Set the current track for playback */
  selectTrack: (track: MusicGenerationResult) => void
  /** Remove a track from history */
  removeTrack: (trackId: string) => void
  /** Clear all generated tracks */
  clearTracks: () => void
  /** Update generation options */
  setOptions: (options: Partial<MusicGenerationOptions>) => void
  /** Set a reaction (like/dislike) on a track — toggles if same reaction */
  setReaction: (trackId: string, reaction: "like" | "dislike") => void
}

// ============================================================================
// Hook
// ============================================================================

export function useMusicGeneration(): UseMusicGenerationReturn {
  // Get API key from BYOP context (user's real Pollinations key stored in Convex)
  const apiKey = usePollenApiKey()
  const { authorize } = usePollenAuthActions()

  // Convex mutations for persistence
  const createGeneration = useMutation(api.musicGenerations.create)
  const setReactionMutation = useMutation(api.musicGenerations.setReaction)

  // Fetch historical generations from Convex (newest first)
  const historicalGenerations = useQuery(api.musicGenerations.listByOwner, {})

  const [state, setState] = React.useState<MusicGenerationState>({
    status: "idle",
    currentTrack: null,
    tracks: [],
    error: null,
    errorCode: null,
    isGenerating: false,
    inFlightCount: 0,
    options: DEFAULT_MUSIC_OPTIONS,
  })

  // Merge in-session tracks with historical Convex records.
  // Session tracks (those with audio blobs) take priority over Convex records.
  // Historical tracks appear after session tracks, deduplicated by convexId.
  const mergedTracks = React.useMemo(() => {
    if (!historicalGenerations) return state.tracks

    // Collect convexIds from session tracks to avoid duplicates
    const sessionConvexIds = new Set(
      state.tracks
        .map((t) => t.convexId)
        .filter((id): id is string => Boolean(id))
    )

    // Map Convex documents to MusicGenerationResult format.
    // Historical tracks use persisted audio URLs from R2 storage.
    // Filter out tracks without valid audio URLs (upload may have failed).
    const historicalTracks: MusicGenerationResult[] = historicalGenerations
      .filter((doc) => !sessionConvexIds.has(doc._id) && doc.audioUrl)
      .map((doc) => ({
        id: doc._id,
        prompt: doc.prompt,
        audioUrl: doc.audioUrl!,
        audioBlob: new Blob(),
        timestamp: doc.createdAt,
        estimatedDuration: doc.estimatedDuration ?? null,
        model: doc.model as MusicModel,
        instrumental: doc.instrumental,
        status: "done" as const,
        lyrics: doc.lyrics,
        reaction: doc.reaction ?? null,
        convexId: doc._id,
      }))

    return [...state.tracks, ...historicalTracks]
  }, [state.tracks, historicalGenerations])

  // Map of in-flight generations: trackId → AbortController
  const inFlightRef = React.useRef<Map<string, AbortController>>(new Map())

  // Track all created object URLs so we can revoke them on unmount.
  const objectUrlsRef = React.useRef<Set<string>>(new Set())

  // Clean up all object URLs on unmount to prevent memory leaks
  React.useEffect(() => {
    const urls = objectUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  // Abort all in-flight on unmount
  React.useEffect(() => {
    const controllers = inFlightRef.current
    return () => {
      controllers.forEach((ctrl) => ctrl.abort())
      controllers.clear()
    }
  }, [])

  // Ref to track latest options without re-create generate callback
  const optionsRef = React.useRef(state.options)
  React.useEffect(() => {
    optionsRef.current = state.options
  }, [state.options])

  /** Helper: update in-flight count and isGenerating flag */
  const syncInFlightCount = React.useCallback(() => {
    const count = inFlightRef.current.size
    setState((prev) => ({
      ...prev,
      inFlightCount: count,
      isGenerating: count > 0,
    }))
  }, [])

  const generate = React.useCallback(async (prompt: string, lyrics?: string) => {
    // Check for API key first — prompt user to connect if missing
    if (!apiKey) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Not connected to Pollinations. Please connect to Pollinations first.",
        errorCode: "UNAUTHORIZED",
      }))
      authorize()
      return
    }

    // Validate prompt
    const validation = MusicAPI.validatePrompt(prompt)
    if (!validation.valid) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: validation.error ?? "Invalid prompt",
        errorCode: "INVALID_INPUT",
      }))
      return
    }

    // Create abort controller for this specific generation
    const controller = new AbortController()
    const trackId = crypto.randomUUID()

    // Register in-flight
    inFlightRef.current.set(trackId, controller)

    // Create a placeholder "generating" track immediately
    const { model, duration, instrumental } = optionsRef.current
    const trimmedLyrics = lyrics?.trim() || undefined
    const placeholder: MusicGenerationResult = {
      id: trackId,
      prompt: prompt.trim(),
      audioUrl: "",
      audioBlob: new Blob(),
      timestamp: Date.now(),
      estimatedDuration: null,
      model,
      instrumental: instrumental,
      status: "generating",
      lyrics: trimmedLyrics,
    }

    setState((prev) => ({
      ...prev,
      status: "generating",
      error: null,
      errorCode: null,
      tracks: [placeholder, ...prev.tracks],
      inFlightCount: inFlightRef.current.size,
      isGenerating: true,
    }))

    try {
      const params: MusicGenerationParams = { prompt, model, instrumental, lyrics: trimmedLyrics }

      // Only pass elevenmusic-specific params when that model is selected
      if (model === "elevenmusic") {
        params.duration = duration
      }

      const result = await MusicAPI.generate(params, controller.signal, apiKey)

      // Check if we were aborted during the request
      if (controller.signal.aborted) return

      // Register the object URL for cleanup on unmount
      objectUrlsRef.current.add(result.audioUrl)

      // Upload audio to R2 for persistent storage, then persist to Convex.
      // This runs in the background — the track plays locally immediately.
      const persistPromise = (async () => {
        try {
          // Upload audio blob to R2
          const formData = new FormData()
          formData.append("file", result.audioBlob, "track.mp3")
          const uploadRes = await fetch("/api/music/upload", {
            method: "POST",
            body: formData,
          })

          let r2Key: string | undefined
          let persistedAudioUrl: string | undefined
          let audioSizeBytes: number | undefined

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json() as {
              success: boolean
              data: { url: string; r2Key: string; sizeBytes: number }
            }
            if (uploadData.success) {
              r2Key = uploadData.data.r2Key
              persistedAudioUrl = uploadData.data.url
              audioSizeBytes = uploadData.data.sizeBytes
            }
          }

          // Create Convex record with audio URL
          return await createGeneration({
            prompt: result.prompt,
            model: result.model,
            instrumental: result.instrumental,
            lyrics: result.lyrics,
            estimatedDuration: result.estimatedDuration ?? undefined,
            r2Key,
            audioUrl: persistedAudioUrl,
            audioSizeBytes,
          })
        } catch {
          // Swallow — persistence is best-effort; the track still plays locally
          return undefined
        }
      })()

      // Build the completed track, replacing the placeholder
      const completedTrack: MusicGenerationResult = {
        ...result,
        id: trackId, // keep the same ID so we replace the placeholder
        status: "done",
      }

      // Wait briefly for the convexId so we can attach it
      const convexId = await persistPromise
      if (convexId) {
        completedTrack.convexId = convexId as string
      }

      // Remove from in-flight
      inFlightRef.current.delete(trackId)

      setState((prev) => ({
        ...prev,
        status: "success",
        currentTrack: completedTrack,
        tracks: prev.tracks.map((t) => (t.id === trackId ? completedTrack : t)),
        error: null,
        errorCode: null,
        inFlightCount: inFlightRef.current.size,
        isGenerating: inFlightRef.current.size > 0,
      }))
    } catch (err) {
      // Remove from in-flight
      inFlightRef.current.delete(trackId)

      // Don't update state if the request was aborted
      if (controller.signal.aborted) {
        // Remove the placeholder
        setState((prev) => ({
          ...prev,
          tracks: prev.tracks.filter((t) => t.id !== trackId),
          inFlightCount: inFlightRef.current.size,
          isGenerating: inFlightRef.current.size > 0,
        }))
        return
      }

      const errorMessage =
        err instanceof MusicGenerationError
          ? err.message
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred"
      const errorCode: MusicErrorCode =
        err instanceof MusicGenerationError ? err.code : "NETWORK_ERROR"

      // Update the placeholder to error state
      const errorTrack: MusicGenerationResult = {
        ...placeholder,
        status: "error",
        errorMessage,
      }

      setState((prev) => ({
        ...prev,
        status: "error",
        error: errorMessage,
        errorCode,
        tracks: prev.tracks.map((t) => (t.id === trackId ? errorTrack : t)),
        inFlightCount: inFlightRef.current.size,
        isGenerating: inFlightRef.current.size > 0,
      }))
    }
  }, [apiKey, authorize, createGeneration])

  const cancel = React.useCallback((trackId?: string) => {
    if (trackId) {
      // Cancel a specific generation
      const controller = inFlightRef.current.get(trackId)
      if (controller) {
        controller.abort()
        inFlightRef.current.delete(trackId)
      }
    } else {
      // Cancel all in-flight
      inFlightRef.current.forEach((ctrl) => ctrl.abort())
      inFlightRef.current.clear()
    }

    setState((prev) => {
      const cancelledIds = trackId ? [trackId] : prev.tracks.filter((t) => t.status === "generating").map((t) => t.id)
      return {
        ...prev,
        tracks: prev.tracks.filter((t) => !cancelledIds.includes(t.id)),
        status: inFlightRef.current.size > 0 ? "generating" : "idle",
        error: null,
        errorCode: null,
        inFlightCount: inFlightRef.current.size,
        isGenerating: inFlightRef.current.size > 0,
      }
    })
  }, [])

  const selectTrack = React.useCallback((track: MusicGenerationResult) => {
    setState((prev) => ({
      ...prev,
      currentTrack: track,
    }))
  }, [])

  const removeTrack = React.useCallback((trackId: string) => {
    // Cancel if in-flight
    const controller = inFlightRef.current.get(trackId)
    if (controller) {
      controller.abort()
      inFlightRef.current.delete(trackId)
    }

    setState((prev) => {
      const trackToRemove = prev.tracks.find((t) => t.id === trackId)
      if (trackToRemove?.audioUrl) {
        URL.revokeObjectURL(trackToRemove.audioUrl)
        objectUrlsRef.current.delete(trackToRemove.audioUrl)
      }
      const newTracks = prev.tracks.filter((t) => t.id !== trackId)
      return {
        ...prev,
        tracks: newTracks,
        currentTrack:
          prev.currentTrack?.id === trackId
            ? newTracks.find((t) => t.status === "done") ?? null
            : prev.currentTrack,
        inFlightCount: inFlightRef.current.size,
        isGenerating: inFlightRef.current.size > 0,
      }
    })
  }, [])

  const clearTracks = React.useCallback(() => {
    // Abort all in-flight
    inFlightRef.current.forEach((ctrl) => ctrl.abort())
    inFlightRef.current.clear()

    setState((prev) => {
      prev.tracks.forEach((track) => {
        if (track.audioUrl) {
          URL.revokeObjectURL(track.audioUrl)
          objectUrlsRef.current.delete(track.audioUrl)
        }
      })
      return {
        ...prev,
        currentTrack: null,
        tracks: [],
        status: "idle",
        inFlightCount: 0,
        isGenerating: false,
      }
    })
  }, [])

  const setOptions = React.useCallback((partial: Partial<MusicGenerationOptions>) => {
    setState((prev) => ({
      ...prev,
      options: { ...prev.options, ...partial },
    }))
  }, [])

  // Ref to hold current merged tracks for use in callbacks without stale closures
  const mergedTracksRef = React.useRef(mergedTracks)
  React.useEffect(() => {
    mergedTracksRef.current = mergedTracks
  }, [mergedTracks])

  const setReaction = React.useCallback((trackId: string, reaction: "like" | "dislike") => {
    // Optimistic update for session tracks
    setState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => {
        if (t.id !== trackId) return t
        // Toggle: same reaction clears it
        const newReaction = t.reaction === reaction ? null : reaction
        return { ...t, reaction: newReaction }
      }),
      currentTrack: prev.currentTrack?.id === trackId
        ? {
            ...prev.currentTrack,
            reaction: prev.currentTrack.reaction === reaction ? null : reaction,
          }
        : prev.currentTrack,
    }))

    // Find the track from merged tracks (includes both session + historical)
    const track = mergedTracksRef.current.find((t) => t.id === trackId)
    if (track?.convexId) {
      setReactionMutation({
        generationId: track.convexId as Id<"musicGenerations">,
        reaction,
      }).catch(() => {
        // Revert optimistic update on failure (for session tracks only;
        // historical tracks will be reverted automatically via useQuery)
        setState((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.id === trackId ? { ...t, reaction: track.reaction } : t
          ),
        }))
      })
    }
  }, [setReactionMutation])

  return {
    ...state,
    tracks: mergedTracks,
    generate,
    cancel,
    selectTrack,
    removeTrack,
    clearTracks,
    setOptions,
    setReaction,
  }
}
