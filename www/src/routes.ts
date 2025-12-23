export const demoRoutes = [
  {
    path: '/2048',
    name: '2048',
    description: '经典的 2048 数字合成游戏',
    component: () => import('@/2048/vue/main.vue'),
  },
  {
    path: '/minesweeper',
    name: 'minesweeper',
    description: 'Emoji 风格的网页端扫雷小游戏',
    component: () => import('@/minesweeper/vue/main.vue'),
  },
  {
    path: '/n-queens',
    name: 'n-queens',
    description: '八皇后问题的可行摆法展示',
    component: () => import('@/n-queens/vue/main.vue'),
  },
];
