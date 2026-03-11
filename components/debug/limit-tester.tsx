"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useRandomSeed } from "@/hooks"
import { IMAGE_MODEL_IDS, MODEL_REGISTRY } from "@/lib/config/models"
import { usePollenApiKey, usePollenAuthActions } from "@/lib/pollen-auth"
import { cn } from "@/lib/utils"
import { useAction, useMutation, useQuery } from "convex/react"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"

const PRESETS = [512, 1024, 2048, 4096, 6144, 8192]

export function LimitTester() {
    const sortedModelIds = [...IMAGE_MODEL_IDS].sort((a, b) => {
        const nameA = MODEL_REGISTRY[a]?.displayName || a
        const nameB = MODEL_REGISTRY[b]?.displayName || b
        return nameA.localeCompare(nameB)
    })

    const [modelId, setModelId] = useState<string>("flux")
    const [width, setWidth] = useState<number>(1024)
    const [height, setHeight] = useState<number>(1024)
    const [prompt, setPrompt] = useState("A glitch art masterpiece of a cyberpunk city, extremely detailed")
    const { generateSeed } = useRandomSeed(modelId)
    
    // Track current generation
    const [currentGenId, setCurrentGenId] = useState<Id<"pendingGenerations"> | null>(null)
    const [naturalDimensions, setNaturalDimensions] = useState<{ w: number; h: number } | null>(null)

    const startGeneration = useMutation(api.singleGeneration.startGeneration)
    const processGeneration = useAction(api.singleGenerationProcessor.processGeneration)
    
    // BYOP context for API key
    const apiKey = usePollenApiKey()
    const { authorize } = usePollenAuthActions()
    
    // Poll status if we have a generation ID
    const status = useQuery(api.singleGeneration.getGenerationStatus, 
        currentGenId ? { generationId: currentGenId } : "skip"
    )

    const isGenerating = status?.status === "pending" || status?.status === "processing"
    const imageId = status?.status === "completed" ? status.imageId : null
    const image = useQuery(api.generatedImages.getById, imageId ? { imageId } : "skip")

    const handleGenerate = async () => {
        // Check for API key
        if (!apiKey) {
            toast.error("Not connected to Pollinations. Please connect first.")
            authorize()
            return
        }
        
        try {
            setNaturalDimensions(null)
            const id = await startGeneration({
                generationParams: {
                    prompt,
                    model: modelId,
                    width,
                    height,
                    seed: generateSeed(),
                    quality: "high"
                },
                apiKey,
            })
            setCurrentGenId(id)
            void Promise.resolve(processGeneration({ generationId: id, apiKey })).catch((dispatchError) => {
                console.error("Immediate dispatch failed; recovery path will retry:", dispatchError)
            })
        } catch (error) {
            toast.error("Failed to start generation")
            console.error(error)
        }
    }

    const setDimensions = (w: number, h: number) => {
        setWidth(w)
        setHeight(h)
    }

    // Preset Generators
    const squarePresets = PRESETS.map(size => ({ w: size, h: size, label: `${size}x${size}` }))
    const portraitPresets = PRESETS.map(size => ({ w: 512, h: size, label: `512x${size}` }))
    const landscapePresets = PRESETS.map(size => ({ w: size, h: 512, label: `${size}x512` }))

    return (
        <div className="space-y-2 max-w-5xl mx-auto p-2">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    Model Limit Tester
                </h1>
                <div className="text-sm text-muted-foreground">
                    By bypassing client-side constraints, we can find the TRUE limits.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Controls */}
                <Card className="p-6 space-y-6 lg:col-span-1 border-white/10 bg-black/40 backdrop-blur-xl h-fit">
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <Select value={modelId} onValueChange={setModelId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {sortedModelIds.map(id => {
                                    const model = MODEL_REGISTRY[id]
                                    return (
                                        <SelectItem key={id} value={id}>
                                            <div className="flex items-center gap-2">
                                                {model?.logo && (
                                                    <Image
                                                        src={model.logo}
                                                        alt=""
                                                        width={16}
                                                        height={16}
                                                        className="w-4 h-4 object-contain opacity-80"
                                                        unoptimized
                                                    />
                                                )}
                                                {model?.displayName || id}
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Prompt</Label>
                        <Textarea 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)}
                            className="bg-black/20 min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Width (px)</Label>
                            </div>
                            <Input 
                                type="number" 
                                value={width} 
                                onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                                className="bg-black/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Height (px)</Label>
                            </div>
                            <Input 
                                type="number" 
                                value={height} 
                                onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                                className="bg-black/20"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>Pixels: {(width * height / 1_000_000).toFixed(2)}MP</span>
                            <span>Ratio: {(width / height).toFixed(2)}</span>
                        </div>
                        <Button 
                            className="w-full font-bold" 
                            size="lg"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                "TEST GENERATION"
                            )}
                        </Button>
                    </div>

                    {status?.status === "failed" && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold">Generation Failed</div>
                                <div>{status.errorMessage}</div>
                            </div>
                        </div>
                    )}
                    
                    {status?.status === "completed" && (
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <div>
                                <div className="font-bold">Success!</div>
                                <div>Image generated successfully.</div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Quick Presets */}
                <Card className="p-6 border-white/10 bg-black/40 backdrop-blur-xl h-fit">
                    <Label className="text-base mb-4 block underline underline-offset-4 decoration-primary/30">Quick Presets</Label>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">SQUARE (1:1)</div>
                            <div className="flex flex-wrap gap-1.5">
                                {squarePresets.map(p => (
                                    <Button 
                                        key={p.label}
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setDimensions(p.w, p.h)}
                                        className={cn(
                                            "h-7 text-[10px] px-2",
                                            width === p.w && height === p.h ? "bg-primary/20 border-primary text-primary" : "bg-black/20"
                                        )}
                                    >
                                        {p.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">TALL (Portrait)</div>
                            <div className="flex flex-wrap gap-1.5">
                                {portraitPresets.map(p => (
                                    <Button 
                                        key={p.label}
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setDimensions(p.w, p.h)}
                                        className={cn(
                                            "h-7 text-[10px] px-2",
                                            width === p.w && height === p.h ? "bg-primary/20 border-primary text-primary" : "bg-black/20"
                                        )}
                                    >
                                        {p.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">WIDE (Landscape)</div>
                            <div className="flex flex-wrap gap-1.5">
                                {landscapePresets.map(p => (
                                    <Button 
                                        key={p.label}
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setDimensions(p.w, p.h)}
                                        className={cn(
                                            "h-7 text-[10px] px-2",
                                            width === p.w && height === p.h ? "bg-primary/20 border-primary text-primary" : "bg-black/20"
                                        )}
                                    >
                                        {p.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Output View */}
                <div className="min-h-[400px] flex flex-col rounded-xl border border-white/10 bg-black/40 overflow-hidden relative">
                    {status?.status === "processing" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <div className="text-lg font-medium">Generating...</div>
                            <div className="text-sm text-muted-foreground">Requested: {width}x{height}</div>
                        </div>
                    )}
                    
                    {image ? (
                            <div className="relative w-full h-full flex flex-col">
                            <div className="flex-1 flex items-center justify-center p-4 bg-black/20 min-h-[300px]">
                                <div className="relative w-full max-w-5xl h-[500px]">
                                    <Image
                                        src={image.url}
                                        alt="Result"
                                        fill
                                        sizes="(max-width: 1024px) 90vw, 1024px"
                                        className="object-contain shadow-2xl"
                                        unoptimized
                                        onLoadingComplete={(img) => {
                                            setNaturalDimensions({ w: img.naturalWidth, h: img.naturalHeight })
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-black/80 flex flex-col gap-3 border-t border-white/10 text-xs text-muted-foreground">
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span>Requested:</span>
                                        <span className="font-mono text-white">{width}x{height}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Actual:</span>
                                        <span className={cn(
                                            "font-mono font-bold",
                                            (naturalDimensions?.w === width && naturalDimensions?.h === height) ? "text-green-400" : "text-yellow-400"
                                        )}>
                                            {naturalDimensions ? `${naturalDimensions.w}x${naturalDimensions.h}` : `${image.width}x${image.height}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>FileSize:</span>
                                        <span className="text-white">{(image.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                                <a 
                                    href={image.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-primary hover:text-primary/80 transition-colors font-medium text-center py-2 rounded bg-primary/10 border border-primary/20"
                                >
                                    View Original
                                </a>
                            </div>
                            </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
                            {status?.status === "completed" ? (
                                <div className="text-green-400">
                                    <h3 className="text-xl font-bold mb-2">Generation Complete</h3>
                                    <p>Loading image details...</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="font-medium">No results yet</p>
                                    <p className="text-xs opacity-60">Select dimensions and press test to verify model capabilities</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
