import { Footer } from "@/components/layout/footer"
import { LandingHeader } from "@/components/landing/landing-header"
import { JsonLd } from "@/components/seo/json-ld"
import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Sparkles, Shield, Users, Heart, Star, Code, Globe, Zap } from "lucide-react"

export const metadata: Metadata = {
    title: "About Us | Bloom Studio",
    description: "Learn about Bloom Studio, our mission to democratize AI art creation, and our commitment to privacy and quality.",
    alternates: {
        canonical: "/about"
    }
}

export default function AboutPage() {
    return (
        <div className="dark min-h-screen bg-[#030303] text-white selection:bg-primary/30">
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "AboutPage",
                    name: "About Bloom Studio",
                    description: "About Bloom Studio, our mission and values.",
                    mainEntity: {
                        "@type": "Organization",
                        name: "Bloom Studio",
                        foundingDate: "2024",
                        description: "AI image and video generation platform."
                    }
                }}
            />
            
            <LandingHeader />

            <main className="relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] pointer-events-none overflow-hidden -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
                </div>

                {/* Hero Section */}
                <section className="pt-40 pb-24 relative">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <Star className="w-3.h-3 fill-current" />
                                <span>MEET BLOOM STUDIO</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 leading-[1.1]">
                                Where Human Creativity <br className="hidden md:block" /> Meets Machine Intelligence.
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                We're on a mission to put world-class generative tools into the hands of every creator, without the friction or the high price tag.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Visual Break */}
                <section className="py-12">
                    <div className="container mx-auto px-6">
                        <div className="relative h-[400px] rounded-3xl overflow-hidden border border-white/10 group">
                            <Image 
                                src="/abstract_creativity_bloom_1767921325934.png" 
                                alt="Abstract Creativity" 
                                fill 
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                <h3 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 mb-4">
                                    Limitless Possibilities
                                </h3>
                                <p className="text-xl text-white/80 max-w-2xl font-light">
                                    Powered by the most advanced open-source models available today
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-24 relative space-y-32">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <h2 className="text-3xl md:text-4xl font-bold">Our Philosophy</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    We believe that professional-grade AI tools should be accessible to everyone. Creativity shouldn't be gated by expensive enterprise subscriptions or daunting technical hurdles.
                                </p>
                                <div className="space-y-6">
                                    {[
                                        { icon: Zap, title: "Speed to Result", desc: "No queues, no waiting. Just pure creative flow." },
                                        { icon: Shield, title: "Privacy First", desc: "Your data stays yours. We don't train on your images." },
                                        { icon: Globe, title: "Open Ecosystem", desc: "Supporting open-source communities and creators everywhere." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-white">{item.title}</h4>
                                                <p className="text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative aspect-square">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-3xl -z-10" />
                                <div className="h-full w-full rounded-2xl bg-white/5 border border-white/10 p-8 flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="space-y-4 pt-8">
                                            <div className="aspect-square rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-primary/50" />
                                            </div>
                                            <div className="aspect-square rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                <Code className="w-8 h-8 text-primary" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="aspect-square rounded-xl bg-gradient-to-bl from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                                                <Users className="w-8 h-8 text-white/50" />
                                            </div>
                                            <div className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                <Heart className="w-8 h-8 text-rose-500/50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Community Focus */}
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="order-2 md:order-1 relative h-[500px] rounded-3xl overflow-hidden border border-white/10">
                                <Image 
                                    src="/digital_collaboration_network_1767921348666.png" 
                                    alt="Community Network" 
                                    fill 
                                    className="object-cover"
                                />
                            </div>
                            <div className="order-1 md:order-2 space-y-8">
                                <h2 className="text-3xl md:text-4xl font-bold">Contributor & Supporter</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    We don't just use AI; we actively contribute to its growth and accessibility. 
                                </p>
                                <p className="text-lg text-muted-foreground leading-relaxed italic border-l-2 border-primary pl-6">
                                    "Bloom Studio is a dedicated contributor and supporter of the Pollinations community, working together to bring open-source AI models to a wider audience."
                                </p>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    By building on top of and contributing to open-source initiatives and leading model providers like Pollinations.AI, we've created a platform that brings state-of-the-art generation capabilities to your browser.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-24 bg-gradient-to-b from-transparent to-white/[0.02] border-y border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto text-center space-y-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-center">Built on Trust</h2>
                            <div className="grid md:grid-cols-2 gap-8 text-left">
                                <div className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-primary/20 transition-colors relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                                         <Users className="w-24 h-24 -mr-8 -mt-8 text-primary rotate-12" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-4 relative z-10">Small but Mighty</h3>
                                    <p className="text-muted-foreground leading-relaxed relative z-10">
                                        We are a small, independent team based across the globe. We aren't backed by VC giants, which means we answer only to our users. Our focus is on shipping fast and maintaining the best possible user experience.
                                    </p>
                                </div>
                                <div className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-primary/20 transition-colors relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                                         <Shield className="w-24 h-24 -mr-8 -mt-8 text-emerald-500 rotate-12" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-4 relative z-10">Our Open Promise</h3>
                                    <p className="text-muted-foreground leading-relaxed relative z-10">
                                        No hidden fees. No data selling. Just powerful tools to help you create. We believe in transparency, which is why we're open about our stack and our collaborations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 -z-10" />
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to start blooming?</h2>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <Link href="/studio">
                                <button className="px-12 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:scale-105 transition-all shadow-[0_0_40px_rgba(var(--primary),0.3)]">
                                    Open Studio
                                </button>
                            </Link>
                            <Link href="/pricing">
                                <button className="px-12 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all">
                                    See Pricing
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}

