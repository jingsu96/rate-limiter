import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    extensions: ['.js'],
  },
});
