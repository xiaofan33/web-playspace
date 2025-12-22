<script setup lang="ts">
import { ref, watch } from "vue";

const { score, popupAnimate = "animate-tile-popup" } = defineProps<{
  score: number;
  popupAnimate?: string;
}>();

const animateCls = ref(popupAnimate);
watch(
  () => score,
  () => (animateCls.value = "animate-tile-merge"),
);
</script>

<template>
  <div
    :class="[
      `tile-fallback flex size-full items-center justify-center font-bold`,
      `tile-${score}`,
      animateCls,
    ]"
    @animationend="animateCls = ''"
  >
    {{ score }}
  </div>
</template>
