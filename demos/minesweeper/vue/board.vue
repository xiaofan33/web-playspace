<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { useBoardEvent } from './use';
import Cell from './cell.vue';
import type { CellAction, CellState } from '../model';
import type { SettingOptions } from '../theme';

const props = defineProps<{
  settings: SettingOptions;
  cellGrid: CellState[][];
  getAroundCells: (cell: CellState) => CellState[];
  operate: (cell: CellState, action: CellAction, openAround?: boolean) => void;
}>();

const boardRef = useTemplateRef('board');
const { enableHighlight, pointerPosition } = useBoardEvent(boardRef, action => {
  if (!hoverCell.value) return;

  // patch
  let openAround = props.settings.fastMode;
  if (action === 'flag' && hoverCell.value.open) openAround = false;
  if (action === 'open' && props.settings.flagMode) action = 'flag';

  props.operate(hoverCell.value, action, openAround);
});

const hoverCell = computed(() => {
  const { x, y } = pointerPosition.value;
  const { len, gap } = props.settings;
  const stride = len + gap;
  const row = Math.floor(y / stride);
  const col = Math.floor(x / stride);
  if (gap === 0 || (x - col * stride <= len && y - row * stride <= len)) {
    return props.cellGrid[row]?.[col];
  }
});

const highlightCells = computed(() => {
  const item = hoverCell.value;
  if (!item || item.flag || !enableHighlight.value) return;

  if (!item.open) return [item];

  return props.getAroundCells(item).filter(c => !c.open && !c.flag);
});
</script>

<template>
  <div
    ref="board"
    class="w-fit max-w-full space-y-(--gap) overflow-auto text-(length:--len)"
    :style="{
      '--gap': `${props.settings.gap}px`,
      '--len': `${props.settings.len}px`,
      '--rounded': `${props.settings.rounded}px`,
    }"
  >
    <div v-for="(row, y) in cellGrid" :key="y" class="flex gap-x-(--gap)">
      <div v-for="(cell, x) in row" :key="x" class="size-(--len) shrink-0">
        <Cell
          :cell="cell"
          :palette="settings.palette"
          :highlight="highlightCells?.includes(cell)"
        ></Cell>
      </div>
    </div>
  </div>
</template>
