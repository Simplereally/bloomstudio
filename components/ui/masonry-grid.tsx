"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

interface MasonryGridProps {
    children: React.ReactNode
    className?: string
    /** Minimum column width in pixels */
    minColumnWidth?: number
    /** Gap between items in pixels */
    gap?: number
}

/**
 * A responsive masonry grid layout that automatically arranges items
 * in columns, similar to Pinterest or Leonardo AI's community feed.
 * Uses CSS columns for a true masonry effect where images maintain
 * their natural aspect ratios.
 */
export function MasonryGrid({
    children,
    className,
    minColumnWidth = 280,
    gap = 8,
}: MasonryGridProps) {
    return (
        <div
            className={cn("w-full", className)}
            style={{
                columnWidth: `${minColumnWidth}px`,
                columnGap: `${gap}px`,
            }}
        >
            {React.Children.map(children, (child, index) => (
                <div
                    key={index}
                    className="break-inside-avoid"
                    style={{ marginBottom: `${gap}px` }}
                >
                    {child}
                </div>
            ))}
        </div>
    )
}
