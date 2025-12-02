import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { I18nPlugin } from './i18n/index.js'
import './styles/globals.css'

const app = createApp(App)
app.use(router)
app.use(I18nPlugin)
app.mount('#app')
