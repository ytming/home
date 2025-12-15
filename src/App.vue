<template>
  <!-- 加载 -->
  <Loading />
  <!-- 壁纸 -->
  <Background @loadComplete="loadComplete" />
  <!-- 主界面 -->
  <Transition name="fade" mode="out-in">
    <main id="main" v-if="store.imgLoadStatus">
      <div class="container" v-show="!store.backgroundShow">
        <section class="all" v-show="!store.setOpenState">
          <MainLeft />
          <MainRight v-show="!store.boxOpenState" />
          <Box v-show="store.boxOpenState" />
        </section>
      </div>

      <!-- 移动端菜单按钮 -->
      <Icon
        class="menu"
        size="24"
        v-show="!store.backgroundShow"
        @click="store.mobileOpenState = !store.mobileOpenState"
      >
        <component :is="store.mobileOpenState ? CloseSmall : HamburgerButton" />
      </Icon>

      <!-- ✅ 【新增】修复跳转按钮 (只在旧域名显示) -->
      <div class="fix-btn" v-if="isOldDomain" @click="handleFix" title="点击修复跳转问题">
        <Icon size="24">
          <Attention theme="filled" fill="#f56c6c" />
        </Icon>
        <span class="fix-text">修复跳转</span>
      </div>

      <!-- 页脚 -->
      <Transition name="fade" mode="out-in">
        <Footer class="f-ter" v-show="!store.backgroundShow && !store.setOpenState" />
      </Transition>
    </main>
  </Transition>
</template>

<script setup>
import { helloInit, checkDays } from "@/utils/getTime.js";
// ✅ 【修改】引入 Attention 图标
import { HamburgerButton, CloseSmall, Attention } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { Icon } from "@vicons/utils";
import Loading from "@/components/Loading.vue";
import MainLeft from "@/views/Main/Left.vue";
import MainRight from "@/views/Main/Right.vue";
import Background from "@/components/Background.vue";
import Footer from "@/components/Footer.vue";
import Box from "@/views/Box/index.vue";
import cursorInit from "@/utils/cursor.js";
import config from "@/../package.json";
// ✅ 【新增】引入 ref
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";

const store = mainStore();

// ✅ 【新增】定义变量，否则下面会报错
const isOldDomain = ref(false);

// 页面宽度
const getWidth = () => {
  store.setInnerWidth(window.innerWidth);
};

// 加载完成事件
const loadComplete = () => {
  nextTick(() => {
    helloInit();
    checkDays();
  });
};

// 监听宽度变化
watch(
  () => store.innerWidth,
  (value) => {
    if (value < 721) {
      store.boxOpenState = false;
      store.setOpenState = false;
    }
  },
);

// ✅ 【新增】修复按钮的点击事件
const handleFix = () => {
  // 确保地址以 / 结尾
  const targetUrl = config.home.endsWith('/') ? config.home : config.home + '/';
  
  if (window.nukeCacheAndReload) {
    // 调用 index.html 里的全局函数
    window.nukeCacheAndReload(targetUrl);
  } else {
    // 兜底方案
    window.location.href = targetUrl + '?t=' + new Date().getTime();
  }
};

onMounted(() => {
  // ✅ 【新增】域名检测逻辑
  let targetDomain = '';
  try {
    targetDomain = new URL(config.home).hostname; 
  } catch (e) {
    targetDomain = 'www.tming.cn'; 
  }

  const currentDomain = window.location.hostname;
  // 排除本地开发环境
  const isDev = currentDomain === 'localhost' || currentDomain === '127.0.0.1';

  if (currentDomain !== targetDomain && !isDev) {
    isOldDomain.value = true; // 显示按钮
    ElMessage({
      message: `检测到域名异常，请点击右上角/右下角的修复按钮跳转至 ${targetDomain}`,
      type: 'warning',
      duration: 5000,
    });
  }

  // 其他原有逻辑
  cursorInit();

  document.oncontextmenu = () => {
    ElMessage({
      message: "为了更好的体验,已禁用右键~",
      grouping: true,
      duration: 2000,
    });
    return false;
  };

  window.addEventListener("mousedown", (event) => {
    if (event.button == 1) {
      store.backgroundShow = !store.backgroundShow;
      ElMessage({
        message: `已${store.backgroundShow ? "开启" : "退出"}壁纸展示~`,
        grouping: true,
      });
    }
  });

  getWidth();
  window.addEventListener("resize", getWidth);

  const styleTitle1 = "font-size: 20px;font-weight: 600;color: rgb(244,167,89);";
  const styleTitle2 = "font-size:12px;color: rgb(244,167,89);";
  const styleContent = "color: rgb(30,152,255);";
  const title1 = "無名の主页";
  const title2 = `
 _____ __  __  _______     ____     __
|_   _|  \\/  |/ ____\\ \\   / /\\ \\   / /
  | | | \\  / | (___  \\ \\_/ /  \\ \\_/ /
  | | | |\\/| |\\___ \\  \\   /    \\   /
 _| |_| |  | |____) |  | |      | |
|_____|_|  |_|_____/   |_|      |_|`;
  const content = `\n\n版本: ${config.version}\n主页: ${config.home}\nGithub: ${config.github}`;
  console.info(`%c${title1} %c${title2} %c${content}`, styleTitle1, styleTitle2, styleContent);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", getWidth);
});
</script>

<style lang="scss" scoped>
#main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: scale(1.2);
  transition: transform 0.3s;
  animation: fade-blur-main-in 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 0.5s;
  
  display: flex;
  justify-content: center;
  align-items: center;

  .container {
    width: 100%;
    height: 100vh;
    margin: 0 auto;
    padding: 0 0.5vw;
    box-sizing: border-box;
    
    .all {
      width: 100%;
      height: 100%;
      padding: 0 0.75rem;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }

    @media (max-width: 1200px) {
      padding: 0 2vw;
    }
  }

  .menu {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 80%; 
    left: 50%;
    transform: translateX(-50%);
    width: 56px;
    height: 34px;
    background: rgb(0 0 0 / 20%);
    backdrop-filter: blur(10px);
    border-radius: 6px;
    transition: all 0.3s;
    animation: fade 0.5s;
    z-index: 10;

    &:active {
      transform: translateX(-50%) scale(0.95);
    }

    .i-icon {
      transform: translateY(2px);
    }

    @media (min-width: 721px) {
      display: none;
    }
  }

  /* ✅ 【新增】修复按钮样式 */
  .fix-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 50px;
    cursor: pointer;
    z-index: 9999;
    animation: fade 0.5s;
    transition: transform 0.3s;
    border: 1px solid rgba(245, 108, 108, 0.3);

    .fix-text {
      color: #f56c6c;
      font-size: 14px;
      font-weight: bold;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: scale(1.05);
    }
    
    &:active {
      transform: scale(0.95);
    }

    @media (max-width: 720px) {
      top: 15px;
      right: 15px;
      padding: 6px 12px;
      .fix-text {
        font-size: 12px;
      }
    }
  }

  @media (max-width: 720px) {
    .container {
      height: 100vh;
      padding: 0 16px;
      .all {
        flex-direction: column;
        padding: 0;
      }
    }
    @media (max-width: 390px) {
      .container {
        width: 100%;
        padding: 0 10px;
      }
    }
  }

  @media (max-height: 720px) {
    .container {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .menu {
      top: 85%;
    }
    .f-ter {
      position: absolute;
      bottom: 10px;
      width: 100%;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
