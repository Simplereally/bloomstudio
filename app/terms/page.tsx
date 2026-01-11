import { Footer } from "@/components/layout/footer"
import { LandingHeader } from "@/components/landing/landing-header"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Terms of Service | Bloom Studio",
    description: "Terms of Service for Bloom Studio. Please read these terms carefully before using our AI image and video generation services.",
    alternates: {
        canonical: "/terms",
    },
}

export default function TermsPage() {
    return (
        <div className="dark min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-primary-foreground">
            <LandingHeader />

            <main className="flex-1 container mx-auto px-6 pt-32 pb-20 max-w-4xl">
                 <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                    <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="space-y-8 text-foreground/90 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                        <p className="mb-4">
                            Welcome to Bloom Studio ("we," "our," or "us"). By accessing or using our website, application, and AI image and video generation services (collectively, the "Service"), 
                            you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service.
                        </p>
                        <p>
                            These Terms apply to all visitors, users, and others who access or use the Service. You represent that you are over the age of 13.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
                        <p className="mb-4">
                            Bloom Studio provides artificial intelligence-powered tools for generating images and videos based on text prompts and other inputs. 
                            You acknowledge that the Service uses experimental technology and may produce results that are unpredictable, inaccurate, or offensive.
                        </p>
                        <p>
                            We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                        <p className="mb-4">
                            To access certain features of the Service, you may need to register for an account using a supported authentication provider (e.g., Google, GitHub). 
                            You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
                        </p>
                        <p>
                            You agree to notify us immediately of any unauthorized use of your account. We reserve the right to terminate your account if you violate these Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">4. Subscriptions and Billing</h2>
                        <h3 className="text-xl font-semibold mb-2 mt-6">Subscriptions</h3>
                        <p className="mb-4">
                            Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). 
                            Billing cycles are typically set on a monthly or annual basis, depending on the type of subscription plan you select.
                        </p>
                        
                        <h3 className="text-xl font-semibold mb-2 mt-6">Billing</h3>
                        <p className="mb-4">
                            We use a third-party payment processor (Stripe) to bill you. The processing of payments will be subject to the terms, conditions, and privacy policies of the Payment Processor in addition to these Terms.
                        </p>

                        <h3 className="text-xl font-semibold mb-2 mt-6">Cancellation</h3>
                        <p className="mb-4">
                            You may cancel your Subscription renewal either through your account settings page or by contacting our support team. You will not receive a refund for the fees you already paid for your current Subscription period, 
                            and you will be able to access the Service until the end of your current Subscription period.
                        </p>

                        <h3 className="text-xl font-semibold mb-2 mt-6">Fee Changes</h3>
                        <p className="mb-4">
                            Bloom Studio, in its sole discretion and at any time, may modify the Subscription fees. Any Subscription fee change will become effective at the end of the then-current Billing Cycle.
                            We will provide you with reasonable prior notice of any change in Subscription fees to give you an opportunity to terminate your Subscription before such change becomes effective.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">5. Content and Ownership</h2>
                        <h3 className="text-xl font-semibold mb-2 mt-6">Your Generative Content</h3>
                        <p className="mb-4">
                            Subject to your compliance with these Terms, you own the images and videos you generate using the Service ("Generative Content"). 
                            You grant us a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, 
                            publicly display, publicly perform, sublicense, and distribute your Generative Content for the purpose of operating, featuring, promoting, and improving the Service.
                        </p>
                        <p className="mb-4">
                            You understand that any Generative Content you set to "Public" visibility may be viewable by other users and the general public.
                        </p>

                        <h3 className="text-xl font-semibold mb-2 mt-6">Input Content</h3>
                        <p className="mb-4">
                            You represent and warrant that you own or have the necessary rights to use any text, images, or other data you upload or input into the Service ("Input Content").
                            You agree not to upload any content that infringes on third-party rights or violates our Acceptable Use Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">6. Prohibited Conduct</h2>
                        <p className="mb-4">You agree not to use the Service:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To generate content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, libelous, or invasive of another's privacy.</li>
                            <li>To generate non-consensual sexual content (NCSC) or child sexual abuse material (CSAM). We strictly report such content and user details to relevant authorities (e.g., NCMEC).</li>
                            <li>To impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
                            <li>To infringe upon the intellectual property rights of others.</li>
                            <li>To disrupt or interfere with the security or operation of the Service, including sending excessive requests that burden our systems (unless explicitly permitted).</li>
                            <li>To reverse engineer or attempt to extract the source code or underlying models of the Service.</li>
                            <li>To use the Service for any purpose that creates a competing product or service.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">7. Intellectual Property Rights</h2>
                        <p className="mb-4">
                            The Service under the "Bloom Studio" name, and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Bloom Studio and its licensors. 
                            The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">8. Termination</h2>
                        <p className="mb-4">
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                            Upon termination, your right to use the Service will immediately cease.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
                        <p className="mb-4">
                            In no event shall Bloom Studio, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, 
                            including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; 
                            (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, 
                            whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">10. Disclaimer and AI Nature</h2>
                        <p className="mb-4">
                            Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied.
                        </p>
                        <p className="mb-4">
                            <strong>AI Disclaimer:</strong> Artificial intelligence is a rapidly evolving field. We do not guarantee that the generated content will be accurate, consistent, unique, or suitable for your specific needs. 
                            You are responsible for verifying the accuracy and appropriateness of any output before using it.
                        </p>
                    </section>

                     <section>
                        <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
                        <p className="mb-4">
                            These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
                            Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
                        <p className="mb-4">
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. 
                            What constitutes a material change will be determined at our sole discretion.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">13. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at: <br />
                            <a href="mailto:support@bloomstudio.fun" className="text-primary hover:underline font-medium">support@bloomstudio.fun</a>
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    )
}
