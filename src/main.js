import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { I18nPlugin } from './i18n/index.js'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './styles/global.css'

const app = createApp(App)
app.use(router)
app.use(I18nPlugin)
app.use(Antd)
app.mount('#app')
