import { cn } from "@/lib/utils"
import { Image as ImageIcon } from "lucide-react"

export function ShowcaseImage({ 
  className, 
  label,
  src,
  aspectRatio = "square"
}: { 
  className?: string; 
  src?: string;
  label: string;
  aspectRatio?: "square" | "portrait" | "landscape" | "landscape-wide" | "portrait-tall";
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
      {/* Placeholder shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      


      {/* IMAGE - Actual image if provided */}
      {src ? (
        <img 
          src={src} 
          alt={label} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500" 
        />
      ) : (
        /* IMAGE PLACEHOLDER - Improved placeholder */
        <div className="absolute inset-0 flex items-center justify-center bg-card/40">
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
