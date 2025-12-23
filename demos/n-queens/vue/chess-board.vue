<script setup lang="ts">
const {
  n = 8,
  len = 36,
  gap = 20,
  colors = ['#f0d9b5', '#b58863'],
} = defineProps<{
  n?: number;
  len?: number;
  gap?: number;
  colors?: [string, string];
}>();

const emit = defineEmits<{
  (e: 'tap', x: number, y: number): void;
}>();

const coords = [
  {
    key: 'left',
    outerCls: 'left-0 top-(--gap) flex-col',
    innerCls: 'h-(--len) w-(--gap)',
    getLabel: (i: number) => n - i,
  },
  {
    key: 'right',
    outerCls: 'right-0 top-(--gap) flex-col',
    innerCls: 'h-(--len) w-(--gap)',
    getLabel: (i: number) => n - i,
  },
  {
    key: 'top',
    outerCls: 'top-0 left-(--gap) flex-row',
    innerCls: 'w-(--len) h-(--gap)',
    getLabel: (i: number) => String.fromCodePoint(i + 65 /** 'A' */),
  },
  {
    key: 'bottom',
    outerCls: 'bottom-0 left-(--gap) flex-row',
    innerCls: 'w-(--len) h-(--gap)',
    getLabel: (i: number) => String.fromCodePoint(i + 65 /** 'A' */),
  },
];
</script>

<template>
  <div
    :style="{
      '--len': `${len}px`,
      '--gap': `${gap}px`,
      '--bg-light': colors[0],
      '--bg-dark': colors[1],
    }"
  >
    <div class="relative w-fit p-(--gap)">
      <div v-for="coord in coords" :class="['absolute flex', coord.outerCls]">
        <div
          v-for="(_, i) in n"
          :class="[
            'flex items-center justify-center font-mono text-sm opacity-80',
            coord.innerCls,
          ]"
        >
          {{ coord.getLabel(i) }}
        </div>
      </div>

      <div class="relative overflow-hidden rounded-md">
        <div v-for="(_, y) in n" class="flex">
          <div
            v-for="(_, x) in n"
            :class="[
              'size-(--len) shrink-0',
              (x + y) % 2 === 0 ? 'bg-(--bg-light)' : 'bg-(--bg-dark)',
            ]"
            @click="emit('tap', x, y)"
          >
            <slot name="board-layer" :x="x" :y="y"></slot>
          </div>
        </div>
      </div>

      <div class="absolute top-(--gap) left-(--gap)">
        <slot name="chess-layer"></slot>
      </div>
    </div>
  </div>
</template>
