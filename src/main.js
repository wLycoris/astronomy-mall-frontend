import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'
import './assets/styles/global.scss'
import './assets/styles/commerce-gallery.scss'

// ==================== 高德地图 JS API 2.0 全局加载（6.0新增）====================
// 📌 设计说明:
//   - 在 main.js 统一加载一次，全局共用 window.AMap，所有页面无需重复加载
//   - 避免在各组件内多次 AMapLoader.load()，防止重复加载报错
//
// ⚠️ 关键: _AMapSecurityConfig 必须在 AMapLoader.load() 之前声明
//          JS API 2.0 强制要求，否则地图初始化失败，报安全密钥错误
//
// 📌 插件说明:
//   AMap.Geolocation  → 浏览器定位（6.4 地址联动，UserAddress.vue「使用当前位置」按钮）
//   AMap.Marker       → 地图标记（6.1 观测点地图展示）
//   AMap.InfoWindow   → 信息气泡（6.1 点击观测点弹出详情气泡）
//   AMap.Circle       → 圆形区域（6.1 用户位置周边范围圈）
//   AMap.Geocoder     → 逆地理编码（6.4 坐标转省市区地址自动填充）
//
// 📌 Key说明（已申请，直接使用）:
//   VITE_AMAP_JS_KEY        = 45d0e6381bae07b6c8fbcb5981c34aa9  （JS地图展示用）
//   VITE_AMAP_SECURITY_CODE = 79173ee15d14fd11a3c3d00186a3bd9d  （安全密钥）
//   amap.web-key（后端）    = 2ce80d8a2c6b51db75fd2c6603086432  （天气API后端专用，不暴露前端）
import AMapLoader from '@amap/amap-jsapi-loader'

window._AMapSecurityConfig = {
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE
}

AMapLoader.load({
    key: import.meta.env.VITE_AMAP_JS_KEY,
    version: '2.0',
    plugins: [
        'AMap.Geolocation',  // 浏览器定位
        'AMap.Marker',       // 地图标记点
        'AMap.InfoWindow',   // 信息气泡窗口
        'AMap.Circle',       // 圆形区域
        'AMap.Geocoder'      // 逆地理编码（坐标→省市区）
    ]
}).then(AMap => {
    window.AMap = AMap
    console.log('[AMap] 高德地图 JS API 2.0 加载完成 ✅')
}).catch(e => {
    // 地图加载失败不阻断主应用，静默降级（ObservationMap.vue 中检测 window.AMap 再渲染地图）
    console.error('[AMap] 高德地图加载失败，地图功能将不可用:', e)
})
// ==================== 高德地图加载结束 ====================

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
