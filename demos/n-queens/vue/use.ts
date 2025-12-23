import { computed, readonly, ref, watchEffect, type MaybeRef } from 'vue';
import { useIntervalFn, useTimestamp, useWebWorkerFn } from '@vueuse/core';
import { nQueens$4 } from '../solutions';

export function useSolutions(interval: MaybeRef<number> = 3000) {
  const { workerFn } = useWebWorkerFn(n => JSON.stringify(nQueens$4(n)), {
    localDependencies: [nQueens$4],
  });

  const solutions = ref<number[][]>([]);
  const solutionIndex = ref(0);
  const solutionCount = computed(() => solutions.value.length);
  const activeSolution = computed(() => solutions.value[solutionIndex.value]);
  const activeIndex = computed({
    get() {
      return solutionIndex.value + 1;
    },
    set(value) {
      const current = solutionIndex.value + 1;
      const maximin = solutionCount.value;
      if (value === maximin + 1 && current === maximin) {
        solutionIndex.value = 0;
      } else if (value === 0 && current === 1) {
        solutionIndex.value = maximin - 1;
      } else {
        solutionIndex.value = Math.max(0, Math.min(maximin, value) - 1);
      }
    },
  });

  const isCalculating = ref(false);
  const timerMs = ref(0);
  const timestamp = useTimestamp();
  let startAt = 0;
  watchEffect(() => {
    if (isCalculating.value) {
      timerMs.value = timestamp.value - startAt;
    }
  });

  const enableCarousel = ref(false);
  const { pause, resume } = useIntervalFn(() => activeIndex.value++, interval, {
    immediate: false,
  });
  watchEffect(() => {
    if (enableCarousel.value && !isCalculating.value) {
      resume();
    } else {
      pause();
    }
  });

  async function tryCalculate(n: number) {
    if (isCalculating.value) return;

    isCalculating.value = true;
    startAt = timestamp.value;
    const prevTimer = timerMs.value;

    try {
      solutions.value = JSON.parse(await workerFn(n));
      activeIndex.value = activeIndex.value;
      return true;
    } catch (e) {
      console.error(e);
      timerMs.value = prevTimer;
    } finally {
      isCalculating.value = false;
    }
  }

  return {
    isCalculating: readonly(isCalculating),
    timerMs: readonly(timerMs),
    solutionCount,
    activeSolution,
    activeIndex,
    enableCarousel,
    tryCalculate,
  };
}
