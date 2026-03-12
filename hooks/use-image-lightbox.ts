"use client"

import { isVideoContent } from "@/components/ui/media-player"
import * as React from "react"

export interface LightboxImage {
  /** Display URL - may be thumbnail for optimized feeds */
  url: string
  /** Original full-size URL for lightbox display - if not provided, uses url */
  originalUrl?: string
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
  /** MIME type of the content (e.g., "video/mp4", "image/jpeg") */
  contentType?: string
}

interface UseImageLightboxProps {
  image: LightboxImage | null
  isOpen: boolean
}

type ToggleZoomEvent = React.MouseEvent | React.KeyboardEvent

export function useImageLightbox({ image, isOpen }: UseImageLightboxProps) {
  const [isHovering, _setIsHovering] = React.useState(false)
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const setIsHovering = React.useCallback((hovering: boolean) => {
    if (hovering) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      _setIsHovering(true)
    } else {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = setTimeout(() => {
        _setIsHovering(false)
      }, 100)
    }
  }, [])

  const [copied, setCopied] = React.useState(false)
  const [isZoomed, setIsZoomed] = React.useState(false)
  const [naturalSize, setNaturalSize] = React.useState({ width: 0, height: 0 })
  const [renderedSize, setRenderedSize] = React.useState({ width: 0, height: 0 })

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = React.useState(false)
  const dragStart = React.useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const hasDragged = React.useRef(false)

  // Clean up all timers on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  // Reset state when image changes
  React.useEffect(() => {
    setIsZoomed(false)
    setIsDragging(false)
    hasDragged.current = false
    _setIsHovering(false)
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
      setCopied(false)
    }
  }, [image?.url, isOpen])

  const prompt = image?.prompt
  const handleCopyPrompt = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!prompt) return
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false)
      copyTimeoutRef.current = null
    }, 2000)
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

  const toggleZoom = (e: ToggleZoomEvent) => {
    e.stopPropagation()

    if ("key" in e && e.key === " ") {
      e.preventDefault()
    }

    // Prevent zoom if it's a video
    if (isVideoContent(image?.contentType, image?.url)) return

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

    // Scroll immediately for smoothness (don't wait for flag)
    scrollContainerRef.current.scrollLeft = dragStart.current.scrollLeft - dx
    scrollContainerRef.current.scrollTop = dragStart.current.scrollTop - dy
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // State defined at top of component

  return {
    copied,
    isZoomed,
    naturalSize,
    isDragging,
    scrollContainerRef,
    canZoom,
    isHovering,
    setIsHovering,
    handleCopyPrompt,
    handleImageLoad,
    toggleZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    hasDragged
  }
}