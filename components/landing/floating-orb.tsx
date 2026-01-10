import { cn } from "@/lib/utils"

export function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={cn(
        "absolute rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-float",
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    />
  )
}
