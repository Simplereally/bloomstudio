
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { RESOURCES, SOLUTIONS } from "@/lib/seo-config"

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl mt-auto">
            <div className="container mx-auto px-6 py-12 md:py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
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
                        <h3 className="font-bold text-lg mb-6 text-foreground">Start Creating</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Join thousands of creators making stunning content with Bloom Studio.
                        </p>
                        <Link href="/sign-up">
                            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 group w-full justify-center">
                                Get Started
                                <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </button>
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
