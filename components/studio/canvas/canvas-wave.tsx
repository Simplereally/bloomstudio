"use client"

import { useTheme } from "next-themes"
import * as React from "react"

interface CanvasWaveProps {
    isActive: boolean
    className?: string
}

interface WaveConfig {
    gridSpacing: number
    dotBaseSize: number
    dotMaxSize: number
    waveSpeed: number
    waveFrequency: number
    waveAmplitude: number
    perspective: number
    vignettePower: number // Controls the soft edge fade (Higher = sharper edge, Lower = smoother fade)
}

// Configuration for the premium feel
const CONFIG: WaveConfig = {
    gridSpacing: 10,      // Spacing between dots (High density)
    dotBaseSize: 0.8,     // Resting size (smaller for crispy look)
    dotMaxSize: 2.5,      // Peak wave size
    waveSpeed: 0.08,      // Speed of ripple
    waveFrequency: 0.04,  // Distance between rings
    waveAmplitude: 0.5,     // Strength of effect
    perspective: 400,     // For 3D parallax effect (future extension)
    vignettePower: 0.2,   // 1.0 = Linear fade, 2.0 = Quadratic (smoother), 3.0 = Sharp spotlight
}

/**
 * CanvasWave - High-fidelity HTML5 Canvas rendering engine
 * 
 * Replaces CSS backgrounds with a physically simulated dot grid.
 * Implements a "Wave Equation" that manipulates dot size and opacity
 * to create a perceived 3D surface ripple.
 * 
 * Features:
 * - 60 FPS requestAnimationFrame loop
 * - High-DPI (Retina) scaling support
 * - Dynamic theme color extraction
 * - Soft edge vignettes
 * - Sine-wave propagation physics
 */
export function CanvasWave({ isActive, className }: CanvasWaveProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const { theme } = useTheme()
    const requestRef = React.useRef<number | null>(null)
    const timeRef = React.useRef<number>(0)
    
    // State to hold interpolated colors
    const colors = React.useRef({
        bg: "rgba(0,0,0,0)",
        dotIdle: "rgba(255,255,255,0.1)",
        dotActive: "rgba(255,100,0,1)"
    })

    // Update colors based on theme/computed styles
    React.useEffect(() => {
        const updateColors = () => {
             const isDark = document.documentElement.classList.contains("dark")
             
             // Robust way to resolve CSS variables to valid Canvas colors
             // We create a temporary element to let the browser compute the final color value
             const temp = document.createElement("div")
             temp.style.display = "none"
             temp.style.color = "var(--primary)"
             document.body.appendChild(temp)
             
             const styles = getComputedStyle(temp)
             const resolvedPrimary = styles.color // This will be rgb(...) or rgba(...)
             
             document.body.removeChild(temp)

             colors.current = {
                 bg: "transparent", 
                 dotIdle: isDark 
                    ? "rgba(255, 255, 255, 0.6)" 
                    : "rgba(0, 0, 0, 0.3)",
                 // Use the resolved color, fallback to orange if something went wrong
                 dotActive: resolvedPrimary || "orange" 
             }
        }

        updateColors()
        // Observer for class changes on html element (dark mode toggle)
        const observer = new MutationObserver(updateColors)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
        
        return () => observer.disconnect()
    }, [theme])

    // Main Animation Loop
    React.useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) return

        let lastTime = performance.now()

        const render = () => {
            if (!containerRef.current) return
            
            const now = performance.now()
            // Cap dt to avoid huge jumps if tab was inactive (max 0.1s)
            const dt = Math.min((now - lastTime) / 1000, 0.1)
            lastTime = now

            // 1. Handle resizing and DPI
            const { width, height } = containerRef.current.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            
            // Only resize if dimensions changed to avoid clearing canvas unnecessarily
            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr
                canvas.height = height * dpr
                ctx.scale(dpr, dpr)
                canvas.style.width = `${width}px`
                canvas.style.height = `${height}px`
            }

            // 2. Clear
            ctx.clearRect(0, 0, width, height)

            // 3. Update Time (normalize speed: config speed is per second approx)
            if (isActive) {
                // Wave speed needs to be faster with real-time delta
                timeRef.current += CONFIG.waveSpeed * dt * 60 
            } else {
                timeRef.current += (CONFIG.waveSpeed * 0.1) * dt * 60
            }

            // 4. Draw Grid
            // Center-anchored grid to ensure a dot always hits the exact center (The Source)
            // This prevents "shimmering" or intensity loss during resize due to spatial aliasing
            
            const centerX = width / 2
            const centerY = height / 2
            
            // Calculate how many dots we need to cover the screen from the center out
            // We add 1 buffer to ensure edges are covered during resize/rounding
            const colsHalf = Math.ceil(width / CONFIG.gridSpacing / 2) + 1
            const rowsHalf = Math.ceil(height / CONFIG.gridSpacing / 2) + 1
            
            // 4. Geometry Generation & Batching
            // Group 1: Idle Dots (Batched for speed - 95% of dots)
            // Group 2: Active Dots (Individual for specific opacity/color - 5% of dots)
            

            const activeDots: any[] = []

            // Begin batch for idle dots
            ctx.beginPath()
            
            // Standard PI2
            const PI2 = Math.PI * 2
            
            // Iterate relative to center
            for (let i = -colsHalf; i <= colsHalf; i++) {
                for (let j = -rowsHalf; j <= rowsHalf; j++) {
                    const x = centerX + i * CONFIG.gridSpacing
                    const y = centerY + j * CONFIG.gridSpacing
                    
                    const dx = x - centerX
                    const dy = y - centerY
                    // We can approximate distance scan for pure culling if needed, but sqrt is fast enough in JS
                    const distance = Math.sqrt(dx * dx + dy * dy)
                    
                    // Cull dots strictly outside visible corners (plus margin) to save path building
                    // Vignette makes them invisible anyway, but batching them cost memory
                    const maxDist = Math.sqrt(width * width + height * height) / 2
                    if (distance > maxDist) continue

                    let isDotActive = false
                    let size = CONFIG.dotBaseSize

                    if (isActive) {
                        const wave = Math.sin(distance * CONFIG.waveFrequency - timeRef.current)
                        const normalizedWave = (wave + 1) / 2
                        const peak = Math.pow(normalizedWave, 4) // Sharp peak

                        // If this dot is part of the active wave crest
                        // OR if it's part of the permanent "Sun" center
                        const coreHeat = Math.max(0, 1 - distance / 60) // Permanent brightness at center
                        const combinedPeak = Math.max(peak, coreHeat)

                        if (combinedPeak > 0.1) {
                            isDotActive = true
                            // Calculate properties for active dot
                            const activeSize = CONFIG.dotBaseSize + (Math.pow(normalizedWave, 3) * (CONFIG.dotMaxSize - CONFIG.dotBaseSize))
                            const lift = combinedPeak * -4
                            const opacity = 0.4 + combinedPeak * 0.6 // Reduce dynamic range (0.4 to 1.0) to prevent dim "rest" state
                            
                            activeDots.push({ x, y, lift, size: Math.max(activeSize, size + coreHeat * 2), opacity })
                        }
                    } 
                    
                    if (!isDotActive) {
                        // Idle Physics (Breathing)
                        const breath = Math.sin(timeRef.current + (x + y) * 0.01)
                        size = CONFIG.dotBaseSize + (breath * 0.5)
                        
                        // Add to batch path
                        ctx.moveTo(x + size, y)
                        ctx.arc(x, y, size, 0, PI2)
                    }
                }
            }
            
            // Draw Idle Batch (One draw call for ~100k dots!)
            ctx.fillStyle = colors.current.dotIdle
            // Base opacity for idle dots (pre-vignette). 
            // Previous code had 0.15 * edgeFactor. We handle edgeFactor globally now.
            // Bumping this up to 1.0 (max) to rely purely on the color definition for brightness
            ctx.globalAlpha = 1.0 
            ctx.fill()
            
            // Draw Active Dots (Unbatched, but few)
            if (activeDots.length > 0) {
                ctx.fillStyle = colors.current.dotActive
                for (let k = 0; k < activeDots.length; k++) {
                    const d = activeDots[k]
                    ctx.globalAlpha = d.opacity // Specific opacity
                    ctx.beginPath()
                    ctx.arc(d.x, d.y + d.lift, d.size, 0, PI2)
                    ctx.fill()
                }
            }

            // 5. Apply Global Vignette Mask
            // Uses 'destination-in' to multiply alpha of existing pixels by the gradient alpha
            // Effectively applying `opacity *= edgeFactor` to every pixel on screen at once
            
            const maxDist = Math.sqrt(width * width + height * height) / 2
            const vignette = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxDist)
            
            // Generate stops to approximate the CONFIG.vignettePower curve
            // 1 - (d/max)^p
            const steps = 10
            for (let s = 0; s <= steps; s++) {
                const t = s / steps
                const alpha = Math.max(0, 1 - Math.pow(t, CONFIG.vignettePower))
                vignette.addColorStop(t, `rgba(0,0,0, ${alpha})`)
            }
            
            ctx.globalCompositeOperation = "destination-in"
            ctx.fillStyle = vignette
            ctx.fillRect(0, 0, width, height)
            
            // Reset composite for glow
            ctx.globalCompositeOperation = "source-over"

            // 6. Draw Core Glow (The "Source")
            // Replaces external DOM elements with an integrated light source
            if (isActive) {
                const pulse = Math.sin(timeRef.current * 1.5) * 0.5 + 0.5 // 0 to 1 smooth pulse
                const coreSize = 100 + pulse * 30 // Soft, large glow area
                
                // Create soft light bloom
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize)
                
                // Use color-mix for robust opacity handling with any valid color string
                // Note: color-mix support is good in modern browsers. 
                // Fallback: If dotActive is RGB/RGBA, we could parse it? 
                // Since we resolved it to ComputedStyle, strictly it should be rgb(...) or rgba(...)
                // We can use string replacement safely ONLY if it's RGB keys.
                // But safer is to use canvas globalAlpha + color stops if possible? 
                // No, gradient stops need color.
                // Let's rely on color-mix OR the fact resolvedPrimary is rgb(...)
                
                // Let's assume modern browser (implied by React 19 / Next.js stack) supports color-mix
                // OR construct it:
                const active = colors.current.dotActive
                
                // Simple opacity hack using color-mix which is valid in Canvas fillStyle string
                gradient.addColorStop(0, `color-mix(in srgb, ${active}, transparent 20%)`)
                gradient.addColorStop(0.4, `color-mix(in srgb, ${active}, transparent 80%)`)
                gradient.addColorStop(1, "transparent")
                
                ctx.save()
                ctx.globalCompositeOperation = "screen" // Additive blending for pure light
                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2)
                ctx.fill()
                
                // Add a bright white hot center
                const hotSpot = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 6)
                hotSpot.addColorStop(0, "rgba(255, 255, 255, 0.9)")
                hotSpot.addColorStop(1, "transparent")
                ctx.fillStyle = hotSpot
                ctx.beginPath()
                ctx.arc(centerX, centerY, 10, 0, Math.PI * 2)
                ctx.fill()
                
                ctx.restore()
            }

            requestRef.current = requestAnimationFrame(render)
        }

        render()

        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current)
        }
    }, [isActive]) // Re-bind if active state changes changes logic paths

    return (
        <div ref={containerRef} className={className}>
            <canvas 
                ref={canvasRef}
                className="block w-full h-full"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    )
}
