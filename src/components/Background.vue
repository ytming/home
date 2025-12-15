<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <!-- 壁纸图片 -->
    <img
      v-show="store.imgLoadStatus"
      :src="bgUrl"
      class="bg"
      alt="cover"
      @load="imgLoadComplete"
      @error.once="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    
    <!-- 灰色遮罩层 -->
    <div :class="store.backgroundShow ? 'gray hidden' : 'gray'" />
    
    <!-- 下载按钮 -->
    <Transition name="fade" mode="out-in">
      <a
        v-if="store.backgroundShow"
        class="down"
        href="javascript:;"
        @click.prevent="downloadImage"
      >
        {{ downloadText }}
      </a>
    </Transition>

    <!-- 新增：关闭按钮 (仿时光胶囊弹窗风格) -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="store.backgroundShow"
        class="close-icon"
        @click="closeCover"
      >
        <close-one theme="filled" size="28" fill="#ffffff" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Error, CloseOne } from "@icon-park/vue-next"; // 确保引入了 CloseOne

const store = mainStore();
const bgUrl = ref(null);
const imgTimeout = ref(null);
const downloadText = ref("下载壁纸");
const emit = defineEmits(["loadComplete"]);

// 环境变量与默认壁纸
const WALLPAPER_URL = import.meta.env.VITE_WALLPAPER_URL;
const DEFAULT_WALLPAPER = "/images/defaultwallpaper.jpg";

// 关闭遮罩层逻辑
const closeCover = () => {
  store.backgroundShow = false; 
};

// 核心：更换壁纸
const changeBg = async () => {
  store.setImgLoadStatus(false);
  try {
    if (!WALLPAPER_URL) {
      throw new Error("VITE_WALLPAPER_URL 未配置");
    }
    const response = await fetch(`${WALLPAPER_URL}?t=${new Date().getTime()}`);
    if (!response.ok) throw new Error("Worker Response Error");
    const blob = await response.blob();
    createBlobUrl(blob);
  } catch (error) {
    console.warn("云端壁纸获取失败，尝试加载默认壁纸");
    loadFallback();
  }
};

// 兜底逻辑
const loadFallback = async () => {
  try {
    const response = await fetch(DEFAULT_WALLPAPER);
    if (!response.ok) throw new Error("Default Wallpaper Missing");
    const blob = await response.blob();
    createBlobUrl(blob);
    // 仅在非初始化时提示，避免刷新页面太吵
    // ElMessage.warning("使用默认壁纸"); 
  } catch (err) {
    console.error("默认壁纸也加载失败:", err);
    imgLoadError();
  }
};

const createBlobUrl = (blob) => {
  if (bgUrl.value) URL.revokeObjectURL(bgUrl.value);
  bgUrl.value = URL.createObjectURL(blob);
};

const downloadImage = () => {
  if (!bgUrl.value) {
    ElMessage.warning("没有可下载的壁纸");
    return;
  }
  downloadText.value = "下载中...";
  const link = document.createElement('a');
  link.href = bgUrl.value;
  link.download = `Wallpaper_${new Date().getTime()}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    downloadText.value = "下载壁纸";
  }, 1000);
};

const imgLoadComplete = () => {
  imgTimeout.value = setTimeout(
    () => {
      store.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

const imgAnimationEnd = () => {
  emit("loadComplete");
};

const imgLoadError = () => {
  ElMessage.error({
    message: "壁纸加载彻底失败",
    icon: h(Error, { theme: "filled", fill: "#ff0000" }),
  });
};

watch(() => store.coverType, () => changeBg());

onMounted(() => changeBg());

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
  if (bgUrl.value) URL.revokeObjectURL(bgUrl.value);
});
</script>

<style lang="scss" scoped>
.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: 0.25s;
  z-index: -1;

  &.show {
    z-index: 1;
  }

  .bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    backface-visibility: hidden;
    filter: blur(20px) brightness(0.3);
    transition: filter 0.3s, transform 0.3s;
    animation: fade-blur-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.45s;
  }
  
  .gray {
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.5) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%);
    transition: 1.5s;
    &.hidden {
      opacity: 0;
      transition: 1.5s;
    }
  }
  
  .down {
    font-size: 16px;
    color: white;
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: block;
    padding: 20px 26px;
    border-radius: 8px;
    background-color: #00000030;
    width: 120px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s;
    &:hover {
      transform: scale(1.05);
      background-color: #00000060;
    }
    &:active {
      transform: scale(1);
    }
  }

  /* 
   * 新增：关闭按钮样式
   * 1. 使用 position: absolute 定位到右上角
   * 2. z-index: 20 确保它浮在遮罩层上面（这很重要！）
   * 3. 去掉了背景色，只保留图标，加上一点阴影防止背景太白看不清
   */
  .close-icon {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 20; /* 必须大于 gray 层的层级 */
    cursor: pointer;
    opacity: 0.8;
    transition: transform 0.3s, opacity 0.3s;
    
    // 给图标加一个淡淡的阴影，这样即使壁纸是白色的也能看清
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));

    &:hover {
      transform: scale(1.2);
      opacity: 1;
    }
    
    &:active {
      transform: scale(0.9);
    }
  }
}
</style>
