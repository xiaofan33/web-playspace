import { computed, reactive, watchEffect, type MaybeRefOrGetter } from "vue";
import { useLocalStorage, useThrottleFn } from "@vueuse/core";
import { useMoveCommand, usePagehideCallback } from "~/shared/vue";
import { createModel } from "../model";
import type { Direction } from "~/shared";

export interface UseG2048Options {
  autoSaveWhenExit?: boolean;
  lastStateKey?: string;
  bestScoreKey?: string;
  moveThrottle?: number;
  onMoveEffect?: (cmd: Direction) => void;
}

export function useG2048(
  element: MaybeRefOrGetter<HTMLElement | undefined | null>,
  options: UseG2048Options = {},
) {
  const {
    autoSaveWhenExit = true,
    lastStateKey = "2048-last-state",
    bestScoreKey = "2048-best-score",
    moveThrottle = 50,
    onMoveEffect,
  } = options;

  const model = reactive(createModel());

  const bestScore = useLocalStorage(bestScoreKey, 0);
  watchEffect(() => {
    bestScore.value = Math.max(bestScore.value, model.state.score);
  });

  const onMoved = (cmd: Direction) => {
    model.move(cmd);
    onMoveEffect?.(cmd);
  };
  useMoveCommand({ element, callback: useThrottleFn(onMoved, moveThrottle) });

  usePagehideCallback(() => {
    if (autoSaveWhenExit && model.canMove()) {
      const state = model.dump();
      localStorage.setItem(lastStateKey, JSON.stringify(state));
    }
  });

  function tryReloadState() {
    try {
      const data = localStorage.getItem(lastStateKey);
      if (!data) return;
      model.init(JSON.parse(data));
      return true;
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem(lastStateKey);
    }
  }

  return {
    state: computed(() => model.state),
    bestScore: computed(() => bestScore.value),
    init: model.init.bind(model),
    move: model.move.bind(model),
    back: model.back.bind(model),
    dump: model.dump.bind(model),
    canMove: model.canMove.bind(model),
    canBack: model.canBack.bind(model),
    tryReloadState,
  };
}
