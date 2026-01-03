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
import { cn } from "@/lib/utils"
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
    
    // Prevent hydration mismatch by only showing auth-dependent UI after mount
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    // Don't render on landing page or auth pages
    if (pathname === "/" || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return null
    
    // Auth state is only reliable after mount + Clerk load
    const showAuthUI = mounted && isLoaded

    return (
        <header className="sticky top-0 z-10 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center px-4">
                {/* Left Side: Logo */}
                <div className="flex-1 flex justify-start">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-primary font-brand tracking-tight -skew-x-10">
                            Bloom Studio
                        </span>
                    </Link>
                </div>

                {/* Center: Desktop Navigation - Only show when signed in */}
                {showAuthUI && isSignedIn && (
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href)
                            const Icon = item.icon
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        size="sm"
                                        className={cn(
                                            "gap-2 font-medium",
                                            isActive 
                                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                                : "hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Button>
                                </Link>
                            )
                        })}
                    </nav>
                )}

                {/* Right Side: Settings & Auth */}
                <div className="flex-1 flex justify-end">
                    <div className="flex items-center gap-2">
                        {/* Test Upgrade Modal Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted hover:text-foreground text-primary"
                            onClick={() => setUpgradeModalOpen(true)}
                            title="Test Upgrade Modal"
                        >
                            <Crown className="h-4 w-4" />
                        </Button>

                        {/* Test Onboarding Modal Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted hover:text-foreground text-amber-500"
                            onClick={() => setOnboardingModalOpen(true)}
                            title="Test Onboarding Modal"
                        >
                            <Key className="h-4 w-4" />
                        </Button>

                        {/* Settings Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted hover:text-foreground"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span className="sr-only">Settings</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                                    {theme === "dark" ? (
                                        <>
                                            <Sun className="mr-2 h-4 w-4" />
                                            Light Mode
                                        </>
                                    ) : (
                                        <>
                                            <Moon className="mr-2 h-4 w-4" />
                                            Dark Mode
                                        </>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="flex w-full items-center">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    Help & Support
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Clerk User Button - Profile & Sign Out */}
                        {showAuthUI && isSignedIn && (
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "h-8 w-8"
                                    }
                                }}
                            />
                        )}

                        {showAuthUI && !isSignedIn && (
                            <Link href="/sign-in">
                                <Button variant="ghost" size="sm" className="hover:bg-muted hover:text-foreground">
                                    Sign In
                                </Button>
                            </Link>
                        )}

                        {/* Mobile menu toggle - Only show when signed in */}
                        {showAuthUI && isSignedIn && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden hover:bg-muted hover:text-foreground"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation - Only show when signed in */}
            {showAuthUI && isSignedIn && mobileMenuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
                    <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
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
                                            "w-full justify-start gap-3",
                                            isActive 
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Button>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}

            {/* Upgrade Modal for testing */}
            <UpgradeModal 
                isOpen={upgradeModalOpen} 
                onClose={() => setUpgradeModalOpen(false)} 
            />

            {/* Onboarding Modal for testing */}
            <ApiKeyOnboardingModal 
                forceOpen={onboardingModalOpen}
                onClose={() => setOnboardingModalOpen(false)}
            />
        </header>
    )
}

