<script setup lang="ts">
import { computed, onMounted, ref, toValue, useTemplateRef, watch } from "vue";
import { modeList } from "../res/config.json";
import { useG2048 } from "./use";
import Tile from "./tile.vue";
import Info from "./info.vue";

const scoreToastRef = useTemplateRef("scoreToast");
const scoreToastParent = computed(() => toValue(scoreToastRef)?.parentElement);
const tileContainerRef = useTemplateRef("tileContainer");

const modeIndex = ref(0);
const modeProps = computed(() => modeList[modeIndex.value]);
const popupAnimate = ref("");
const score = ref(0);

const { state, ...model } = useG2048(tileContainerRef, {
  ...modeProps.value,
  onMoveEffect() {
    popupAnimate.value = "animate-tile-popup";
  },
});

watch(
  () => state.value.score,
  (value, oldValue) => {
    if (oldValue === undefined || oldValue >= value) {
      score.value = value;
      return;
    }

    const increment = value - oldValue;
    let startAt = 0;
    const loopFn = (t: number) => {
      startAt = startAt || t;
      const percent = Math.min((t - startAt) / 200, 1);
      score.value = Math.floor(increment * percent) + oldValue;
      if (percent < 1) {
        requestAnimationFrame(loopFn);
      }
    };
    requestAnimationFrame(loopFn);

    if (scoreToastRef.value) {
      const toast = scoreToastRef.value.cloneNode(true) as HTMLElement;
      toast.textContent = `+${increment}`;
      toast.classList.replace("hidden", "animate-score-sliding");
      toast.addEventListener("animationend", () => toast.remove(), {
        once: true,
      });
      scoreToastParent.value?.appendChild(toast);
    }
  },
);

onMounted(() => {
  if (model.tryReloadState()) {
    score.value = state.value.score;
    syncModeIndex();
  } else {
    newGame();
  }
});

function newGame() {
  model.init(modeProps.value);
  popupAnimate.value = "animate-tile-popup-start";
}

function syncModeIndex() {
  const { boardWidth } = model.dump();
  if (boardWidth !== modeProps.value.boardWidth) {
    const index = modeList.findIndex((item) => item.boardWidth === boardWidth);
    if (index !== -1) {
      modeIndex.value = index;
    }
  }
}
</script>

<template>
  <div
    class="g-2048 min-h-dvh bg-(--background) text-center text-(--text-color)"
    :style="{ '--n': modeProps.boardWidth }"
  >
    <div class="mt-20 inline-flex flex-col gap-3 p-5">
      <div class="flex items-stretch gap-2">
        <div class="tile-2048 flex w-32 items-center justify-center rounded-md">
          <div class="text-3xl font-bold">2048</div>
        </div>
        <div class="ml-auto w-24 rounded-md bg-(--label-bg) p-1 text-white">
          <div class="text-sm opacity-90">最佳</div>
          <div class="text-xl font-bold">{{ model.bestScore }}</div>
        </div>
        <div class="relative w-24 rounded-md bg-(--label-bg) p-1 text-white">
          <div class="text-sm opacity-90">得分</div>
          <div class="text-xl font-bold">{{ score }}</div>
          <div
            ref="scoreToast"
            class="absolute right-1 bottom-0 hidden text-lg font-bold"
          ></div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-sm underline underline-offset-4">
          移动方块🎯组合出&nbsp;2048
        </div>
        <button
          class="flex h-10 w-24 items-center justify-center rounded-md bg-(--button-bg) text-lg text-white outline-none"
          @click="newGame"
        >
          新游戏
        </button>
      </div>

      <div
        ref="tileContainer"
        class="relative rounded-md bg-(--tile-container-bg) p-(--gap) select-none"
        @touchmove.prevent
      >
        <div class="grid grid-cols-[repeat(var(--n),1fr)] gap-(--gap)">
          <div
            v-for="_ in modeProps.boardWidth ** 2"
            :key="_"
            class="size-(--len) rounded-md bg-(--tile-0-bg)"
          ></div>
        </div>
        <div class="absolute inset-(--gap) text-(length:--len)">
          <div
            v-for="{ id, value, x, y } in state.tiles"
            :key="id"
            :style="{
              '--x': `calc(var(--len) * ${x} + var(--gap) * ${x})`,
              '--y': `calc(var(--len) * ${y} + var(--gap) * ${y})`,
            }"
            class="absolute size-(--len) translate-x-(--x) translate-y-(--y) overflow-hidden rounded-sm transition-transform"
          >
            <Tile :score="value" :popup-animate="popupAnimate" />
          </div>
        </div>
        <Transition name="gg">
          <div
            v-if="!model.canMove()"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/60"
          >
            <div class="mb-6 text-5xl font-bold">Game Over</div>
            <button
              class="flex h-10 w-24 items-center justify-center rounded-md bg-(--button-bg) text-lg text-white outline-none"
              @click="newGame"
            >
              再来
            </button>
          </div>
        </Transition>
      </div>

      <div class="grid grid-cols-3 items-stretch">
        <select
          v-model="modeIndex"
          id="model-select"
          class="flex h-full w-24 items-center rounded-md px-4 py-2 text-sm outline-none hover:shadow-sm"
          @change="newGame"
        >
          <option v-for="({ label }, index) in modeList" :value="index">
            {{ label }}
          </option>
        </select>
        <button
          title="撤销上次移动"
          :disabled="!model.canBack()"
          class="mx-auto flex h-full min-h-9 w-20 items-center justify-center rounded-md transition hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none"
          @click="model.back"
        >
          <i class="i-lucide-undo text-base" />
        </button>
        <div class="flex h-full items-center justify-end font-mono text-sm">
          moves: {{ state.steps }}
        </div>
      </div>

      <Info class="border-t border-dotted text-left" />
    </div>
  </div>
</template>

<style src="../res/main.css"></style>
