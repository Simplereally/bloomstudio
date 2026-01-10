"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ApiKeyOnboardingModal } from "@/components/studio/api-key-onboarding-modal"
import { UpgradeModal } from "@/components/studio/upgrade-modal"
import { cn, isLocalhost } from "@/lib/utils"
import { SubscriptionBadge } from "@/components/subscription/subscription-badge"
import { UserButton, useUser } from "@clerk/nextjs"
import { Crown, Heart, HelpCircle, History, Key, Menu, Moon, Settings, Sparkles, Sun, Users, X } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const navItems = [
    { href: "/studio", label: "Studio", icon: Sparkles },
    { href: "/feed", label: "Feed", icon: Users },
    { href: "/history", label: "History", icon: History },
    { href: "/favorites", label: "Favorites", icon: Heart },
]

/**
 * Main navigation header component.
 * Provides consistent navigation across all pages with responsive mobile menu.
 */
export function Header() {
    const pathname = usePathname()
    const { isSignedIn, isLoaded } = useUser()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { theme, setTheme } = useTheme()
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
    const [onboardingModalOpen, setOnboardingModalOpen] = useState(false)

    // Prevent hydration mismatch
    const [mounted, setMounted] = useState(false)
    const [isLocalDev, setIsLocalDev] = useState(false)

    useEffect(() => {
        setMounted(true)
        setIsLocalDev(isLocalhost())
    }, [])

    if (pathname === "/" || pathname === "/about" || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname.startsWith("/solutions") || pathname.startsWith("/faq") || pathname.startsWith("/pricing") || pathname.startsWith("/support") || pathname.startsWith("/contact") || pathname.startsWith("/privacy") || pathname.startsWith("/terms")) return null

    const showAuthUI = mounted && isLoaded

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
            <div className="container mx-auto flex h-14 items-center px-6">
                {/* Left Side: Logo */}
                <div className="flex-1 flex justify-start">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl font-bold text-primary font-brand tracking-tight -skew-x-6">
                            Bloom Studio
                        </span>
                    </Link>
                </div>

                {/* Center: Desktop Navigation - Pill Style */}
                {showAuthUI && isSignedIn && (
                    <nav className="hidden md:flex items-center p-1 rounded-full bg-muted/30 border border-border/50 shadow-inner backdrop-blur-md">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href)
                            const Icon = item.icon
                            return (
                                <Link key={item.href} href={item.href}>
                                    <div
                                        className={cn(
                                            "relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                                            isActive
                                                ? "text-primary bg-primary/10 shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                        {item.label}
                                        {isActive && (
                                            <span
                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-[80%]"
                                                style={{
                                                    background: "linear-gradient(90deg, transparent 0%, #f97316 30%, #f97316 70%, transparent 100%)"
                                                }}
                                            />
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>
                )}

                {/* Right Side: Settings & Auth */}
                <div className="flex-1 flex justify-end items-center gap-3">
                    <div className="flex items-center gap-1.5 p-1 rounded-full bg-muted/30 border border-border/50">
                        {/* Test Modals - Dev Only */}
                        {isLocalDev && (
                            <div className="flex items-center gap-1 mr-1 pr-1 border-r border-border/50">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-accent text-primary"
                                    onClick={() => setUpgradeModalOpen(true)}
                                >
                                    <Crown className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-accent text-amber-500"
                                    onClick={() => setOnboardingModalOpen(true)}
                                >
                                    <Key className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}

                        {/* Settings */}
                        {mounted && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <Settings className="h-4 w-4" />
                                        <span className="sr-only">Settings</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 mt-2 border-border bg-popover/90 backdrop-blur-xl">
                                    <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="focus:bg-accent">
                                        {theme === "dark" ? (
                                            <>
                                                <Sun className="mr-2 h-4 w-4 text-amber-500" />
                                                Light Mode
                                            </>
                                        ) : (
                                            <>
                                                <Moon className="mr-2 h-4 w-4 text-primary" />
                                                Dark Mode
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/50" />
                                    <DropdownMenuItem asChild className="focus:bg-accent">
                                        <Link href="/settings" className="flex w-full items-center">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="focus:bg-accent">
                                        <HelpCircle className="mr-2 h-4 w-4" />
                                        Help & Support
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Subscription Tier Badge */}
                        {showAuthUI && isSignedIn && (
                            <div className="hidden sm:block">
                                <SubscriptionBadge />
                            </div>
                        )}

                        {/* User Button */}
                        {showAuthUI && isSignedIn && (
                            <div className="pl-1 border-l border-border/50 ml-1">
                                <UserButton
                                    afterSignOutUrl="/"
                                    appearance={{
                                        elements: {
                                            avatarBox: "h-8 w-8 ring-2 ring-border/50 hover:ring-primary/40 transition-all duration-300"
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {showAuthUI && !isSignedIn && (
                        <Link href="/sign-in">
                            <Button variant="outline" size="sm" className="rounded-full border-border hover:bg-accent">
                                Sign In
                            </Button>
                        </Link>
                    )}

                    {/* Mobile menu toggle */}
                    {showAuthUI && isSignedIn && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden h-9 w-9 rounded-full bg-muted/30 border border-border/50"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <span className="sr-only">Toggle menu</span>
                            {mobileMenuOpen ? (
                                <X className="h-4 w-4" />
                            ) : (
                                <Menu className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Mobile Navigation */}
            {showAuthUI && isSignedIn && mobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-2xl animate-in slide-in-from-top-1 duration-200">
                    <nav className="container mx-auto px-6 py-6 flex flex-col gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href)
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start gap-4 h-12 rounded-xl text-base font-medium transition-all",
                                            isActive
                                                ? "bg-primary/10 text-primary border border-primary/20"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                    </Button>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}

            {/* Dev-only Modals */}
            {isLocalDev && (
                <>
                    <UpgradeModal
                        isOpen={upgradeModalOpen}
                        onClose={() => setUpgradeModalOpen(false)}
                    />
                    <ApiKeyOnboardingModal
                        forceOpen={onboardingModalOpen}
                        onClose={() => setOnboardingModalOpen(false)}
                    />
                </>
            )}
        </header>
    )
}

