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
import { useMutation, useQuery } from "convex/react"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const PRESETS = [512, 1024, 2048, 4096, 6144, 8192]

export function LimitTester() {
    const [modelId, setModelId] = useState<string>("nanobanana-pro")
    const [width, setWidth] = useState<number>(1024)
    const [height, setHeight] = useState<number>(1024)
    const [prompt, setPrompt] = useState("A glitch art masterpiece of a cyberpunk city, extremely detailed")
    const { generateSeed, isRandomMode } = useRandomSeed(modelId)
    
    // Track current generation
    const [currentGenId, setCurrentGenId] = useState<Id<"pendingGenerations"> | null>(null)
    const [lastResult, setLastResult] = useState<{
        success: boolean;
        time?: number;
        error?: string;
        dimensions?: string;
    } | null>(null)

    const startGeneration = useMutation(api.singleGeneration.startGeneration)
    
    // Poll status if we have a generation ID
    const status = useQuery(api.singleGeneration.getGenerationStatus, 
        currentGenId ? { generationId: currentGenId } : "skip"
    )

    const isGenerating = status?.status === "pending" || status?.status === "processing"
    const imageId = status?.status === "completed" ? status.imageId : null
    const image = useQuery(api.generatedImages.getById, imageId ? { imageId } : "skip")

    const handleGenerate = async () => {
        try {
            setLastResult(null)
            const id = await startGeneration({
                generationParams: {
                    prompt,
                    model: modelId,
                    width,
                    height,
                    seed: generateSeed(),
                    quality: "high"
                }
            })
            setCurrentGenId(id)
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
        <div className="space-y-8 max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    Model Limit Tester
                </h1>
                <div className="text-sm text-muted-foreground">
                    By bypassing client-side constraints, we can find the TRUE limits.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls */}
                <Card className="p-6 space-y-6 lg:col-span-1 border-white/10 bg-black/40 backdrop-blur-xl">
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <Select value={modelId} onValueChange={setModelId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {IMAGE_MODEL_IDS.map(id => (
                                    <SelectItem key={id} value={id}>
                                        {MODEL_REGISTRY[id]?.displayName || id}
                                    </SelectItem>
                                ))}
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
                            <Label>Width (px)</Label>
                            <Input 
                                type="number" 
                                value={width} 
                                onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                                className="bg-black/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Height (px)</Label>
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

                {/* Presets & Results */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 border-white/10 bg-black/40 backdrop-blur-xl">
                        <Label className="text-base mb-4 block">Quick Presets</Label>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-muted-foreground mb-2 font-medium">SQUARE (1:1) - Stress Test Megapixels</div>
                                <div className="flex flex-wrap gap-2">
                                    {squarePresets.map(p => (
                                        <Button 
                                            key={p.label}
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setDimensions(p.w, p.h)}
                                            className={width === p.w && height === p.h ? "bg-primary/20 border-primary" : "bg-black/20"}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground mb-2 font-medium">TALL (Portrait) - Stress Test Height</div>
                                <div className="flex flex-wrap gap-2">
                                    {portraitPresets.map(p => (
                                        <Button 
                                            key={p.label}
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setDimensions(p.w, p.h)}
                                            className={width === p.w && height === p.h ? "bg-primary/20 border-primary" : "bg-black/20"}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground mb-2 font-medium">WIDE (Landscape) - Stress Test Width</div>
                                <div className="flex flex-wrap gap-2">
                                    {landscapePresets.map(p => (
                                        <Button 
                                            key={p.label}
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setDimensions(p.w, p.h)}
                                            className={width === p.w && height === p.h ? "bg-primary/20 border-primary" : "bg-black/20"}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Output View */}
                    <div className="min-h-[400px] flex items-center justify-center rounded-xl border border-white/10 bg-black/40 overflow-hidden relative">
                        {status?.status === "processing" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <div className="text-lg font-medium">Generating...</div>
                                <div className="text-sm text-muted-foreground">{width}x{height}</div>
                            </div>
                        )}
                        
                        {image ? (
                             <div className="relative w-full h-full flex flex-col">
                                <img 
                                    src={image.url} 
                                    alt="Result" 
                                    className="w-full h-auto max-h-[600px] object-contain mx-auto"
                                />
                                <div className="p-4 bg-black/80 flex justify-between items-center text-sm">
                                    <div className="flex gap-4">
                                        <span>{image.width}x{image.height}</span>
                                        <span>{(image.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <a 
                                        href={image.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Open Original
                                    </a>
                                </div>
                             </div>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground">
                                {status?.status === "completed" ? (
                                    <div className="text-green-400">
                                        <h3 className="text-xl font-bold mb-2">Generation Complete</h3>
                                        <p>Loading image details...</p>
                                    </div>
                                ) : (
                                    "Select dimensions and press test to verify model capabilities"
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
