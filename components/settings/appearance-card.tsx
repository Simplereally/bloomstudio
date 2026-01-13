"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Moon, Sun, Laptop } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppearanceCard() {
    const { theme, setTheme } = useTheme()

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader>
                <CardTitle className="text-xl">Appearance</CardTitle>
                <CardDescription>
                    Customize the look and feel of your experience.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4">
                    <ThemeOption
                        icon={Sun}
                        label="Light"
                        active={theme === "light"}
                        onClick={() => setTheme("light")}
                    />
                    <ThemeOption
                        icon={Moon}
                        label="Dark"
                        active={theme === "dark"}
                        onClick={() => setTheme("dark")}
                    />
                    <ThemeOption
                        icon={Laptop}
                        label="System"
                        active={theme === "system"}
                        onClick={() => setTheme("system")}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function ThemeOption({
    icon: Icon,
    label,
    active,
    onClick
}: {
    icon: typeof Sun
    label: string
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all duration-200 hover:bg-accent/50",
                active
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/20"
            )}
        >
            <Icon className={cn("w-5 h-5", active && "fill-current")} />
            <span className="font-medium text-sm">{label}</span>
        </button>
    )
}
