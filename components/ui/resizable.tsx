"use client"

import { GripVerticalIcon } from "lucide-react"
import * as React from "react"
// Note: This project uses react-resizable-panels@4.0.13, which is a major update from previous versions.
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: GroupProps) {
  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel(props: PanelProps) {
  return <Panel data-slot="resizable-panel" {...props} />
}

interface ResizableHandleProps extends Omit<SeparatorProps, 'children'> {
  withHandle?: boolean
  /** Callback fired when drag starts/stops - used for performance optimization */
  onDragging?: (isDragging: boolean) => void
}

function ResizableHandle({
  withHandle,
  className,
  onDragging,
  ...props
}: ResizableHandleProps) {
  const isDraggingRef = React.useRef(false)
  
  // Handle pointer down - start tracking drag
  const handlePointerDown = React.useCallback(() => {
    if (!isDraggingRef.current) {
      isDraggingRef.current = true
      onDragging?.(true)
      
      // Listen for pointer up on document to catch release anywhere
      const handlePointerUp = () => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false
          onDragging?.(false)
        }
        document.removeEventListener('pointerup', handlePointerUp)
        document.removeEventListener('pointercancel', handlePointerUp)
      }
      
      document.addEventListener('pointerup', handlePointerUp)
      document.addEventListener('pointercancel', handlePointerUp)
    }
  }, [onDragging])
  
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className
      )}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }

