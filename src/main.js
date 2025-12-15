import { createApp } from "vue";
import "@/style/style.scss";
import App from "@/App.vue";
// 引入 pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// swiper
import "swiper/css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.mount("#app");

// ========================================================
// ✅ 修改部分：清除旧的 Service Worker 缓存
// 原有的 PWA 更新监听代码已删除，改为强制注销旧 SW
// ========================================================
if ('serviceWorker' in navigator) {
  // 获取所有注册的 Service Worker
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      // 注销每一个找到的 SW
      registration.unregister().then(() => {
        console.log('✅ 已注销旧版 Service Worker，页面缓存限制已解除');
      });
    }
  });
