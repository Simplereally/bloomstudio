/**
 * Music Utility Functions
 *
 * Pure helpers shared between the music generation hook and display components.
 */

/**
 * Derives a short title from a prompt string.
 *
 * Takes the first up-to-3 space-delimited words after normalizing whitespace.
 * - 1 word prompt → that word
 * - 2 word prompt → those 2 words
 * - 3+ word prompt → first 3 words
 *
 * Returns an empty string if the input is blank/whitespace-only.
 */
export function deriveTitleFromPrompt(prompt: string): string {
  const words = prompt.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 3).join(" ")
}
