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
        <!-- 这里的 MoreSet 已经被删除了 -->
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
      <!-- 页脚 -->
      <Transition name="fade" mode="out-in">
        <Footer class="f-ter" v-show="!store.backgroundShow && !store.setOpenState" />
      </Transition>
    </main>
  </Transition>
</template>

<script setup>
import { helloInit, checkDays } from "@/utils/getTime.js";
import { HamburgerButton, CloseSmall } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { Icon } from "@vicons/utils";
import Loading from "@/components/Loading.vue";
import MainLeft from "@/views/Main/Left.vue";
import MainRight from "@/views/Main/Right.vue";
import Background from "@/components/Background.vue";
import Footer from "@/components/Footer.vue";
import Box from "@/views/Box/index.vue";
// import MoreSet from "@/views/MoreSet/index.vue"; // 已删除
import cursorInit from "@/utils/cursor.js";
import config from "@/../package.json";

const store = mainStore();

// 页面宽度
const getWidth = () => {
  store.setInnerWidth(window.innerWidth);
};

// 加载完成事件
const loadComplete = () => {
  nextTick(() => {
    // 欢迎提示
    helloInit();
    // 默哀模式
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

onMounted(() => {
  // 自定义鼠标
  cursorInit();

  // 屏蔽右键
  document.oncontextmenu = () => {
    ElMessage({
      message: "为了更好的体验,已禁用右键~",
      grouping: true,
      duration: 2000,
    });
    return false;
  };

  // 鼠标中键事件
  window.addEventListener("mousedown", (event) => {
    if (event.button == 1) {
      store.backgroundShow = !store.backgroundShow;
      ElMessage({
        message: `已${store.backgroundShow ? "开启" : "退出"}壁纸展示~`,
        grouping: true,
      });
    }
  });

  // 监听当前页面宽度
  getWidth();
  window.addEventListener("resize", getWidth);

  // 控制台输出
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
  
  // 核心修复：确保主容器也是 flex 布局，方便内容居中
  display: flex;
  justify-content: center;
  align-items: center;

  .container {
    width: 100%;
    height: 100vh; // 占满视口高度
    margin: 0 auto;
    padding: 0 0.5vw;
    box-sizing: border-box; // 防止 padding 撑大盒子
    
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
    // 移动端菜单位置优化
    top: 80%; 
    left: 50%;
    transform: translateX(-50%); // 完美水平居中
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

  /* --- 移动端适配重写 --- */
  
  @media (max-width: 720px) {
    .container {
      // 移除固定高度，允许内容自然伸缩，但保持在视口内
      height: 100vh;
      padding: 0 16px; // 给予左右边距
      
      .all {
        flex-direction: column; // 确保竖排
        padding: 0;
      }
    }

    // 针对特别小的屏幕（旧款 iPhone 等）
    @media (max-width: 390px) {
      .container {
        width: 100%; // 强制宽度 100%
        padding: 0 10px;
      }
    }
  }

  /* --- 处理高度不足的设备（横屏或小屏） --- */
  @media (max-height: 720px) {
    .container {
      // 保证内容居中
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .menu {
      top: 85%; // 稍微靠下一点
    }
    
    .f-ter {
      // 页脚位置优化
      position: absolute;
      bottom: 10px;
      width: 100%;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
