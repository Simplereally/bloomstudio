"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import Image from "next/image"

export function StarRepoCard() {
    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader>
                <div className="space-y-1">
                    <CardTitle className="text-xl">Boost Your Limits</CardTitle>
                    <CardDescription>
                        Increase your generation caps by connecting your own Pollinations API key.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                 {/* Pollinations Branding + Visual Context */}
                 <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-r from-gray-900 to-black text-white shadow-md">
                     <Image
                         src="/branding/pollinations/logo-white.svg"
                         alt="Pollinations AI"
                         width={140} 
                         height={40}
                         className="h-10 w-auto object-contain"
                     />
                     <div className="h-8 w-px bg-white/20" /> {/* Divider */}
                     <p className="text-sm font-medium text-white/90">
                         Official Partner
                     </p>
                 </div>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        Default API keys are limited to <span className="font-semibold">180 generations/day</span>. 
                        By connecting your own Pollinations API key, you can boost this limit to <span className="font-semibold text-green-600 dark:text-green-500">~540 generations/day</span>.
                    </p>
                    
                    <Button
                        variant="outline"
                        onClick={() => window.open("https://enter.pollinations.ai/", "_blank", "noopener,noreferrer")}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Learn More
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

