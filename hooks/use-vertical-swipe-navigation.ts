"use client";

import * as React from "react";

interface UseVerticalSwipeNavigationOptions {
  enabled: boolean;
  itemKey: string | null;
  onSwipeIntent?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  directionLockRatio?: number;
}

interface UseVerticalSwipeNavigationResult {
  onPointerDown: React.PointerEventHandler<HTMLElement>;
  onPointerMove: React.PointerEventHandler<HTMLElement>;
  onPointerUp: React.PointerEventHandler<HTMLElement>;
  onPointerCancel: React.PointerEventHandler<HTMLElement>;
  touchAction: React.CSSProperties["touchAction"];
  overlayStyle: React.CSSProperties;
  mediaStyle: React.CSSProperties;
  isDragging: boolean;
  isAnimating: boolean;
}

const DEFAULT_MIN_SWIPE_DISTANCE = 96;
const DEFAULT_DIRECTION_LOCK_RATIO = 1.15;
const DRAG_START_DISTANCE = 10;
const FAST_SWIPE_VELOCITY = 0.55;
const EXIT_ANIMATION_MS = 220;
const ENTER_ANIMATION_MS = 280;
const SNAP_BACK_ANIMATION_MS = 240;
const EXIT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const ENTER_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const SNAP_BACK_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

type SwipeDirection = "up" | "down";

type SwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastY: number;
  lastTimestamp: number;
  isVerticalGesture: boolean;
  hasTriggeredIntent: boolean;
};

function getViewportHeight() {
  if (typeof window === "undefined") {
    return 800;
  }

  return Math.max(window.innerHeight, 1);
}

function getDismissThreshold(minSwipeDistance: number) {
  return Math.max(
    minSwipeDistance,
    Math.min(getViewportHeight() * 0.16, 180),
  );
}

function getTravelDistance(direction: SwipeDirection) {
  const viewportHeight = getViewportHeight();
  return direction === "up" ? -viewportHeight : viewportHeight;
}

function applyDragResistance(offsetY: number, canNavigate: boolean) {
  const resistance = canNavigate ? 0.96 : 0.32;
  const viewportHeight = getViewportHeight();
  const maxTravel = viewportHeight * 0.72;
  const limitedOffset = Math.max(-maxTravel, Math.min(maxTravel, offsetY));
  return limitedOffset * resistance;
}

function getSwipeDirection(offsetY: number): SwipeDirection {
  return offsetY < 0 ? "up" : "down";
}

function buildTransition(durationMs: number, easing: string) {
  return [
    `transform ${durationMs}ms ${easing}`,
    `opacity ${durationMs}ms ${easing}`,
  ].join(", ");
}

export function useVerticalSwipeNavigation({
  enabled,
  itemKey,
  onSwipeIntent,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = DEFAULT_MIN_SWIPE_DISTANCE,
  directionLockRatio = DEFAULT_DIRECTION_LOCK_RATIO,
}: UseVerticalSwipeNavigationOptions): UseVerticalSwipeNavigationResult {
  const swipeStateRef = React.useRef<SwipeState | null>(null);
  const navigationTimeoutRef = React.useRef<number | null>(null);
  const enterAnimationFrameRef = React.useRef<number | null>(null);
  const pendingDirectionRef = React.useRef<SwipeDirection | null>(null);
  const previousItemKeyRef = React.useRef(itemKey);

  const [offsetY, setOffsetY] = React.useState(0);
  const [transition, setTransition] = React.useState("none");
  const [isDragging, setIsDragging] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const clearScheduledWork = React.useCallback(() => {
    if (navigationTimeoutRef.current !== null) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    if (enterAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(enterAnimationFrameRef.current);
      enterAnimationFrameRef.current = null;
    }
  }, []);

  const resetGesture = React.useCallback(() => {
    swipeStateRef.current = null;
    setIsDragging(false);
  }, []);

  const animateToRest = React.useCallback(() => {
    clearScheduledWork();
    setTransition(buildTransition(SNAP_BACK_ANIMATION_MS, SNAP_BACK_EASING));
    setOffsetY(0);
    setIsDragging(false);
    setIsAnimating(true);

    navigationTimeoutRef.current = window.setTimeout(() => {
      navigationTimeoutRef.current = null;
      setTransition("none");
      setIsAnimating(false);
    }, SNAP_BACK_ANIMATION_MS);
  }, [clearScheduledWork]);

  const commitSwipe = React.useCallback(
    (direction: SwipeDirection) => {
      clearScheduledWork();
      pendingDirectionRef.current = direction;
      setTransition(buildTransition(EXIT_ANIMATION_MS, EXIT_EASING));
      setOffsetY(getTravelDistance(direction));
      setIsDragging(false);
      setIsAnimating(true);

      navigationTimeoutRef.current = window.setTimeout(() => {
        navigationTimeoutRef.current = null;

        if (direction === "up") {
          onSwipeUp?.();
          return;
        }

        onSwipeDown?.();
      }, EXIT_ANIMATION_MS);
    },
    [clearScheduledWork, onSwipeDown, onSwipeUp],
  );

  React.useEffect(() => {
    return () => {
      clearScheduledWork();
    };
  }, [clearScheduledWork]);

  React.useEffect(() => {
    const previousItemKey = previousItemKeyRef.current;
    previousItemKeyRef.current = itemKey;

    if (!enabled) {
      clearScheduledWork();
      pendingDirectionRef.current = null;
      setTransition("none");
      setOffsetY(0);
      setIsDragging(false);
      setIsAnimating(false);
      swipeStateRef.current = null;
      return;
    }

    if (previousItemKey === itemKey) {
      return;
    }

    clearScheduledWork();

    const pendingDirection = pendingDirectionRef.current;
    if (!pendingDirection) {
      setTransition("none");
      setOffsetY(0);
      setIsDragging(false);
      setIsAnimating(false);
      swipeStateRef.current = null;
      return;
    }

    const entryOffset = -getTravelDistance(pendingDirection);
    pendingDirectionRef.current = null;
    setTransition("none");
    setOffsetY(entryOffset);
    setIsDragging(false);
    setIsAnimating(true);

    enterAnimationFrameRef.current = window.requestAnimationFrame(() => {
      enterAnimationFrameRef.current = window.requestAnimationFrame(() => {
        setTransition(buildTransition(ENTER_ANIMATION_MS, ENTER_EASING));
        setOffsetY(0);

        navigationTimeoutRef.current = window.setTimeout(() => {
          navigationTimeoutRef.current = null;
          setTransition("none");
          setIsAnimating(false);
        }, ENTER_ANIMATION_MS);
      });
    });
  }, [clearScheduledWork, enabled, itemKey]);

  const onPointerDown = React.useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      if (!enabled || event.pointerType !== "touch" || !event.isPrimary) {
        return;
      }

      clearScheduledWork();
      setTransition("none");
      setIsAnimating(false);

      swipeStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastY: event.clientY,
        lastTimestamp: event.timeStamp,
        isVerticalGesture: false,
        hasTriggeredIntent: false,
      };

      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [clearScheduledWork, enabled],
  );

  const onPointerMove = React.useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      const swipeState = swipeStateRef.current;
      if (!enabled || !swipeState || swipeState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - swipeState.startX;
      const deltaY = event.clientY - swipeState.startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (!swipeState.isVerticalGesture) {
        if (absDeltaX < DRAG_START_DISTANCE && absDeltaY < DRAG_START_DISTANCE) {
          return;
        }

        if (absDeltaY <= absDeltaX * directionLockRatio) {
          resetGesture();
          return;
        }

        swipeState.isVerticalGesture = true;

        if (!swipeState.hasTriggeredIntent) {
          swipeState.hasTriggeredIntent = true;
          onSwipeIntent?.();
        }
      }

      const direction = getSwipeDirection(deltaY);
      const canNavigate = direction === "up" ? Boolean(onSwipeUp) : Boolean(onSwipeDown);

      event.preventDefault();
      swipeState.lastY = event.clientY;
      swipeState.lastTimestamp = event.timeStamp;
      setIsDragging(true);
      setOffsetY(applyDragResistance(deltaY, canNavigate));
    },
    [directionLockRatio, enabled, onSwipeDown, onSwipeIntent, onSwipeUp, resetGesture],
  );

  const finishGesture = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const swipeState = swipeStateRef.current;
      if (!enabled || !swipeState || swipeState.pointerId !== event.pointerId) {
        return;
      }

      const rawDeltaX = event.clientX - swipeState.startX;
      const rawDeltaY = event.clientY - swipeState.startY;
      const qualifiesAsVerticalGesture =
        Math.abs(rawDeltaY) >= DRAG_START_DISTANCE &&
        Math.abs(rawDeltaY) > Math.abs(rawDeltaX) * directionLockRatio;

      if (!swipeState.isVerticalGesture && qualifiesAsVerticalGesture) {
        swipeState.isVerticalGesture = true;
        if (!swipeState.hasTriggeredIntent) {
          swipeState.hasTriggeredIntent = true;
          onSwipeIntent?.();
        }
      }

      if (!swipeState.isVerticalGesture) {
        resetGesture();
        return;
      }

      if (typeof event.currentTarget.releasePointerCapture === "function") {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // Ignore release errors when the pointer is already gone.
        }
      }

      const elapsedMs = Math.max(event.timeStamp - swipeState.lastTimestamp, 1);
      const velocityY = (event.clientY - swipeState.lastY) / elapsedMs;
      const direction = getSwipeDirection(rawDeltaY);
      const canNavigate = direction === "up" ? Boolean(onSwipeUp) : Boolean(onSwipeDown);
      const dismissThreshold = getDismissThreshold(minSwipeDistance);

      resetGesture();

      const shouldNavigate =
        canNavigate &&
        (Math.abs(rawDeltaY) >= dismissThreshold ||
          (Math.abs(velocityY) >= FAST_SWIPE_VELOCITY &&
            Math.abs(rawDeltaY) >= DRAG_START_DISTANCE * 3));

      if (shouldNavigate) {
        commitSwipe(direction);
        return;
      }

      animateToRest();
    },
    [
      animateToRest,
      commitSwipe,
      directionLockRatio,
      enabled,
      minSwipeDistance,
      onSwipeDown,
      onSwipeIntent,
      onSwipeUp,
      resetGesture,
    ],
  );

  const onPointerUp = React.useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      finishGesture(event);
    },
    [finishGesture],
  );

  const onPointerCancel = React.useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      const swipeState = swipeStateRef.current;
      if (!swipeState || swipeState.pointerId !== event.pointerId) {
        return;
      }

      if (!swipeState.isVerticalGesture) {
        resetGesture();
        return;
      }

      resetGesture();
      animateToRest();
    },
    [animateToRest, resetGesture],
  );

  const dragProgress = Math.min(Math.abs(offsetY) / getViewportHeight(), 1);
  const scale = 1 - dragProgress * 0.04;

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    touchAction: enabled ? "pan-x pinch-zoom" : "auto",
    overlayStyle: enabled
      ? {
          backgroundColor: `rgba(0, 0, 0, ${0.8 - dragProgress * 0.24})`,
          transition: isDragging ? "none" : transition,
        }
      : {},
    mediaStyle: enabled
      ? {
          transform: `translate3d(0, ${offsetY}px, 0) scale(${scale})`,
          opacity: 1 - dragProgress * 0.14,
          transition: isDragging ? "none" : transition,
          willChange: isDragging || isAnimating ? "transform, opacity" : undefined,
        }
      : {},
    isDragging,
    isAnimating,
  };
}
