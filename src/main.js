import { createApp } from 'vue'
import App from './App.vue'
import '@css/index.scss'
import ElementPlus from 'element-plus';
import 'element-plus/lib/theme-chalk/index.css';

import common from '@js/common.js'
import router from "./router";
const Vue = createApp(App)

Vue.config.globalProperties.$global = common
Vue.use(router)
Vue.use(ElementPlus)
Vue.mount('#app')

export default Vue