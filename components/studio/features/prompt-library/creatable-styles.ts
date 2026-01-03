/**
 * Shared styles for react-select/creatable component
 * Used in the prompt library form for category selection
 */

import { cn } from "@/lib/utils";

export const creatableClassNames = {
    control: (state: { isFocused: boolean }) =>
        cn(
            "!min-h-9 !bg-transparent !border-input !shadow-xs !rounded-md",
            state.isFocused && "!border-ring !ring-ring/50 !ring-[3px]"
        ),
    menu: () => "!bg-popover !border !border-border !rounded-md !shadow-md",
    option: (state: { isFocused: boolean; isSelected: boolean }) =>
        cn(
            "!text-sm !cursor-pointer",
            state.isFocused && "!bg-muted",
            state.isSelected && "!bg-primary !text-primary-foreground"
        ),
    singleValue: () => "!text-foreground",
    input: () => "!text-foreground",
    placeholder: () => "!text-muted-foreground",
    indicatorSeparator: () => "!bg-border",
    dropdownIndicator: () => "!text-muted-foreground",
    clearIndicator: () => "!text-muted-foreground hover:!text-foreground",
}

export const creatableStyles = {
    control: (base: Record<string, unknown>) => ({
        ...base,
        backgroundColor: "transparent",
    }),
    menu: (base: Record<string, unknown>) => ({
        ...base,
        zIndex: 250,
        pointerEvents: "auto" as const,
    }),
    menuPortal: (base: Record<string, unknown>) => ({
        ...base,
        zIndex: 250,
        pointerEvents: "auto" as const,
    }),
}
