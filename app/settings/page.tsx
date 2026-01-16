"use client"

import { useConvexAuth } from "convex/react"
import { ProfileCard } from "@/components/settings/profile-card"
import { AppearanceCard } from "@/components/settings/appearance-card"
import { SubscriptionCard } from "@/components/settings/subscription-card"
import { ApiCard } from "@/components/settings/api-card"
import { StarRepoCard } from "@/components/settings/star-repo-card"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, type ComponentType } from "react"
import { cn } from "@/lib/utils"
import { User, Palette, CreditCard, Terminal, Shield } from "lucide-react"

import { ContentPreferenceCard } from "@/components/settings/content-preference-card"

type Tab = "profile" | "appearance" | "subscription" | "api" | "privacy"

interface SettingsTab {
    id: Tab
    label: string
    icon: ComponentType<{ className?: string }>
}

const tabs: SettingsTab[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "privacy", label: "Privacy & Safety", icon: Shield },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "api", label: "Pollinations API Key", icon: Terminal },
]

function isTab(value: string): value is Tab {
    return tabs.some((tab) => tab.id === value)
}

export default function SettingsPage() {
    const { isAuthenticated, isLoading } = useConvexAuth()
    const [activeTab, setActiveTab] = useState<Tab>("profile")

    if (isLoading) {
        return (
            <div className="container max-w-6xl mx-auto py-12 px-4">
                <div className="h-8 w-48 bg-muted rounded animate-pulse mb-8" />
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-64 space-y-2">
                         {[1, 2, 3, 4, 5].map((i) => (
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
                <p className="text-muted-foreground text-lg">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Tabs 
                defaultValue="profile" 
                value={activeTab} 
                onValueChange={(value) => {
                    if (isTab(value)) setActiveTab(value)
                }}
                className="flex flex-col lg:flex-row gap-8 items-start"
            >
                <TabsList className="flex lg:flex-col h-auto w-full lg:w-64 bg-transparent p-0 gap-1 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 justify-start">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className={cn(
                                    "flex items-center justify-start gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap w-full border-0",
                                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20",
                                    "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                <div className="flex-1 min-w-0 w-full">
                    <TabsContent value="profile" className="m-0 focus-visible:outline-none">
                        <ProfileCard />
                    </TabsContent>
                    <TabsContent value="appearance" className="m-0 focus-visible:outline-none">
                        <AppearanceCard />
                    </TabsContent>
                    <TabsContent value="privacy" className="m-0 focus-visible:outline-none">
                        <ContentPreferenceCard />
                    </TabsContent>
                    <TabsContent value="subscription" className="m-0 focus-visible:outline-none">
                        <SubscriptionCard />
                    </TabsContent>
                    <TabsContent value="api" className="m-0 focus-visible:outline-none space-y-6">
                        <ApiCard />
                        <StarRepoCard />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
