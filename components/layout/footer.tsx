
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { RESOURCES, SOLUTIONS } from "@/lib/seo-config"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"

/** Popular models highlighted in the footer. Ordered by traffic priority. */
const FOOTER_MODELS = [
    { slug: "flux-schnell", label: "Flux Schnell" },
    { slug: "gpt-image", label: "GPT Image" },
    { slug: "imagen-4", label: "Imagen 4" },
    { slug: "grok-video", label: "Grok Video" },
] as const

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl mt-auto">
            <div className="container mx-auto px-6 py-12 md:py-20">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <span className="text-2xl font-bold text-primary font-brand tracking-tight -skew-x-6">
                                Bloom Studio
                            </span>
                        </Link>
                        <p className="text-muted-foreground mb-6">
                            Unleash your creativity with the power of AI. Generate images, videos, and more with our professional suite of tools.
                        </p>
                        <div className="flex items-center gap-4">
                            {/* Social links could go here */}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-6 text-foreground">Solutions</h3>
                        <ul className="space-y-4">
                            {SOLUTIONS.map((item) => (
                                <li key={item.slug}>
                                    <Link 
                                        href={`/solutions/${item.slug}`}
                                        className="text-muted-foreground hover:text-primary transition-colors text-sm"
                                    >
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-6 text-foreground">Models</h3>
                        <ul className="space-y-4">
                            {FOOTER_MODELS.map((model) => (
                                <li key={model.slug}>
                                    <Link
                                        href={`/models/${model.slug}/create`}
                                        className="text-muted-foreground hover:text-primary transition-colors text-sm"
                                    >
                                        {model.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href="/models"
                                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                                >
                                    View all models →
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-6 text-foreground">Company</h3>
                        <ul className="space-y-4">
                            {RESOURCES.map((item) => (
                                <li key={item.name}>
                                    <Link 
                                        href={item.href}
                                        className="text-muted-foreground hover:text-primary transition-colors text-sm"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-6 text-foreground">Start Generating Free</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Create realistic photos, anime, and 4K videos from text. Join thousands using the best free AI image and video generator.
                        </p>
                        <Link href="/sign-up">
                            <Button variant="default" className={cn(
                                "group w-full justify-center",
                                // Typography - Editorial Style
                                "text-xs font-bold uppercase tracking-[0.2em]",
                            )}>
                                <span className="relative opacity-90 group-hover:opacity-100 transition-opacity">
                                    Get Started
                                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary-foreground/50 group-hover:w-full transition-all duration-300 ease-out" />
                                </span>
                                <ArrowRight className="h-4 w-4 ml-2 opacity-70 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-muted-foreground text-sm">
                        © {new Date().getFullYear()} Bloom Studio. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
