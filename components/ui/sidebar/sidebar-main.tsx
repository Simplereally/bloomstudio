"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"

/** Builds the transform class for the mobile sidebar based on side and open state */
export function getMobileSidebarTransformClass(
  side: "left" | "right",
  openMobile: boolean
): string {
  if (side === "left" && !openMobile) return "-translate-x-full"
  if (side === "right" && !openMobile) return "translate-x-full"
  return ""
}

/** Builds the position/border classes for mobile sidebar */
export function getMobileSidebarPositionClass(side: "left" | "right"): string {
  return side === "left" ? "left-0 border-r" : "right-0 border-l"
}

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        {/* Overlay - clickable backdrop to close sidebar */}
        {openMobile && (
          <div
            className="fixed inset-0 z-40 bg-black/50 animate-in fade-in-0 duration-200"
            onClick={() => setOpenMobile(false)}
            aria-hidden="true"
          />
        )}
        {/* Always-mounted sidebar container - uses CSS transforms like desktop */}
        <div
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          data-state={openMobile ? "expanded" : "collapsed"}
          className={cn(
            "bg-sidebar text-sidebar-foreground fixed inset-y-0 z-50 flex h-svh flex-col transition-transform duration-200 ease-out",
            getMobileSidebarPositionClass(side),
            getMobileSidebarTransformClass(side, openMobile),
            className
          )}
          style={{
            width: "var(--sidebar-width)",
          } as React.CSSProperties}
          {...props}
        >
          <div className="flex h-full w-full flex-col">{children}</div>
        </div>
      </>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
