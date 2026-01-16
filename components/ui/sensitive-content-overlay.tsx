"use client"

import { useState } from "react"
import { EyeOff, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SensitiveContentOverlayProps {
    className?: string
    onReveal?: () => void
    isAllowedToReveal?: boolean
}

export function SensitiveContentOverlay({ 
    className,
    onReveal,
    isAllowedToReveal = true
}: SensitiveContentOverlayProps) {
    const [revealed, setRevealed] = useState(false)
    const router = useRouter()
    
    // If local state says revealed, hide overlay (unless it was locked and somehow revealed - theoretically impossible)
    if (revealed) return null
    
    return (
        <div 
            className={cn(
                "absolute inset-0 z-10 flex flex-col items-center justify-center",
                "bg-black/90 backdrop-blur-xl", // Increased opacity and blur
                "rounded-lg cursor-pointer group hover:bg-black/80 transition-all",
                className
            )}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                
                if (isAllowedToReveal) {
                    setRevealed(true)
                    onReveal?.()
                } else {
                    toast("Please sign in to view sensitive content", {
                        action: {
                            label: "Sign In",
                            onClick: () => router.push("/sign-in")
                        }
                    })
                }
            }}
        >
            {/* If not allowed to reveal, wrap in Link to sign-in? 
                This might break layout if we wrap the whole div. 
                Instead, we make the onClick trigger navigation.
            */}
            
            <div className="flex flex-col items-center p-4 text-center transform group-hover:scale-105 transition-transform">
                <div className="rounded-full bg-amber-500/20 p-3 mb-3">
                    {isAllowedToReveal ? (
                         <AlertTriangle className="h-6 w-6 text-amber-500" />
                    ) : (
                         <EyeOff className="h-6 w-6 text-amber-500" />
                    )}
                </div>
                <span className="text-white font-semibold text-sm mb-1">
                    {isAllowedToReveal ? "Sensitive Content" : "Sign in to view"}
                </span>
                <span className="text-white/60 text-xs">
                    {isAllowedToReveal ? "Click to reveal" : "Sensitive content hidden"}
                </span>
            </div>
        </div>
    )
}
