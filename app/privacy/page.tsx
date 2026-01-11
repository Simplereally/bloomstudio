import { Footer } from "@/components/layout/footer"
import { LandingHeader } from "@/components/landing/landing-header"
import { Metadata } from "next"

import { LAST_UPDATED } from "@/lib/constants"

export const metadata: Metadata = {
    title: "Privacy Policy | Bloom Studio",
    description: "Privacy Policy for Bloom Studio. Learn how we collect, use, and protect your personal information.",
    alternates: {
        canonical: "/privacy",
    },
}

export default function PrivacyPage() {
    return (
        <div className="dark min-h-screen relative selection:bg-primary/30 selection:text-primary-foreground bg-background">
            <LandingHeader />

            <main className="relative pt-32 pb-20 container mx-auto px-6 max-w-4xl z-10">
                {/* Background Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-50 pointer-events-none -z-10" />

                 <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Privacy Policy</h1>
                    <p className="text-muted-foreground text-lg">Last updated: {LAST_UPDATED}</p>
                </div>

                <div className="space-y-12 text-foreground/90 leading-relaxed text-lg">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">1. Introduction</h2>
                        <p className="mb-4 text-muted-foreground">
                            Welcome to Bloom Studio ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
                            and use our AI image and video generation services (collectively, the "Service").
                        </p>
                        <p className="text-muted-foreground">
                            By accessing or using our Service, you agree to the terms of this Privacy Policy. If you do not agree with the terms of this Privacy Policy, 
                            please do not access the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">2. Information We Collect</h2>
                        <p className="mb-4 text-muted-foreground">We may collect information about you in a variety of ways. The information we may collect on the Service includes:</p>
                        
                        <h3 className="text-xl font-semibold mb-2 mt-6 text-foreground">Personal Data</h3>
                        <p className="mb-4 text-muted-foreground">
                            Personally identifiable information, such as your name, email address, and payment information (processed securely by our third-party payment processors), 
                            that you voluntarily give to us when you register with the Service or confirm a transaction.
                        </p>

                        <h3 className="text-xl font-semibold mb-2 mt-6 text-foreground">Derivative Data & Cookies</h3>
                        <p className="mb-4 text-muted-foreground">
                            Information our servers automatically collect when you access the Service, such as your IP address, browser type, operating system, access times, and page views.
                            We and our third-party partners (such as authentication and analytics providers) may use cookies and similar tracking technologies to operate the Service and analyze usage patterns.
                        </p>

                        <h3 className="text-xl font-semibold mb-2 mt-6 text-foreground">User Content & Interactions</h3>
                        <p className="text-muted-foreground mb-4">
                            We collect content you provide to the Service, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Text prompts and parameters used for generation.</li>
                            <li>Reference images you upload for image-to-image or video generation tasks.</li>
                            <li>The resulting generated images and videos.</li>
                            <li>Interaction data, such as users you follow, and content you "like" or "favorite."</li>
                        </ul>
                        <p className="text-muted-foreground mt-4">
                            Please note that depending on your visibility settings, some of this content (specifically generated images) may be visible to other users of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">3. How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>To provide, operate, and maintain our Service.</li>
                            <li>To improve, personalize, and expand our Service.</li>
                            <li>To facilitate social interactions, such as following and favoriting.</li>
                            <li>To understand and analyze how you use our Service.</li>
                            <li>To process your transactions and manage your account.</li>
                            <li>To communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service.</li>
                            <li>To find and prevent fraud.</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">4. Disclosure of Your Information</h2>
                        <p className="mb-4 text-muted-foreground">We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>
                                <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
                            </li>
                            <li>
                                <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including:
                                <ul className="list-circle pl-6 mt-2 space-y-1">
                                    <li><strong>Authentication:</strong> We use Clerk to manage user identity and authentication data securely.</li>
                                    <li><strong>AI Model Providers:</strong> We transmit your prompts, parameters, and reference images to AI service providers (such as Pollinations AI and OpenRouter) for content generation and prompt enhancement.</li>
                                    <li><strong>Storage:</strong> We use Cloudflare R2 to store user-uploaded reference images and other system assets.</li>
                                    <li><strong>Payment Processors:</strong> We use Stripe to securely process payments.</li>
                                    <li><strong>Hosting & Infrastructure:</strong> We use providers like Vercel and Convex to host and run our application.</li>
                                    <li><strong>Analytics & Performance:</strong> We use Vercel Analytics and Speed Insights to collect anonymous interaction data (such as page views, events, and performance metrics) to improve our Service.</li>
                                </ul>
                                We do not sell your personal data to third parties.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">5. Security of Your Information</h2>
                        <p className="text-muted-foreground">
                            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">6. Policy for Children</h2>
                        <p className="text-muted-foreground">
                            We do not knowingly solicit information from or market to children under the age of 13. If we learn that we have collected personal information from a child under age 13 without verification of parental consent, we will delete that information as quickly as possible.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">7. Your Data Protection Rights (GDPR & CCPA)</h2>
                        <p className="mb-4 text-muted-foreground">We are committed to ensuring you are fully aware of all of your data protection rights. Depending on your location (including the EEA and California), you may be entitled to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
                            <li><strong>The right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate.</li>
                            <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data, under certain conditions.</li>
                            <li><strong>The right to restrict processing:</strong> You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
                            <li><strong>The right to object to processing:</strong> You have the right to object to our processing of your personal data, under certain conditions.</li>
                            <li><strong>The right to data portability:</strong> You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
                        </ul>
                         <p className="mt-4 text-muted-foreground">
                            <strong>California Residents:</strong> Under the CCPA, you have the right to request that we disclose certain information to you about our collection and use of your personal information over the past 12 months. We do not sell your personal data.
                        </p>
                        <p className="mt-4 text-muted-foreground">
                            If you would like to exercise any of these rights, please contact us. We will respond to your request within the timeframes required by applicable law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">8. International Data Transfers</h2>
                        <p className="mb-4 text-muted-foreground">
                            Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
                        </p>
                        <p className="mb-4 text-muted-foreground">
                            Specifically, our servers and third-party service providers are located in the <strong>United States</strong> (including Convex, Vercel, Clerk, Stripe, Cloudflare) and the <strong>European Union</strong> (Pollinations.ai). 
                            If you are located outside these regions and choose to provide information to us, please note that we transfer the data, including Personal Data, to these jurisdictions for processing.
                        </p>
                        <p className="text-muted-foreground">
                            By accepting this Privacy Policy, you explicitly consent to such transfer. We will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy and applicable laws (such as the Australian Privacy Principles).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">9. Contact Us</h2>
                        <p className="text-muted-foreground">
                            If you have questions or comments about this Privacy Policy, please contact us at: <br />
                            <a href="mailto:support@bloomstudio.fun" className="text-primary hover:underline font-medium">support@bloomstudio.fun</a>
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    )
}
