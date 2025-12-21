import { useState } from "react"
import type { ImageGenerationParams, AspectRatio, ImageModel } from "@/types/pollinations"
import { ASPECT_RATIOS, IMAGE_MODELS } from "@/lib/image-models"
import { PollinationsAPI } from "@/lib/pollinations-api"

export interface UseGenerationControlsProps {
    onGenerate: (params: ImageGenerationParams) => void
}

export function useGenerationControls({ onGenerate }: UseGenerationControlsProps) {
    const [prompt, setPrompt] = useState("")
    const [model, setModel] = useState<ImageModel>("flux")
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1")
    const [width, setWidth] = useState(1024)
    const [height, setHeight] = useState(1024)
    const [seed, setSeed] = useState(-1)
    const [enhance, setEnhance] = useState(false)
    const [privateGen, setPrivateGen] = useState(false)
    const [safe, setSafe] = useState(false)

    const handleAspectRatioChange = (value: AspectRatio) => {
        setAspectRatio(value)
        if (value !== "custom") {
            const ratio = ASPECT_RATIOS.find((r) => r.value === value)
            if (ratio) {
                setWidth(ratio.width)
                setHeight(ratio.height)
            }
        }
    }

    const handleWidthChange = (value: number[]) => {
        const roundedWidth = PollinationsAPI.roundDimension(value[0])
        setWidth(roundedWidth)
        setAspectRatio("custom")
    }

    const handleHeightChange = (value: number[]) => {
        const roundedHeight = PollinationsAPI.roundDimension(value[0])
        setHeight(roundedHeight)
        setAspectRatio("custom")
    }

    const handleRandomSeed = () => {
        setSeed(PollinationsAPI.generateRandomSeed())
    }

    const handleGenerate = () => {
        if (!prompt.trim()) return

        const params: ImageGenerationParams = {
            prompt: prompt.trim(),
            model,
            width,
            height,
            seed: seed === -1 ? undefined : seed,
            enhance,
            private: privateGen,
            safe,
        }

        onGenerate(params)
    }

    const currentModel = IMAGE_MODELS.find((m) => m.id === model)

    return {
        prompt,
        setPrompt,
        model,
        setModel,
        aspectRatio,
        handleAspectRatioChange,
        width,
        handleWidthChange,
        height,
        handleHeightChange,
        seed,
        setSeed,
        handleRandomSeed,
        enhance,
        setEnhance,
        privateGen,
        setPrivateGen,
        safe,
        setSafe,
        handleGenerate,
        currentModel,
    }
}
