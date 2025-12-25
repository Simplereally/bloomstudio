"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

/**
 * Hook to fetch the user's most recent uploaded reference images.
 * Limited to 50 items, suitable for a picker UI.
 */
export function useReferenceImages() {
    return useQuery(api.referenceImages.getRecent)
}
