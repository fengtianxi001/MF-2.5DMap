import { createApp } from 'vue'
import arco from '@arco-design/web-vue'
import App from './App.vue'
import '@arco-design/web-vue/dist/arco.css'

const bootstrap = () => {
  const app = createApp(App)
  app.use(arco)
  app.mount('#app')
}
bootstrap()
