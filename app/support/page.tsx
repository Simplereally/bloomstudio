import { Footer } from "@/components/layout/footer"
import { HelpCircle, Mail } from "lucide-react"
import Link from "next/link"
import { LandingHeader } from "@/components/landing/landing-header"

export default function SupportPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <LandingHeader />

            <main className="flex-1 container mx-auto px-6 pt-32 pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-6">Support Center</h1>
                    <p className="text-muted-foreground text-lg">
                        How can we help you today?
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <Link href="/faq" className="group p-8 rounded-2xl glass-effect-home border border-white/10 hover:border-primary/50 transition-all hover:bg-white/5">
                        <div className="mb-6 inline-block p-4 bg-primary/20 rounded-2xl group-hover:bg-primary/30 transition-colors">
                            <HelpCircle className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Read FAQs</h2>
                        <p className="text-muted-foreground">
                            Browse common questions about billing, features, and account management.
                        </p>
                    </Link>
                    
                    <Link href="/contact" className="group p-8 rounded-2xl glass-effect-home border border-white/10 hover:border-primary/50 transition-all hover:bg-white/5">
                        <div className="mb-6 inline-block p-4 bg-primary/20 rounded-2xl group-hover:bg-primary/30 transition-colors">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
                        <p className="text-muted-foreground">
                            Get in touch with our support team for personalized assistance.
                        </p>
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    )
}
