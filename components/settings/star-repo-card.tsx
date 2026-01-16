"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Sparkles } from "lucide-react"
import Image from "next/image"

export function StarRepoCard() {
    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader>
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Boost Your Limits
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground/80">
                        Increase your generation caps by connecting your own Pollinations API key.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Pollinations Branding + Visual Context */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black text-white shadow-xl border border-white/10 relative overflow-hidden">

                    
                    <Image
                        src="/branding/pollinations/logo-white.svg"
                        alt="Pollinations AI"
                        width={180}
                        height={50}
                        className="h-10 w-auto object-contain relative z-10"
                    />
                    <div className="hidden sm:block h-10 w-px bg-white/20 relative z-10" />
                    <p className="text-sm font-semibold tracking-wide text-white/80 uppercase relative z-10">
                        Proud supporter
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <p className="text-base text-muted-foreground leading-relaxed">
                            Default API keys are limited to <span className="font-bold text-foreground">180 generations/day</span>.
                        </p>
                        <p className="text-base text-muted-foreground leading-relaxed">
                            You may be eligible for <span className="font-bold text-green-500">~540 generations/day</span> based on your Github account standing and contributions.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => window.open("https://enter.pollinations.ai/", "_blank", "noopener,noreferrer")}
                        className="w-full sm:w-auto h-11 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                    >
                        Learn more about BYOP
                        <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

