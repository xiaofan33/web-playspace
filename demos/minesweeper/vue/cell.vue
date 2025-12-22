<script setup lang="ts">
import { computed } from "vue";
import { themeLoader, type ColorKey } from "../theme";
import type { CellState } from "../model";

const { cell, palette, highlight } = defineProps<{
  cell: CellState;
  palette: ColorKey;
  highlight?: boolean;
}>();

const state = computed(() => {
  if (!cell.open) {
    return {
      txt: cell.flag ? themeLoader.getEmoji("flag") : "",
      cls: themeLoader.getBgColor(palette, highlight),
    };
  }
  if (cell.boom) {
    return {
      txt: themeLoader.getEmoji("boom"),
      cls: "border-transparent bg-red-600",
    };
  }
  if (cell.flag) {
    return {
      txt: themeLoader.getEmoji("flag"),
      cls: cell.mine
        ? themeLoader.getBgColor(palette)
        : "border-transparent bg-red-300",
    };
  }
  if (cell.mine) {
    return {
      txt: themeLoader.getEmoji("mine"),
      cls: themeLoader.getBgColor(palette, true),
    };
  }
  return {
    txt: cell.aroundMineCount ?? "",
    cls: themeLoader.getBgColor(palette, true),
    styles: { color: themeLoader.getFgColor(cell.aroundMineCount ?? 0) },
  };
});
</script>

<template>
  <div
    :class="[
      'flex size-full items-center justify-center rounded-(--rounded) border bg-linear-to-br text-[50%] font-bold transition-[background-color]',
      state.cls,
    ]"
    :style="state.styles"
  >
    {{ state.txt }}
  </div>
</template>
