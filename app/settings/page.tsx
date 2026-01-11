"use client"

import { useConvexAuth } from "convex/react"
import { ProfileCard } from "@/components/settings/profile-card"
import { AppearanceCard } from "@/components/settings/appearance-card"
import { SubscriptionCard } from "@/components/settings/subscription-card"
import { ApiCard } from "@/components/settings/api-card"
import { StarRepoCard } from "@/components/settings/star-repo-card"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { User, Palette, CreditCard, Terminal } from "lucide-react"

type Tab = "profile" | "appearance" | "subscription" | "api"

const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "api", label: "Pollinations API Key", icon: Terminal },
]

export default function SettingsPage() {
    const { isAuthenticated, isLoading } = useConvexAuth()
    const [activeTab, setActiveTab] = useState<Tab>("profile")

    if (isLoading) {
        return (
            <div className="container max-w-6xl mx-auto py-12 px-4">
                <div className="h-8 w-48 bg-muted rounded animate-pulse mb-8" />
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-64 space-y-2">
                         {[1, 2, 3, 4].map((i) => (
                             <div key={i} className="h-10 w-full bg-muted/50 rounded animate-pulse" />
                         ))}
                    </div>
                    <div className="flex-1">
                        <Card className="h-96 animate-pulse bg-muted/10 border-0" />
                    </div>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
                <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <h2 className="text-xl font-semibold text-destructive">Authentication Required</h2>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Please sign in to access your settings.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container max-w-6xl mx-auto py-12 px-4">
            <div className="mb-8 space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                                        isActive 
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === "profile" && <ProfileCard />}
                            {activeTab === "appearance" && <AppearanceCard />}
                            {activeTab === "subscription" && <SubscriptionCard />}
                            {activeTab === "api" && (
                                <div className="space-y-6">
                                    <ApiCard />
                                    <StarRepoCard />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}