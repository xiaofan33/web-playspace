export const demoRoutes = [
  {
    path: "/2048",
    name: "2048",
    description: "经典的 2048 数字合成游戏",
    component: () => import("@/2048/vue/main.vue"),
  },
];
