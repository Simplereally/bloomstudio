import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { ScrollReveal } from "./scroll-reveal"

export function CtaSection() {
    return (
        <section id="get-started" className="py-24 xl:py-28 2xl:py-32 relative">
            <div className="container mx-auto px-6">
                <ScrollReveal>
                <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10 p-12 sm:p-16 relative overflow-hidden">


                        <div className="relative">
                            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                                Ready for your creativity to <span className="text-primary">bloom</span>?
                            </h2>
                            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                                Get 24 hours of full, unrestricted access. Every model, every feature, no limits.
                                <br />
                                <span className="text-foreground/80">Then just $5/month to keep creating.</span>
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/studio">
                                    <Button
                                        size="lg"
                                        className="px-10 h-14 text-lg transition-all group"
                                    >
                                        Start Your Free Trial
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="/pricing">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="px-10 h-14 text-lg border-white/20 hover:bg-white/5"
                                    >
                                        Compare Plans
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    )
}
