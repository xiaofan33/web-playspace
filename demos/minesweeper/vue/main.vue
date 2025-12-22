<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { usePagehideCallback } from '~/shared/vue';
import { levels, lastGameStoreKey } from '../res/config.json';
import { formatNumber, isTouchDevice, playWinConfetti } from '../utils';
import { themeLoader } from '../theme';
import { useMinesweeperModel, useSettingOptions } from './use';
import Board from './board.vue';
import type { ModelProps } from '../model';

const model = useMinesweeperModel();
const { settings, update: updateSettings } = useSettingOptions();

const isPlaying = computed(() => model.stage.value === 'playing');
const timerSec = computed(() => Math.floor(model.timerMs.value / 1000));
const level = ref('easy');

watch(
  () => model.stage.value,
  value => {
    if (value === 'won') playWinConfetti();
  },
);

function newGame(props?: ModelProps) {
  model.init(props || settings.value);
  syncLevelDisplay();
}

function onChangeLevel() {
  const item = levels.find(l => l.key === level.value);
  if (!item) return;

  const props = { w: item.w, h: item.h, m: item.m };
  updateSettings(props);
  newGame(props);
}

function onClickWindmill() {
  const palette = themeLoader.getBgColorRandom(settings.value.palette);
  updateSettings({ palette });
}

function syncLevelDisplay() {
  const { w, h, m } = model.props.value;
  const item = levels.find(l => l.w === w && l.h === h && l.m === m);
  level.value = item?.key || 'custom';
}

/**
 * ----------------------------------------------------------------------------
 * save & load & share
 * ----------------------------------------------------------------------------
 */
const showReloadBtn = ref(false);
const isSharedGame = ref(false);
const sharedLink = ref('');

usePagehideCallback(() => {
  if (settings.value.autoSave && isPlaying.value && !isSharedGame.value) {
    const data = model.dump();
    localStorage.setItem(lastGameStoreKey, JSON.stringify(data));
  }
});

onMounted(() => {
  if (!tryResumeFromUrlHash()) {
    showReloadBtn.value = !!localStorage.getItem(lastGameStoreKey);
  }
});

function tryResumeFromUrlHash() {
  if (location.hash.length <= 1) {
    return false;
  }
  try {
    const hashStr = location.hash.slice(1);
    const data = JSON.parse(atob(hashStr));
    newGame(data);
    isSharedGame.value = true;
  } catch (e) {
    console.error(e);
    newGame();
  }
  return true;
}

function onClickReloadBtn() {
  try {
    const storage = localStorage.getItem(lastGameStoreKey);
    if (!storage) return;
    newGame(JSON.parse(storage));
  } catch (e) {
    console.error(e);
  } finally {
    localStorage.removeItem(lastGameStoreKey);
    showReloadBtn.value = false;
  }
}

function onClickSharedBtn() {
  const data = model.dump();
  const url = new URL(location.href);
  url.hash = btoa(JSON.stringify(data));
  sharedLink.value = url.toString();
}
</script>

<template>
  <div
    class="min-h-dvh p-5 select-none"
    :style="{ background: `var(--color-${settings.palette}-50)` }"
  >
    <div class="mx-auto mt-16 max-w-96 space-y-2 px-4">
      <div class="relative flex h-9 items-center justify-between">
        <select
          id="level-select"
          v-model="level"
          class="h-full w-24 rounded-md pl-3 text-sm transition outline-none hover:shadow-sm"
          @change="onChangeLevel"
        >
          <option
            v-for="item in levels"
            :value="item.key"
            :disabled="item.key === 'custom'"
          >
            {{ item.txt }}
          </option>
        </select>
        <button
          v-if="model.stage.value === 'won' || model.stage.value === 'lost'"
          class="absolute left-1/2 flex h-full w-20 -translate-x-1/2 items-center justify-center rounded-md text-sm transition hover:shadow-sm"
          @click="model.restart"
        >
          <i class="i-tabler-repeat-once text-base" />
          <span class="ml-1 opacity-80">重玩</span>
        </button>
        <button
          class="flex size-9 items-center justify-center rounded-md transition hover:shadow-sm"
          :style="{ color: `var(--color-${settings.palette}-400)` }"
          @click="onClickWindmill"
        >
          <i
            class="i-tabler-windmill animate-spin text-xl"
            :style="{
              animationFillMode: 'forwards',
              animationDuration: isPlaying ? '3s' : '12s',
            }"
          />
        </button>
      </div>

      <div class="flex items-center justify-between text-lg">
        <div class="flex w-28 items-center justify-center">
          {{ themeLoader.getEmoji('mine') }}
          <span class="ml-2 font-mono font-bold text-red-600">{{
            formatNumber(model.remainMinesCount.value)
          }}</span>
        </div>
        <button
          class="flex items-center justify-center rounded-full p-2 text-xl transition hover:shadow-sm"
          @click="newGame()"
        >
          {{ themeLoader.getEmoji(model.stage.value) }}
        </button>
        <div class="flex w-28 items-center justify-center">
          {{ themeLoader.getEmoji('timer') }}
          <span class="ml-2 font-mono font-bold text-red-600">{{
            formatNumber(timerSec)
          }}</span>
        </div>
      </div>
    </div>

    <div class="mx-auto mt-4 flex w-fit max-w-full flex-col items-center">
      <Board
        :settings="settings"
        :cellGrid="model.getCellGrid()"
        :getAroundCells="model.getAroundCells"
        :operate="model.operate"
      ></Board>
      <div class="relative mt-3 mb-8 flex w-full items-center justify-end">
        <label
          v-if="isTouchDevice()"
          class="mr-auto flex h-10 w-16 items-center justify-center"
        >
          <input
            type="checkbox"
            :checked="settings.flagMode"
            @change="
              updateSettings({
                flagMode: ($event.target as HTMLInputElement).checked,
              })
            "
          />
          <span class="ml-2">{{ themeLoader.getEmoji('flag') }}</span>
        </label>
        <button
          :disabled="isPlaying || !showReloadBtn"
          title="加载上次未完成的对局"
          class="flex size-9 items-center justify-center rounded-md transition hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none"
          @click="onClickReloadBtn"
        >
          <i class="i-tabler-history text-base" />
        </button>
        <button
          :disabled="!isPlaying"
          title="复制当前的对局"
          class="ml-3 flex size-9 items-center justify-center rounded-md transition hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none"
          @click="onClickSharedBtn"
        >
          <i class="i-tabler-copy text-base" />
        </button>
        <div v-if="sharedLink" class="absolute top-12 right-2 text-xs">
          已复制当前对局，<a
            :href="sharedLink"
            target="_blank"
            class="text-sm text-blue-600"
            @click="sharedLink = ''"
            >点击前往</a
          >
        </div>
      </div>
    </div>
  </div>
</template>
