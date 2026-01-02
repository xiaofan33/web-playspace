<script setup lang="ts">
import { modeList } from '../res/config.json';
</script>

<template>
  <details>
    <summary class="flex justify-end p-4">
      <i class="i-lucide-info text-base"></i>
    </summary>
    <div class="rounded-md border border-gray-300 bg-white p-5">
      <div class="mb-4 font-bold">模式说明</div>
      <table class="mb-6 w-full text-center text-sm">
        <thead>
          <tr class="border-b">
            <th class="p-2 align-middle">模式</th>
            <th class="p-2 align-middle">初始方块数</th>
            <th class="p-2 align-middle">移动后新增</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in modeList" class="border-b">
            <td class="p-2 align-middle">{{ item.label }}</td>
            <td class="p-2 align-middle">{{ item.popupStart }}</td>
            <td class="p-2 align-middle">{{ item.popupMoved }}</td>
          </tr>
        </tbody>
      </table>
      <div class="mb-4 font-bold">结束判断</div>
      <div class="mb-3 text-sm">触发以下任一条件时，游戏结束：</div>
      <ul class="space-y-2 pl-4 text-sm">
        <li class="list-disc">每次移动后，棋盘剩余空位数不够弹出新方块</li>
        <li class="list-disc">弹出方块后，棋盘已满且无法再进行移动合并</li>
      </ul>
    </div>
  </details>
</template>
