"use client"

import { useState } from "react"
import { Eye, EyeOff, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SensitiveContentOverlayProps {
    className?: string
    onReveal?: () => void
}

export function SensitiveContentOverlay({ 
    className,
    onReveal 
}: SensitiveContentOverlayProps) {
    const [revealed, setRevealed] = useState(false)
    
    if (revealed) return null
    
    return (
        <div 
            className={cn(
                "absolute inset-0 z-10 flex flex-col items-center justify-center",
                "bg-black/80 backdrop-blur-md",
                "rounded-lg cursor-pointer group hover:bg-black/70 transition-all",
                className
            )}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setRevealed(true)
                onReveal?.()
            }}
        >
            <div className="flex flex-col items-center p-4 text-center transform group-hover:scale-105 transition-transform">
                <div className="rounded-full bg-amber-500/20 p-3 mb-3">
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
                <span className="text-white font-semibold text-sm mb-1">Sensitive Content</span>
                <span className="text-white/60 text-xs">Click to reveal</span>
            </div>
        </div>
    )
}
