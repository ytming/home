<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img
      v-show="store.imgLoadStatus"
      :src="bgUrl"
      class="bg"
      alt="cover"
      @load="imgLoadComplete"
      @error.once="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    <div :class="store.backgroundShow ? 'gray hidden' : 'gray'" />
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
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Error } from "@icon-park/vue-next";

const store = mainStore();
const bgUrl = ref(null);
const imgTimeout = ref(null);
const downloadText = ref("下载壁纸");
const emit = defineEmits(["loadComplete"]);

// 读取环境变量
const WALLPAPER_URL = import.meta.env.VITE_WALLPAPER_URL;
// 本地默认壁纸路径 (请确保 public/images/ 下有此文件)
const DEFAULT_WALLPAPER = "/images/defaultwallpaper.jpg"; //默认壁纸文件的路径

// 核心逻辑：获取壁纸
const changeBg = async () => {
  // 1. 先重置加载状态
  store.setImgLoadStatus(false);
  
  try {
    // 检查环境变量，如果没有配置直接抛出错误，进入 fallback 逻辑
    if (!WALLPAPER_URL) {
      throw new Error("VITE_WALLPAPER_URL 未配置");
    }

    // 2. 尝试从 Cloudflare Worker 获取
    const response = await fetch(`${WALLPAPER_URL}?t=${new Date().getTime()}`);
    
    // 如果 Worker 返回 404/500 等错误，抛出异常
    if (!response.ok) throw new Error("Worker Response Error");
    
    // 3. 成功：转换为 Blob
    const blob = await response.blob();
    createBlobUrl(blob);

  } catch (error) {
    console.warn("云端壁纸获取失败，尝试加载默认壁纸:", error);
    // 4. 失败：加载本地兜底壁纸
    loadFallback();
  }
};

// 加载本地兜底壁纸
const loadFallback = async () => {
  try {
    // 请求本地文件
    const response = await fetch(DEFAULT_WALLPAPER);
    if (!response.ok) throw new Error("Default Wallpaper Missing");
    
    // 同样转换为 Blob，保持逻辑统一
    const blob = await response.blob();
    createBlobUrl(blob);
    
    // 提示用户
    ElMessage.warning({
      message: "云端壁纸加载失败，已切换至默认",
      duration: 3000,
      icon: h(Error, { theme: "filled", fill: "#e6a23c" }),
    });
    
  } catch (err) {
    console.error("默认壁纸也加载失败:", err);
    imgLoadError();
  }
};

// 辅助函数：生成 Blob URL 并赋值
const createBlobUrl = (blob) => {
  // 释放旧的内存
  if (bgUrl.value) {
    URL.revokeObjectURL(bgUrl.value);
  }
  // 生成新链接
  bgUrl.value = URL.createObjectURL(blob);
};

// 下载功能
const downloadImage = () => {
  if (!bgUrl.value) {
    ElMessage.warning("没有可下载的壁纸");
    return;
  }
  
  downloadText.value = "下载中...";
  
  const link = document.createElement('a');
  link.href = bgUrl.value;
  // 根据当前是否是默认壁纸来决定文件名 (可选优化)
  const isDefault = bgUrl.value.includes("default");
  link.download = `Wallpaper_${new Date().getTime()}.jpg`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => {
    downloadText.value = "下载壁纸";
  }, 1000);
};

// 图片加载完成 (DOM渲染层面)
const imgLoadComplete = () => {
  imgTimeout.value = setTimeout(
    () => {
      store.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

// 图片动画完成
const imgAnimationEnd = () => {
  // console.log("壁纸加载且动画完成");
  emit("loadComplete");
};

// 彻底失败 (云端和本地都挂了)
const imgLoadError = () => {
  ElMessage.error({
    message: "壁纸加载彻底失败",
    icon: h(Error, { theme: "filled", fill: "#ff0000" }),
  });
};

watch(
  () => store.coverType,
  () => {
    changeBg();
  },
);

onMounted(() => {
  changeBg();
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
  if (bgUrl.value) {
    URL.revokeObjectURL(bgUrl.value);
  }
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
    transition:
      filter 0.3s,
      transform 0.3s;
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
    &:hover {
      transform: scale(1.05);
      background-color: #00000060;
    }
    &:active {
      transform: scale(1);
    }
  }
}
</style>
