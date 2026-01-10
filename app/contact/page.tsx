import { Footer } from "@/components/layout/footer"
import { Mail, MessageSquare } from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"

export default function ContactPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <LandingHeader />

            <main className="flex-1 container mx-auto px-6 pt-32 pb-20 max-w-2xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
                    <p className="text-muted-foreground text-lg">
                        Have questions or need help? We're here for you.
                    </p>
                </div>

                <div className="grid gap-6">
                    <div className="p-8 rounded-2xl glass-effect-home border border-white/10 flex items-start gap-4">
                        <div className="p-3 bg-primary/20 rounded-xl">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Email Support</h3>
                            <p className="text-muted-foreground mb-4">
                                For billing inquiries, account issues, or general support.
                            </p>
                            <a href="mailto:support@bloomstudio.fun" className="text-primary hover:underline font-medium">
                                support@bloomstudio.fun
                            </a>
                        </div>
                    </div>

                    <div className="p-8 rounded-2xl glass-effect-home border border-white/10 flex items-start gap-4">
                        <div className="p-3 bg-primary/20 rounded-xl">
                            <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Discord Community</h3>
                            <p className="text-muted-foreground mb-4">
                                Join our community to share your creations, get prompts, and chat with other creators.
                            </p>
                            <a href="https://discord.gg/pollinations" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                Join Discord
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
