import { createApp } from 'vue'
import Tres from '@tresjs/core'

import App from './App.vue'
import './assets/css/main.css'

import {
  vLog,
  vLightHelper,
  vAlwaysLookAt,
  vDistanceTo,
  vRotate
} from '@tresjs/core'
const app = createApp(App)
import router from './router'

app.use(router)

// Danh sách các component TresJS cốt lõi bạn đang dùng (dựa trên log lỗi)
const CORE_TRES_COMPONENTS = [
  'TresCanvas',
  'TresPerspectiveCamera',
  'TresAmbientLight',
  'TresDirectionalLight',
  'TresPointLight',
  'TresGroup',
  'TresMesh',
  'TresMeshStandardMaterial',
  'TresMeshBasicMaterial',
  'TresMeshPhysicalMaterial',
  'TresBoxGeometry',
  'TresTorusGeometry',
  'TresSphereGeometry',
  'TresCylinderGeometry',
  'TresPlaneGeometry',
  'primitive' // Component <primitive> cũng là cốt lõi
]

try {
  // Đăng ký plugin
  app.use(Tres, {
    directives: {
      'log': vLog,
      'light-helper': vLightHelper,
      'always-look-at': vAlwaysLookAt,
      'distance-to': vDistanceTo,
      'rotate': vRotate
    }
  })

  // Mảng chứa các component bị thiếu
  const missingComponents = []

  // Kiểm tra từng component
  CORE_TRES_COMPONENTS.forEach(name => {
    if (!app.component(name)) {
      missingComponents.push(name)
    }
  })

  // Báo cáo kết quả
  // if (missingComponents.length === 0) {
  //   console.log('%c✅ [main.js] TẤT CẢ component TresJS cốt lõi đã được đăng ký thành công!', 'color: #42b883; font-weight: bold;')
  // } else {
  //   // Nếu có component bị thiếu, ném lỗi
  //   throw new Error(`Các component sau KHÔNG được đăng ký: ${missingComponents.join(', ')}`)
  // }

} catch (error) {
  console.error('❌ [main.js] Đăng ký plugin TresJS THẤT BẠI!', error)
}
//Tắt cảnh báo và lỗi Vue
app.config.warnHandler = () => { }
app.config.errorHandler = () => { }

app.mount('#app')