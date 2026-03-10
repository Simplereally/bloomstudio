"use client";

import * as React from "react";

interface UseVerticalSwipeNavigationOptions {
  enabled: boolean;
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
}

const DEFAULT_MIN_SWIPE_DISTANCE = 72;
const DEFAULT_DIRECTION_LOCK_RATIO = 1.2;

type SwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
};

export function useVerticalSwipeNavigation({
  enabled,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = DEFAULT_MIN_SWIPE_DISTANCE,
  directionLockRatio = DEFAULT_DIRECTION_LOCK_RATIO,
}: UseVerticalSwipeNavigationOptions): UseVerticalSwipeNavigationResult {
  const swipeStateRef = React.useRef<SwipeState | null>(null);

  const resetSwipeState = React.useCallback(() => {
    swipeStateRef.current = null;
  }, []);

  React.useEffect(() => resetSwipeState, [resetSwipeState]);

  const onPointerDown = React.useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      if (!enabled || event.pointerType !== "touch" || !event.isPrimary) {
        return;
      }

      swipeStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
    },
    [enabled],
  );

  const onPointerMove = React.useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      const swipeState = swipeStateRef.current;
      if (!enabled || !swipeState || swipeState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = Math.abs(event.clientX - swipeState.startX);
      const deltaY = Math.abs(event.clientY - swipeState.startY);

      if (deltaY > 8 && deltaY > deltaX * directionLockRatio) {
        event.preventDefault();
      }
    },
    [directionLockRatio, enabled],
  );

  const onPointerUp = React.useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      const swipeState = swipeStateRef.current;
      if (!enabled || !swipeState || swipeState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - swipeState.startX;
      const deltaY = event.clientY - swipeState.startY;
      resetSwipeState();

      if (
        Math.abs(deltaY) < minSwipeDistance ||
        Math.abs(deltaY) <= Math.abs(deltaX) * directionLockRatio
      ) {
        return;
      }

      if (deltaY < 0) {
        onSwipeUp?.();
        return;
      }

      onSwipeDown?.();
    },
    [directionLockRatio, enabled, minSwipeDistance, onSwipeDown, onSwipeUp, resetSwipeState],
  );

  const onPointerCancel = React.useCallback<React.PointerEventHandler<HTMLElement>>(
    () => {
      resetSwipeState();
    },
    [resetSwipeState],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    touchAction: enabled ? "pan-x pinch-zoom" : "auto",
  };
}
