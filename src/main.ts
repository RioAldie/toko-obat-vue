import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './assets/index.css'
import App from './App.vue'
import router from './router'
import { queryClient } from './lib/queries'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')
