import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  accent = false 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      "group relative p-6 rounded-2xl transition-all duration-300",
      accent 
        ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30" 
        : "glass-effect-home hover:border-primary/20"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform",
        accent ? "bg-primary/30" : "bg-white/10"
      )}>
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 font-brand">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
