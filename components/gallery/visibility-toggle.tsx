"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { useState } from "react"
import { toast } from "sonner"

interface VisibilityToggleProps {
    imageId: Id<"generatedImages">
    currentVisibility: "public" | "unlisted"
}

/**
 * Button component to toggle the visibility of a generated image.
 * Updates Convex database and provides visual feedback.
 */
export function VisibilityToggle({ imageId, currentVisibility }: VisibilityToggleProps) {
    const setVisibility = useMutation(api.generatedImages.setVisibility)
    const [isUpdating, setIsUpdating] = useState(false)

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        setIsUpdating(true)
        const newVisibility = currentVisibility === "public" ? "unlisted" : "public"

        try {
            await setVisibility({ imageId, visibility: newVisibility })
            toast.success(`Image is now ${newVisibility}`)
        } catch (error) {
            console.error("Failed to update visibility:", error)
            toast.error("Failed to update visibility")
        } finally {
            setIsUpdating(false)
        }
    }

    const isPublic = currentVisibility === "public"

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={isUpdating}
            className={`h-8 w-8 rounded-full ${isPublic ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title={isPublic ? "Make unlisted" : "Make public"}
        >
            {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPublic ? (
                <Eye className="h-4 w-4" />
            ) : (
                <EyeOff className="h-4 w-4" />
            )}
        </Button>
    )
}
