import { cn } from "@/lib/utils"
import { Image as ImageIcon } from "lucide-react"
import NextImage from "next/image"

export function ShowcaseImage({ 
  className, 
  label,
  src,
  aspectRatio = "square",
  priority = false
}: { 
  className?: string; 
  src?: string;
  label: string;
  aspectRatio?: "square" | "portrait" | "landscape" | "landscape-wide" | "portrait-tall";
  /** Set to true for above-the-fold images that should load immediately */
  priority?: boolean;
}) {
  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    "landscape-wide": "aspect-[2/1]",
    "portrait-tall": "aspect-[1/2]"
  }

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-white/10",
      aspectClasses[aspectRatio],
      className
    )}>
      {/* IMAGE - Actual image if provided, using next/image for optimization */}
      {src ? (
        <NextImage 
          src={src} 
          alt={label} 
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
          className="object-cover"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
        />
      ) : (
        /* IMAGE PLACEHOLDER - Improved placeholder with shimmer */
        <div className="absolute inset-0 flex items-center justify-center bg-card/40">
          {/* Shimmer effect only for placeholder */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5" />
          <div className="text-center px-4 relative z-10 transition-all duration-300 group-hover:opacity-100">
            <ImageIcon className="h-10 w-10 mx-auto text-white/10 mb-2 transition-colors group-hover:text-primary/40" />
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">{label}</p>
          </div>
        </div>
      )}

      {/* Hover overlay with label */}
      <div className="absolute inset-0 flex items-end p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
        <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <span className="text-xs text-white/50 uppercase tracking-widest mb-1 block font-medium">Bloom Showcase</span>
          <span className="text-lg text-white font-bold">{label}</span>
        </div>
      </div>
    </div>
  )
}
