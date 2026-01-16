

/**
 * Branded Loading UI - Provides instant visual feedback during navigation.
 * 
 * Features the Bloom Studio branding with animated Zap icon and orange loading bar.
 * Used as a shared component across all route segments for consistent UX.
 * 
 * Part of Next.js 16 + React 19 Best Practices:
 * - Instant feedback on navigation (no "invisible buffer" delay)
 * - Consistent branding across all loading states
 * - Zero maintenance overhead (single component, multiple re-exports)
 */
export default function BrandedLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16 animate-pulse">
          <img 
            src="/icon.png" 
            alt="Bloom Studio Logo" 
            className="h-full w-full object-contain relative z-10"
          />
          {/* Pollen Particles - Increased count (16) and reduced sizes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
            {[...Array(16)].map((_, i) => {
              // Deterministic "random" values based on index to ensure hydration match
              const size = [
                'w-0.5 h-0.5', // 2px
                'w-1 h-1',     // 4px 
                'w-[3px] h-[3px]' // 3px
              ][i % 3];
              
              const left = 30 + (i * 45 / 16) + ((i % 2 === 0 ? 1 : -1) * (i % 5)); // Scatter between ~30% and ~75%
              
              // Use NEGATIVE delay so animation is already running (instant start)
              // Stagger between -2.5s and 0s
              const delay = -1 * (i * 2.5 / 16); 
              
              const opacity = 0.4 + ((i % 5) / 10); // 0.4 to 0.9

              // Alternate direction based on index
              const animationClass = i % 2 === 0 ? 'animate-pollen-left' : 'animate-pollen-right';

              return (
                <div 
                  key={i}
                  className={`absolute top-4 left-1/2 rounded-full bg-primary ${animationClass} ${size}`} 
                  style={{ 
                    left: `${left}%`, 
                    animationDelay: `${delay}s`,
                    opacity: opacity
                  }} 
                />
              );
            })}
          </div>
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full animate-loading-bar bg-primary origin-left" />
        </div>
        <p className="text-sm font-medium animate-pulse text-muted-foreground">Bloom Studio</p>
      </div>
    </div>
  )
}
