<template>
  <!-- 社交链接 -->
  <div class="social">
    <a
      v-for="item in socialLinks"
      :key="item.name"
      class="link"
      href="javascript:;"
      @mouseenter="item.hover = true"
      @mouseleave="item.hover = false"
      @click.prevent="jumpLink(item)"
    >
      <img class="icon" :src="item.icon" alt="icon" />
      <Transition name="fade">
        <span class="tip" v-show="item.hover">{{ item.tip }}</span>
      </Transition>
    </a>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import socialLinksData from "@/assets/socialLinks.json";

const store = mainStore();

// 处理数据，增加 hover 字段
const socialLinks = ref(
  socialLinksData.map((item) => {
    return { ...item, hover: false };
  })
);

/**
 * 跳转链接处理函数
 */
const jumpLink = (item) => {
  if (item.name === "Telegram") {
    // 核心修改：逻辑完全复刻鼠标中键的行为
    // 1. 切换状态 (取反)
    store.backgroundShow = !store.backgroundShow;
    
    // 2. 弹出提示 (保持和 App.vue 中的提示一致)
    ElMessage({
      message: `已${store.backgroundShow ? "开启" : "退出"}壁纸展示~`,
      grouping: true,
    });
    
  } else {
    // 其他图标正常跳转
    if (item.url) {
      window.open(item.url, "_blank");
    } else {
      ElMessage.warning("暂未配置链接");
    }
  }
};
</script>

<style lang="scss" scoped>
.social {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 460px;
  width: 100%;
  height: 42px;
  background-color: transparent;
  border-radius: 6px;
  backdrop-filter: blur(0);
  animation: fade 0.5s;
  transition:
    background-color 0.3s,
    backdrop-filter 0.3s;

  @media (max-width: 840px) {
    max-width: 100%;
    justify-content: center;
    .link {
      justify-content: space-evenly !important;
      width: 90%;
    }
    .tip {
      display: none !important;
    }
  }

  .link {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    text-decoration: none;
    cursor: pointer;
    padding: 0.3rem;
    transition: transform 0.3s;

    &:hover {
      transform: scale(1.1);
    }

    .icon {
      width: 24px;
      height: 24px;
    }

    .tip {
      display: block;
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      padding: 5px 10px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      color: #fff;
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 10;
    }
  }
}
</style>
