"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getModelDisplayName } from "@/lib/config/models"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Check, Copy } from "lucide-react"
import * as React from "react"

/**
 * Flexible image type for the lightbox that works with both
 * studio-generated images and community feed images from Convex.
 */
export interface LightboxImage {
  url: string
  prompt: string
  // Can have params object (studio) or direct fields (feed)
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
  // Optional identifiers
  id?: string
  _id?: string
  // Owner info for community feed
  ownerName?: string
  ownerPictureUrl?: string | null
}

interface ImageLightboxProps {
  image: LightboxImage | null
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ image, isOpen, onClose }: ImageLightboxProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyPrompt = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!image?.prompt) return
    await navigator.clipboard.writeText(image.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [image?.prompt])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !border-none !bg-transparent !p-0 !shadow-none !w-screen !h-screen !max-w-none !translate-x-0 !translate-y-0 !outline-none"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Fullscreen Preview</DialogTitle>
          <DialogDescription>
            Previewing image: {image?.prompt}
          </DialogDescription>
        </VisuallyHidden>

        {image && (
          <div 
            className="w-full h-full flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8 lg:p-12" 
            onClick={onClose}
          >
            <div 
              className="relative group max-w-full max-h-full flex items-center justify-center cursor-default" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- External generated image URLs */}
              <img
                src={image.url}
                alt={image.prompt}
                className="max-w-full max-h-[calc(100vh-6rem)] w-auto h-auto object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm"
              />

              {/* Info overlay on hover */}
              <div
                className="absolute bottom-0 inset-x-0 p-4 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                style={{ maskImage: 'linear-gradient(to top, black 0%, black 80%, transparent 100%)' }}
              >
                
                <div className="flex items-end justify-between gap-8">
                  <div className="flex flex-col gap-2.5 max-w-2xl">
                    <p className="text-white text-sm md:text-base font-medium leading-relaxed line-clamp-2 antialiased">
                      {image.prompt}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 border border-white/10 text-white/90">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{getModelDisplayName(image.params?.model || image.model) || (image.params?.model || image.model)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 border border-white/10 text-white/90 text-[10px] md:text-xs font-medium">
                        <span className="text-white/40">Size</span>
                        <span className="font-mono">
                          {image.params?.width || image.width}×{image.params?.height || image.height}
                        </span>
                      </div>
                      {(image.params?.seed || image.seed) && (image.params?.seed !== -1 && image.seed !== -1) && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 border border-white/10 text-white/90 text-[10px] md:text-xs font-medium">
                          <span className="text-white/40">Seed</span>
                          <span className="font-mono">{image.params?.seed || image.seed}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 mb-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-colors shrink-0"
                        onClick={handleCopyPrompt}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="z-[200]">
                      <p className="font-medium">{copied ? "Copied!" : "Copy prompt"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
