"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface FloatingImageProps {
  src: string
  alt?: string
  className?: string
  initialX: string
  initialY: string
  rotate: number
  scale?: number
  priority?: boolean
}

function FloatingImage({ 
  src, 
  alt = "Gallery image", 
  className,
  initialX,
  initialY,
  rotate,
  scale = 1,
  priority = false
}: FloatingImageProps) {
  // Add some smooth floating animation
  const randomDuration = 5 + Math.random() * 5
  
  return (
    <motion.div
      style={{ 
        left: initialX, 
        top: initialY,
        position: 'absolute' 
      }}
      className="pointer-events-none"
    >
      <motion.div
        initial={priority ? { opacity: 0.4, scale: scale, rotate: rotate } : { opacity: 0, scale: 0.5, rotate: rotate }}
        animate={{ 
          opacity: 0.4, 
          scale: scale,
          rotate: rotate,
          // Add subtle floating movement
          y: [0, -10, 0],
        }}
        transition={{
          opacity: { duration: 1, delay: priority ? 0 : 0.5 },
          scale: { duration: 0.8 },
          rotate: { duration: 0 },
          y: { 
            repeat: Infinity, 
            duration: randomDuration, 
            ease: "easeInOut",
            repeatType: "reverse"
          }
        }}
        whileHover={{ 
          opacity: 1, 
          zIndex: 50,
          transition: { duration: 0.3 }
        }}
        className={cn(
          "cursor-pointer pointer-events-auto",
          "w-48 h-64 sm:w-64 sm:h-80 rounded-2xl overflow-hidden glass-effect-home shadow-2xl border border-white/10",
          className
        )}
      >
          <div className="relative w-full h-full">
              <Image 
                  src={src} 
                  alt={alt} 
                  fill 
                  className="object-cover"
                  sizes="(max-width: 768px) 192px, 256px"
                  priority={priority}
              />
              {/* Overlay that fades out on hover */}
              <motion.div 
                className="absolute inset-0 bg-black/40"
                whileHover={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
          </div>
      </motion.div>
    </motion.div>
  )
}

export function FloatingGallery() {
  const images = [
    // Left Side
    {
      src: "/gallery/cyberpunk.png",
      alt: "Cyberpunk Cityscape",
      initialX: "5%",
      initialY: "15%",
      rotate: -12,
      scale: 0.9,
      priority: true
    },
    {
      src: "/gallery/portrait.png",
      alt: "Ethereal Portrait",
      initialX: "8%",
      initialY: "55%",
      rotate: 8,
      scale: 0.8
    },
    // Right Side
    {
      src: "/gallery/architecture.png",
      alt: "Futuristic Architecture",
      initialX: "80%",
      initialY: "10%",
      rotate: 15,
      scale: 0.8,
      priority: true
    },
    {
      src: "/gallery/nature.png",
      alt: "Hyper-realistic Nature",
      initialX: "85%",
      initialY: "60%",
      rotate: -8,
      scale: 0.85
    }
  ]

  return (
    <div className="absolute inset-x-0 top-0 h-screen overflow-hidden pointer-events-none z-10">
      {images.map((img, i) => (
        <FloatingImage 
            key={i} 
            {...img} 
        />
      ))}
    </div>
  )
}
