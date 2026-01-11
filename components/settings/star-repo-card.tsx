"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Star, ExternalLink } from "lucide-react"
import Image from "next/image"

export function StarRepoCard() {
    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm border-l-4 border-l-yellow-500/50">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                             <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                             Boost Your Limits
                        </CardTitle>
                        <CardDescription>
                            Permanently increase your generation caps by supporting Pollinations.
                        </CardDescription>
                    </div>
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
                    <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
                        Default API keys are limited to <span className="font-semibold">300 generations/day</span>. 
                        By starring the Pollinations repository on GitHub, you can boost this limit to <span className="font-semibold text-green-600 dark:text-green-500">~900 generations/day</span> for free.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                             onClick={() => window.open("https://github.com/pollinations/pollinations", "_blank", "noopener,noreferrer")}
                             className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Github className="w-4 h-4 mr-2" />
                            Star on GitHub
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.open("https://enter.pollinations.ai/", "_blank", "noopener,noreferrer")}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Read More
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
