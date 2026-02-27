import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'
import {createSvgIconsPlugin} from 'vite-plugin-svg-icons'
import {fileURLToPath, URL} from 'node:url'
import Components from 'unplugin-vue-components/vite'
import {PrimeVueResolver} from '@primevue/auto-import-resolver'
import svgLoader from 'vite-svg-loader'
import legacy from '@vitejs/plugin-legacy'
import eslint from 'vite-plugin-eslint'
import tailwindcss from '@tailwindcss/vite'
import type {ConfigEnv, UserConfig} from 'vite'
// https://vitejs.dev/config/
export default defineConfig(({command, mode}: ConfigEnv): UserConfig => {
  const isDev = command === 'serve'
  const isBuild = command === 'build'
  const isPreview = mode === 'preview'
  const timestamp = new Date().getTime()
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const isDevelopment = mode === 'development'

  return {
    base: '/',
    server: {
      port: 8081,
      cors: true,
      proxy: {
        // API proxy configuration (if needed)
        // '/api': {
        //   target: 'http://your-api-server',
        //   changeOrigin: true,
        // },
      },
      watch: {
        interval: 1000,
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.git/**', '**/*.md'],
      },
      hmr: {
        overlay: true,
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      vue({
        script: {
          defineModel: true,
          propsDestructure: true,
        },
      }),
      svgLoader(),
      vueJsx(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/svg')],
        symbolId: 'icon-[dir]-[name]',
        inject: 'body-first',
        customDomId: '__svg__icons__dom__',
      }),
      Components({
        resolvers: [PrimeVueResolver()],
      }),
      eslint({
        failOnWarning: false,
        failOnError: false,
      }),
      tailwindcss(),
      legacy(),
    ],
    build: {
      target: 'es2015',
      outDir: 'main',
      minify: isDev ? undefined : 'terser',
      terserOptions: {
        compress: {
          //生产环境时移除console.log()
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!isDev && id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString()
            }
          },
          chunkFileNames: ({name}) => {
            if (name === 'vendor') {
              return `assets/js/[name]-[hash].js`
            } else {
              return `assets/js/[name]-[hash]-v-${timestamp}.js`
            }
          },
          entryFileNames: ({name}) => {
            if (name === 'vendor') {
              return `assets/js/[name]-[hash].js`
            } else {
              return `assets/js/[name]-[hash]-${timestamp}.js`
            }
          },
          assetFileNames: `assets/[ext]/[name]-[hash].[ext]`, // 资源文件添加时间戳
        },
      },
    },
    css: {
      devSourcemap: false,
    },
    optimizeDeps: {
      include: ['vue', 'pinia', 'axios', 'vue-router', '@vueuse/core', 'primevue', 'lodash'],
      force: true,
    },
  }
})
