"use client"

import { cn } from "@/lib/utils"
import * as React from "react"
import { useEffect, useRef, useState } from "react"

interface MasonryGridProps {
    children: React.ReactNode
    className?: string
    /** Minimum column width in pixels */
    minColumnWidth?: number
    /** Gap between items in pixels */
    gap?: number
}

/**
 * A responsive masonry grid layout that arranges items in columns.
 * Items are assigned left-to-right (round-robin) to columns, then
 * each column stacks items vertically for the masonry effect.
 */
export function MasonryGrid({
    children,
    className,
    minColumnWidth = 280,
    gap = 8,
}: MasonryGridProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [columnCount, setColumnCount] = useState(4)

    // Calculate column count based on container width
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const updateColumns = () => {
            const width = container.offsetWidth
            const cols = Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)))
            setColumnCount(cols)
        }

        updateColumns()
        const resizeObserver = new ResizeObserver(updateColumns)
        resizeObserver.observe(container)

        return () => resizeObserver.disconnect()
    }, [minColumnWidth, gap])


    // Distribute children to columns using "Shortest Column First" algorithm
    // This provides a much more balanced layout than simple round-robin,
    // especially when images have varying aspect ratios.
    const columns = React.useMemo(() => {
        const childArray = React.Children.toArray(children)
        const cols: React.ReactNode[][] = Array.from({ length: columnCount }, () => [])
        const colHeights = Array(columnCount).fill(0)

        childArray.forEach((child, index) => {
            // Calculate height cost (vertical space relative to column width)
            // Tall images (AR < 1) have cost > 1
            // Wide images (AR > 1) have cost < 1
            let cost = 1

            if (React.isValidElement(child)) {
                // Case 1: ImageCard (has image prop with width/height)
                const props = child.props as Record<string, unknown>
                const image = props.image as {
                    generationParams?: { width?: number; height?: number };
                    width?: number;
                    height?: number
                } | undefined

                if (image) {
                    const width = image.generationParams?.width || image.width || 1024
                    const height = image.generationParams?.height || image.height || 1024

                    // Clamp ratio consistent with ImageCard implementation (0.4 to 2.5)
                    const ratio = Math.min(Math.max(width / height, 0.4), 2.5)
                    cost = 1 / ratio
                }
                // Case 2: Skeleton or other elements with style.aspectRatio
                else if (props.style && typeof props.style === 'object' && 'aspectRatio' in props.style) {
                    const style = props.style as { aspectRatio: string | number }
                    const ratio = typeof style.aspectRatio === 'number'
                        ? style.aspectRatio
                        : parseFloat(String(style.aspectRatio))

                    if (!isNaN(ratio) && ratio > 0) {
                        cost = 1 / ratio
                    }
                }
            }

            // Find column with minimum accumulated cost
            let shortestColIndex = 0
            let minHeight = colHeights[0]

            for (let i = 1; i < columnCount; i++) {
                if (colHeights[i] < minHeight) {
                    minHeight = colHeights[i]
                    shortestColIndex = i
                }
            }

            cols[shortestColIndex].push(
                <div key={index} style={{ marginBottom: `${gap}px` }}>
                    {child}
                </div>
            )

            // Add cost to the column's total height estimate
            colHeights[shortestColIndex] += cost
        })

        return cols
    }, [children, columnCount, gap])

    return (
        <div
            ref={containerRef}
            className={cn("w-full flex items-start", className)}
            style={{ gap: `${gap}px` }}
        >
            {columns.map((columnItems, colIndex) => (
                <div
                    key={colIndex}
                    className="flex-1 flex flex-col"
                    style={{ minWidth: 0 }}
                >
                    {columnItems}
                </div>
            ))}
        </div>
    )
}
