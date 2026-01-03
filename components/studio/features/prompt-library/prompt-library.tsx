"use client";

/**
 * PromptLibrary - Main orchestrator component
 *
 * This is a thin wrapper that:
 * 1. Manages the Dialog shell
 * 2. Uses the usePromptLibrary hook for state management
 * 3. Routes between views based on viewState
 * 4. Handles smooth animated transitions between views
 *
 * The header is included in each child view to avoid Framer Motion
 * layout animation issues (snapping/stretching). This way the header
 * is part of the crossfade transition between views.
 */

import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { usePromptLibrary } from "@/hooks/use-prompt-library";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, Transition, Variants } from "framer-motion";
import { X } from "lucide-react";
import { PromptDetail } from "./prompt-detail";
import { PromptListView } from "./prompt-list-view";
import { SavePromptForm } from "./save-prompt-form";
import type { PromptLibraryProps } from "./types";

/**
 * Animation variants for view transitions
 * Uses a crossfade for smooth content switching
 */
const viewTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const transitionConfig: Transition = {
  type: "tween",
  duration: 0.15,
  ease: "easeInOut",
};

export function PromptLibrary({ isOpen, onClose, promptType, onInsert, initialSaveContent, onInsertComplete }: PromptLibraryProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchInputRef,
    viewState,
    selectedPrompt,
    selectPrompt,
    typeFilter,
    setTypeFilter,
    prompts,
    isLoading,
    handleCopy,
    handleInsert,
    handleRemove,
    showSaveForm,
    goBackToList,
  } = usePromptLibrary({
    isOpen,
    onClose,
    promptType,
    onInsert,
    initialSaveContent,
    onInsertComplete,
  });

  // Determine the current view key for AnimatePresence
  const viewKey = viewState === "detail" && selectedPrompt ? `detail-${selectedPrompt._id}` : viewState;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="z-[50]" />
        <DialogPrimitive.Content asChild>
          <motion.div
            layout
            className={cn(
              "bg-background fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[50] w-full max-w-[calc(100%-2rem)] rounded-lg border p-6 shadow-lg outline-none sm:max-w-4xl",
              "flex flex-col max-h-[85vh] h-fit overflow-hidden"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.2 },
              layout: { type: "spring", bounce: 0, duration: 0.3 },
            }}
          >
            {/* Animated view container - header is inside each child view */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                layout
                key={viewKey}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={viewTransition}
                transition={{
                  ...transitionConfig,
                  layout: { type: "spring", bounce: 0, duration: 0.3 },
                }}
                className="flex flex-col min-h-0 flex-1 w-full"
              >
                {viewState === "save-form" ? (
                  <SavePromptForm
                    initialContent={initialSaveContent}
                    promptType={promptType}
                    onSaved={goBackToList}
                    onCancel={goBackToList}
                  />
                ) : viewState === "detail" && selectedPrompt ? (
                  <PromptDetail
                    prompt={selectedPrompt}
                    onBack={goBackToList}
                    onCopy={() => handleCopy(selectedPrompt.content)}
                    onInsert={() => handleInsert(selectedPrompt.content)}
                    onRemove={() => handleRemove(selectedPrompt._id)}
                  />
                ) : (
                  <PromptListView
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchInputRef={searchInputRef}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    prompts={prompts}
                    isLoading={isLoading}
                    onSelectPrompt={selectPrompt}
                    onCopyPrompt={handleCopy}
                    onInsertPrompt={handleInsert}
                    onRemovePrompt={handleRemove}
                    onShowSaveForm={showSaveForm}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Close button */}
            <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export default PromptLibrary;

