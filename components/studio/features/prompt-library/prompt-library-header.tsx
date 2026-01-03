"use client";

/**
 * PromptLibraryHeader - Shared header for all prompt library views
 * 
 * By including this in each view rather than at the parent level,
 * the header becomes part of the crossfade animation and avoids
 * the snapping/stretching issues caused by Framer Motion's layout animations.
 */

import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Library } from "lucide-react";

export function PromptLibraryHeader() {
  return (
    <DialogHeader className="shrink-0">
      <DialogTitle className="flex items-center gap-2">
        <Library className="h-5 w-5 text-primary" />
        Prompt Library
      </DialogTitle>
      <DialogDescription>Browse, search, and manage your saved prompts</DialogDescription>
    </DialogHeader>
  );
}
