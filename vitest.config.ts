import { defineConfig } from 'vitest/config';
import { viteAlias } from './alias';

export default defineConfig({
  resolve: {
    alias: viteAlias,
  },
});
