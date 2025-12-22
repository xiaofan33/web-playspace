import {
  useEventListener,
  tryOnUnmounted,
  usePointerSwipe,
} from "@vueuse/core";
import type { MaybeRefOrGetter } from "vue";
import type { Direction } from "../types";

const moveCommandMap: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowLeft: "left",
  ArrowDown: "down",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
} as const;

export function useMoveCommand(
  options: {
    enableKeyboardInput?: boolean;
    enablePointerSwipe?: boolean;
    swipeThreshold?: number;
    commandMap?: Record<string, Direction>;
    element?: MaybeRefOrGetter<HTMLElement | null | undefined>;
    callback?: (cmd: Direction) => void;
  } = {},
) {
  const {
    enableKeyboardInput = true,
    enablePointerSwipe = true,
    swipeThreshold = 30,
    commandMap = moveCommandMap,
    element,
    callback,
  } = options;

  if (enableKeyboardInput) {
    useEventListener("keydown", (event) => {
      const cmd = commandMap[event.key];
      if (cmd) {
        event.preventDefault();
        callback?.(cmd);
      }
    });
  }
  if (enablePointerSwipe) {
    usePointerSwipe(element, {
      threshold: swipeThreshold,
      onSwipeEnd(_, cmd) {
        if (cmd !== "none") {
          callback?.(cmd);
        }
      },
    });
  }
}

export function usePagehideCallback(cb: () => void) {
  let hasCalled = false;
  const handler = () => {
    if (!hasCalled) {
      hasCalled = true;
      cb();
    }
  };
  useEventListener("pagehide", handler);
  tryOnUnmounted(handler);
}
