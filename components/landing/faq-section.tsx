
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

const faqs = [
    {
        question: "How does the free trial work?",
        answer:
            "Sign up and get 24 hours of full, unrestricted access to everything — all models, max resolution, batch generation. No credit card required. After 24 hours, upgrade to Pro for $5/month to continue.",
    },
    {
        question: "What happens after my trial expires?",
        answer:
            "You'll need to upgrade to Pro ($5/month) to continue generating images. Your account and any images you created during the trial remain accessible.",
    },
    {
        question: "What AI models are included?",
        answer:
            "We offer 10+ cutting-edge models including Flux, GPT-4 Image, Seedream, and more. Both trial and Pro users get access to all models.",
    },
    {
        question: "Why is this so much cheaper than competitors?",
        answer:
            "We built Bloomstudio to make AI image generation accessible to everyone. By keeping our infrastructure lean and focusing on what matters, we pass the savings to you.",
    },
    {
        question: "Can I cancel anytime?",
        answer:
            "Yes, cancel anytime with no questions asked. Your subscription runs until the end of the billing period, then you won't be charged again.",
    },
]

export function FaqSection() {
    return (
        <section className="container mx-auto px-6 py-20">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
                    </div>
                    <p className="text-muted-foreground">
                        Everything you need to know about our pricing
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`faq-${index}`} className="border-border/50">
                            <AccordionTrigger className="text-left text-foreground hover:text-primary">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
