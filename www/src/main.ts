import { createApp } from 'vue';
import { RouterView, createWebHistory, createRouter } from 'vue-router';
import { demoRoutes } from './routes';
import '~/tailwind.css';

const router = createRouter({
  routes: [...demoRoutes],
  history: createWebHistory(),
});

createApp(RouterView).use(router).mount('#app');
