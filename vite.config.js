import {
  defineConfig
} from 'vite'
import vue from '@vitejs/plugin-vue'
const {
  resolve
} = require('path')

function pathResolve(dir) {
  return resolve(__dirname, dir);
}
// https://vitejs.dev/config/
export default defineConfig({
  base:'./',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': pathResolve('src'),
      '@api': pathResolve('src/api'),
      '@js': pathResolve('src/assets/js'),
      '@css': pathResolve('src/assets/css'),
      '@images': pathResolve('src/assets/images'),
    },
  },
  server:{
    open:false,
    host:'localhost',
    port:8080,
    // 反向代理
    proxy: {
      '/baidu': {
        target: 'https://map.baidu.com/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/baidu/, ''),
        cookieDomainRewrite: {
          "*": "localhost",
        },
        cookiePathRewrite: {
          "*": "/",
        }
      }
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "src/assets/css/_lib-variable.scss";', // 添加scss全局变量
      },
    }
  },
  build:{
    outDir:'dist',
    assetsDir:'assets',
  }
})