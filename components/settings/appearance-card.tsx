"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Moon, Sun, Laptop, Check, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function AppearanceCard() {
    const { theme, setTheme } = useTheme()

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold">Appearance</CardTitle>
                <CardDescription className="text-base text-muted-foreground/80">
                    Customize the look and feel of your experience.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup 
                    value={theme} 
                    onValueChange={(v) => setTheme(v)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <ThemeOption
                        id="light"
                        icon={Sun}
                        label="Light"
                        active={theme === "light"}
                    />
                    <ThemeOption
                        id="dark"
                        icon={Moon}
                        label="Dark"
                        active={theme === "dark"}
                    />
                    <ThemeOption
                        id="system"
                        icon={Laptop}
                        label="System"
                        active={theme === "system"}
                    />
                </RadioGroup>
            </CardContent>
        </Card>
    )
}

function ThemeOption({
    id,
    icon: Icon,
    label,
    active,
}: {
    id: string
    icon: LucideIcon
    label: string
    active: boolean
}) {
    return (
        <div className="relative">
            <RadioGroupItem
                value={id}
                id={id}
                className="sr-only"
            />
            <Label
                htmlFor={id}
                className={cn(
                    "flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                    active
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-border/40 bg-muted/20 hover:border-primary/30 hover:bg-muted/30"
                )}
            >
                {/* Background Glow */}
                {active && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                )}

                <div className={cn(
                    "p-3 rounded-xl transition-colors duration-300",
                    active 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                        : "bg-background/80 text-muted-foreground group-hover:text-primary transition-colors"
                )}>
                    <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                        "font-bold text-sm tracking-tight",
                        active ? "text-primary" : "text-muted-foreground"
                    )}>
                        {label}
                    </span>
                </div>

                {active && (
                    <div className="absolute top-2 right-2">
                        <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                        </div>
                    </div>
                )}
            </Label>
        </div>
    )
}
