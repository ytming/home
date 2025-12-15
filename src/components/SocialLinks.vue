<template>
  <!-- 社交链接 -->
  <div class="social">
    <div class="link">
      <a
        v-for="item in socialLinks"
        :key="item.name"
        :href="item.url"
        target="_blank"
        @mouseenter="socialTip = item.tip"
        @mouseleave="socialTip = ''"
        @click="onLinkClick($event, item)"
      >
        <img class="icon" :src="item.icon" height="24" />
      </a>
    </div>
    <span class="tip">{{ socialTip }}</span>
  </div>
</template>

<script setup>
import socialLinks from "@/assets/socialLinks.json";
import { mainStore } from "@/store"; // 1. 引入 store

const store = mainStore(); // 2. 实例化 store

// 社交链接提示
const socialTip = ref("通过这里联系我吧");

// 3. 处理点击事件
const onLinkClick = (e, item) => {
  // 判断 name 是否为 wallpaper
  if (item.name === "wallpaper") {
    e.preventDefault(); // 阻止默认的 a 标签跳转行为
    
    // 切换壁纸展示状态 (逻辑同 App.vue 中的鼠标中键)
    store.backgroundShow = !store.backgroundShow;
    
    // 弹出提示消息
    ElMessage({
      message: `已${store.backgroundShow ? "开启" : "退出"}壁纸展示~`,
      grouping: true,
    });
  }
};
</script>

<style lang="scss" scoped>
/* 样式保持不变，此处省略 ... */
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
    display: flex;
    align-items: center;
    justify-content: center;
    a {
      display: inherit;
      .icon {
        margin: 0 12px;
        transition: transform 0.3s;
        &:hover {
          transform: scale(1.1);
        }
        &:active {
          transform: scale(1);
        }
      }
    }
  }
  .tip {
    display: none;
    margin-right: 12px;
    animation: fade 0.5s;
  }
  @media (min-width: 768px) {
    &:hover {
      background-color: #00000040;
      backdrop-filter: blur(5px);
      .tip {
        display: block;
      }
    }
  }
}
</style>
