"use client"

import { motion, useReducedMotion, type Transition } from "framer-motion"

/**
 * NoGuardrails — A visual indicator communicating unrestricted AI generation.
 *
 * Concept: Two vertical guardrail lines flank a center path. The guardrails
 * continuously dissolve outward and fade, revealing an open road — a clear
 * metaphor for "no restrictions" that everyone immediately understands.
 *
 * The phrase "No Guardrails" directly references the AI industry's censorship
 * language, making it instantly recognizable and slightly rebellious.
 *
 * Animation design:
 * - Phase 1 (0–35%): Guardrails slide outward and dissolve; center path ignites.
 * - Phase 2 (35–65%): Open road — guardrails invisible, center glows hot.
 * - Phase 3 (65–100%): Guardrails reform, center cools — cycle repeats.
 * - All elements share the same timing so they feel like one choreographed motion.
 *
 * Performance:
 * - All animate/transition objects are hoisted to module scope so they are
 *   created once and reused across renders (rendering-hoist-jsx).
 * - `will-change` hints promote animated elements to compositor layers.
 * - Respects `prefers-reduced-motion` via framer-motion's useReducedMotion hook.
 */

// ============================================================================
// Hoisted animation constants — stable references, zero per-render allocation
// ============================================================================

/** Shared keyframe timing — one object, zero drift between elements */
const CYCLE_TRANSITION: Transition = {
  duration: 3.5,
  repeat: Infinity,
  ease: "easeInOut",
  times: [0, 0.35, 0.65, 1],
}

/** Left guardrail keyframes */
const LEFT_GUARDRAIL_ANIMATE = {
  x: [0, -5, -5, 0],
  opacity: [0.7, 0, 0, 0.7],
  scaleY: [1, 0.6, 0.6, 1],
}

/** Right guardrail keyframes */
const RIGHT_GUARDRAIL_ANIMATE = {
  x: [0, 5, 5, 0],
  opacity: [0.7, 0, 0, 0.7],
  scaleY: [1, 0.6, 0.6, 1],
}

/** Center path keyframes — ignites when guardrails dissolve */
const CENTER_PATH_ANIMATE = {
  backgroundColor: [
    "rgba(255, 255, 255, 0.2)",
    "rgba(236, 72, 153, 0.95)",
    "rgba(236, 72, 153, 0.95)",
    "rgba(255, 255, 255, 0.2)",
  ],
  boxShadow: [
    "0 0 0px rgba(236, 72, 153, 0)",
    "0 0 10px rgba(236, 72, 153, 0.5), 0 0 20px rgba(236, 72, 153, 0.2)",
    "0 0 10px rgba(236, 72, 153, 0.5), 0 0 20px rgba(236, 72, 153, 0.2)",
    "0 0 0px rgba(236, 72, 153, 0)",
  ],
}

/** Label colour keyframes */
const LABEL_ANIMATE = {
  color: [
    "rgba(255, 255, 255, 0.35)",
    "rgb(236, 72, 153)",
    "rgb(236, 72, 153)",
    "rgba(255, 255, 255, 0.35)",
  ],
}

/** Static state for reduced-motion users — shows the "hot" (guardrails dissolved) appearance */
const STATIC_GUARDRAIL_STYLE = { opacity: 0 }
const STATIC_CENTER_STYLE = {
  backgroundColor: "rgba(236, 72, 153, 0.95)",
  boxShadow: "0 0 10px rgba(236, 72, 153, 0.5), 0 0 20px rgba(236, 72, 153, 0.2)",
}
const STATIC_LABEL_STYLE = { color: "rgb(236, 72, 153)" }

// ============================================================================
// Component
// ============================================================================

export function NoGuardrails() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="flex items-center justify-center gap-2.5 select-none cursor-default group" role="status" aria-label="No content guardrails — unrestricted generation">
      {/* Icon: guardrails dissolving away from a center path */}
      <div className="relative w-7 h-[18px] flex items-center justify-center" aria-hidden="true">
        {/* Ambient glow behind the icon — only appears on hover for a "discovery" moment */}
        <div className="absolute inset-0 rounded-full bg-pink-600/15 blur-[6px] scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Left guardrail — slides left and fades */}
        <motion.div
          className="absolute left-1 top-0.5 w-[2px] h-3.5 rounded-full bg-gradient-to-b from-pink-400/80 to-pink-600/60 will-change-[transform,opacity]"
          animate={prefersReducedMotion ? STATIC_GUARDRAIL_STYLE : LEFT_GUARDRAIL_ANIMATE}
          transition={prefersReducedMotion ? undefined : CYCLE_TRANSITION}
        />

        {/* Right guardrail — slides right and fades */}
        <motion.div
          className="absolute right-1 top-0.5 w-[2px] h-3.5 rounded-full bg-gradient-to-b from-pink-400/80 to-pink-600/60 will-change-[transform,opacity]"
          animate={prefersReducedMotion ? STATIC_GUARDRAIL_STYLE : RIGHT_GUARDRAIL_ANIMATE}
          transition={prefersReducedMotion ? undefined : CYCLE_TRANSITION}
        />

        {/* Center path line — always visible, glows when guardrails are gone */}
        <motion.div
          className="relative z-10 w-[2px] h-2.5 rounded-full"
          animate={prefersReducedMotion ? STATIC_CENTER_STYLE : CENTER_PATH_ANIMATE}
          transition={prefersReducedMotion ? undefined : CYCLE_TRANSITION}
        />
      </div>

      {/* Label */}
      <motion.span
        className="text-[9px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap"
        animate={prefersReducedMotion ? STATIC_LABEL_STYLE : LABEL_ANIMATE}
        transition={prefersReducedMotion ? undefined : CYCLE_TRANSITION}
      >
        No Guardrails
      </motion.span>
    </div>
  )
}
