import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes with clsx.
 * This is the standard utility for conditional class merging in shadcn/ui.
 * 
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if the app is running on localhost (for local development).
 * This is used to gate dev-only features like API onboarding and upgrade modals.
 */
export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false
  const hostname = window.location.hostname
  return hostname === "localhost" || hostname === "127.0.0.1"
}
