<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useSolutions } from './use';
import ChessBoard from './chess-board.vue';

const [MIN_N, MAX_N] = [3, 15];
const inputN = ref(8);
const boardN = ref(inputN.value);

watch(inputN, n => {
  if (n !== boardN.value) {
    recalculate(n);
  }
});

onMounted(() => {
  recalculate(inputN.value);
});

const { isCalculating, enableCarousel, timerMs, ...model } = useSolutions();

const LOADING_THRESHOLD = 150;
const MIN_DISPLAY_TIMER = 10;
const nf2 = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const showLoading = computed(
  () => isCalculating.value && timerMs.value > LOADING_THRESHOLD,
);
const timerLabel = computed(() =>
  nf2.format(Math.max(timerMs.value, MIN_DISPLAY_TIMER) / 1e3),
);

async function recalculate(n: number) {
  if (await model.tryCalculate(n)) {
    boardN.value = n;
  }
}
</script>

<template>
  <div class="min-h-dvh space-y-4 p-5">
    <div class="flex items-center gap-3">
      <div class="text-3xl font-bold">N</div>
      <div class="text-2xl">=</div>
      <select
        v-model="inputN"
        class="w-24 appearance-none border-b border-gray-400 text-center"
      >
        <option v-for="(_, i) in MAX_N - MIN_N + 1" :value="i + MIN_N">
          {{ i + MIN_N }}
        </option>
      </select>
      <button
        :disabled="inputN <= MIN_N"
        class="ml-3 flex size-9 items-center justify-center"
        @click="inputN--"
      >
        <i class="i-lucide-minus" />
      </button>
      <button
        :disabled="inputN >= MAX_N"
        class="flex size-9 items-center justify-center"
        @click="inputN++"
      >
        <i class="i-lucide-plus" />
      </button>
    </div>

    <div class="flex items-center gap-2 text-sm">
      找到
      <div class="min-w-16 border-b border-gray-400 text-center font-mono">
        {{ showLoading ? '?' : model.solutionCount.value }}
      </div>
      种摆法，用时
      <div class="min-w-16 border-b border-gray-400 text-center font-mono">
        {{ timerLabel }}
      </div>
      秒
    </div>

    <div class="relative inline-flex max-w-full overflow-auto select-none">
      <ChessBoard :n="boardN" @tap="">
        <template #board-layer="{ x, y }"></template>
        <template #chess-layer>
          <div
            v-for="(x, y) in model.activeSolution.value"
            :key="y"
            :style="{
              '--x': `${x * 100}%`,
              '--y': `${y * 100}%`,
            }"
            class="absolute flex size-(--len) translate-x-(--x) translate-y-(--y) items-center justify-center transition-transform duration-300"
          >
            <img
              src="../res/q.webp"
              alt="chess-queen"
              class="size-[90%] object-contain"
            />
          </div>
        </template>
      </ChessBoard>
      <Transition name="fade" mode="out-in">
        <div
          v-if="showLoading"
          class="absolute inset-0 flex items-center justify-center bg-white/60"
        >
          <i class="i-lucide-loader-circle animate-spin text-3xl" />
        </div>
      </Transition>
    </div>

    <div
      v-show="model.solutionCount.value > 0 && !isCalculating"
      class="flex items-center"
    >
      <button
        class="flex size-9 items-center justify-center"
        @click="model.activeIndex.value--"
      >
        <i class="i-lucide-skip-back" />
      </button>
      <button
        class="mx-1 flex size-10 items-center justify-center text-xl"
        @click="enableCarousel = !enableCarousel"
      >
        <i :class="enableCarousel ? 'i-lucide-pause' : 'i-lucide-play'" />
      </button>
      <button
        class="flex size-9 items-center justify-center"
        @click="model.activeIndex.value++"
      >
        <i class="i-lucide-skip-forward" />
      </button>

      <div class="ml-7 flex items-center">
        <input
          v-model.lazy="model.activeIndex.value"
          class="w-20 border-b border-gray-400 text-center font-mono text-sm"
          @change="model.activeIndex.value = model.activeIndex.value"
        />
        <div class="mx-1 text-xs">/</div>
        <div class="font-mono text-xs">{{ model.solutionCount.value }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
