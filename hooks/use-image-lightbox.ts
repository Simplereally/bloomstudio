"use client"

import * as React from "react"

export interface LightboxImage {
  url: string
  prompt?: string
  params?: {
    model?: string
    width?: number
    height?: number
    seed?: number
  }
  model?: string
  width?: number
  height?: number
  seed?: number
  id?: string
  _id?: string
  ownerName?: string
  ownerPictureUrl?: string | null
}

interface UseImageLightboxProps {
  image: LightboxImage | null
  isOpen: boolean
}

/**
 * Provides state and event handlers for displaying and interacting with an image lightbox.
 *
 * Manages copy-to-clipboard state for the image prompt, zooming, natural vs rendered image sizes,
 * and drag-to-scroll behavior when zoomed; also exposes a scroll container ref.
 *
 * @param image - The image object shown in the lightbox (may be null); its optional `prompt` is used by copy behavior.
 * @param isOpen - Whether the lightbox is currently open; used to reset transient state when changed.
 * @returns An object with:
 *  - `copied`: `true` when the image prompt was recently copied to the clipboard.
 *  - `isZoomed`: `true` when the image is displayed zoomed in.
 *  - `naturalSize`: The image's natural `{ width, height }` in pixels.
 *  - `isDragging`: `true` while a drag-to-scroll operation is active.
 *  - `scrollContainerRef`: Ref to the scrollable container element.
 *  - `canZoom`: `true` when the image's natural size is sufficiently larger than its rendered size.
 *  - `handleCopyPrompt`: Click handler that copies the image prompt to the clipboard.
 *  - `handleImageLoad`: Image load handler that updates natural and rendered sizes.
 *  - `toggleZoom`: Click handler that toggles zoom state (centers content when enabling zoom).
 *  - `handleMouseDown`, `handleMouseMove`, `handleMouseUp`, `handleMouseLeave`: Mouse handlers for drag-to-scroll when zoomed.
 */
export function useImageLightbox({ image, isOpen }: UseImageLightboxProps) {
  const [copied, setCopied] = React.useState(false)
  const [isZoomed, setIsZoomed] = React.useState(false)
  const [naturalSize, setNaturalSize] = React.useState({ width: 0, height: 0 })
  const [renderedSize, setRenderedSize] = React.useState({ width: 0, height: 0 })

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = React.useState(false)
  const dragStart = React.useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const hasDragged = React.useRef(false)

  // Reset state when image changes
  React.useEffect(() => {
    setIsZoomed(false)
    setIsDragging(false)
  }, [image?.url, isOpen])

  const prompt = image?.prompt
  const handleCopyPrompt = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!prompt) return
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [prompt])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    })
    setRenderedSize({
      width: img.clientWidth,
      height: img.clientHeight
    })
  }

  // Can zoom if natural size is larger than rendered size
  const canZoom = naturalSize.width && renderedSize.width
    ? naturalSize.width > renderedSize.width * 1.05 || naturalSize.height > renderedSize.height * 1.05
    : false

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Don't toggle zoom if we just dragged
    if (hasDragged.current) {
      hasDragged.current = false
      return
    }
    if (isZoomed) {
      setIsZoomed(false)
    } else if (canZoom) {
      setIsZoomed(true)
      // Center the scroll position after zoom
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current
          container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2
          container.scrollTop = (container.scrollHeight - container.clientHeight) / 2
        }
      }, 0)
    }
  }

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow left click dragging
    if (e.button !== 0) return
    if (!isZoomed || !scrollContainerRef.current) return

    setIsDragging(true)
    hasDragged.current = false
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return

    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y

    // Mark as dragged if moved more than 5px
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDragged.current = true
    }

    scrollContainerRef.current.scrollLeft = dragStart.current.scrollLeft - dx
    scrollContainerRef.current.scrollTop = dragStart.current.scrollTop - dy
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  return {
    copied,
    isZoomed,
    naturalSize,
    isDragging,
    scrollContainerRef,
    canZoom,
    handleCopyPrompt,
    handleImageLoad,
    toggleZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave
  }
}