import {createApp} from 'vue'
import './style.css'
import './style/tailwind.css'
import App from './App.vue'
import router from './router'
import {createPinia} from 'pinia'
import 'virtual:svg-icons-register'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import {definePreset} from '@primevue/themes'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
// 移除用户认证相关导入

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: 'rgba(147, 51, 234, 0.1)',
      100: 'rgba(147, 51, 234, 0.2)',
      200: 'rgba(147, 51, 234, 0.4)',
      300: 'rgba(147, 51, 234, 0.6)',
      400: 'rgba(147, 51, 234, 0.8)',
      500: 'rgba(147, 51, 234, 1)',
      600: 'rgba(130, 45, 207, 1)',
      700: 'rgba(113, 39, 180, 1)',
      800: 'rgba(96, 33, 153, 1)',
      900: 'rgba(79, 27, 126, 1)',
      950: 'rgba(62, 21, 99, 1)',
    },
  },
})

const app = createApp(App)
const pinia = createPinia()

app
  .use(pinia)
  .use(PrimeVue, {
    theme: {
      preset: MyPreset,
      options: {
        darkModeSelector: 'none',
        // cssLayer: {
        //   name: 'primevue',
        //   order: 'primevue, tailwind-base, tailwind-utilities',
        // },
      },
    },
  })
  .use(ToastService)
  .use(router)
  .use(ConfirmationService)
  .directive('tooltip', Tooltip)

app.mount('#app')
