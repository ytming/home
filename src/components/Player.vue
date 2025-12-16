<template>
  <APlayer
    v-if="playList[0]"
    ref="player"
    :audio="playList"
    :autoplay="store.playerAutoplay"
    :theme="theme"
    :autoSwitch="false"
    :loop="store.playerLoop"
    :order="store.playerOrder"
    :volume="volume"
    :showLrc="true"
    :listFolded="listFolded"
    :listMaxHeight="listMaxHeight"
    :noticeSwitch="false"
    @play="onPlay"
    @pause="onPause"
    @timeupdate="onTimeUp"
    @error="loadMusicError"
    preload="none"
  />
</template>

<script setup>
import { MusicOne, PlayWrong } from "@icon-park/vue-next";
// import { getPlayerList } from "@/api"; // 这一行不再需要了，注释掉
import { mainStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";

const store = mainStore();

// 获取播放器 DOM
const player = ref(null);

// 歌曲播放列表
const playList = ref([]);

// 歌曲播放项
const playIndex = ref(0);

// 配置项
const props = defineProps({
  theme: { type: String, default: "#efefef" },
  volume: {
    type: Number,
    default: 0.7,
    validator: (value) => value >= 0 && value <= 1,
  },
  // 下面这些 props 虽然现在不用了，但保留着防止报错
  songServer: { type: String, default: "netease" },
  songType: { type: String, default: "playlist" },
  songId: { type: String, default: "7452421335" },
  listFolded: { type: Boolean, default: false },
  listMaxHeight: { type: Number, default: 420 },
});

const listHeight = computed(() => {
  return props.listMaxHeight + "px";
});

// --- 核心修改区域 Start ---
onMounted(() => {
  nextTick(async () => {
    try {
      console.log("正在从 Cloudflare Worker 获取 R2 音乐列表...");
      
      // 1. 使用 fetch 请求你的 Worker 接口
      const apiUrl = import.meta.env.VITE_MUSIC_API_URL;
      const response = await fetch(`${apiUrl}?t=${new Date().getTime()}`);
      
      // 2. 解析 JSON
      const res = await response.json();

      // 3. 校验数据
      if (!res || res.length === 0) {
        throw new Error("获取到的音乐列表为空");
      }

      console.log("获取成功:", res);

      // 4. 更改播放器加载状态
      store.musicIsOk = true;
      
      // 5. 生成歌单 (你的 Worker 返回的数据结构直接可以直接用)
      playList.value = res;
      
      console.log("音乐加载完成，共", playList.value.length, "首");

    } catch (err) {
      console.error("加载音乐失败:", err);
      store.musicIsOk = false;
      ElMessage({
        message: "播放器加载失败",
        grouping: true,
        icon: h(PlayWrong, {
          theme: "filled",
          fill: "#efefef",
        }),
      });
    }
  });
});
// --- 核心修改区域 End ---

// 播放
const onPlay = () => {
  console.log("播放");
  // 告诉浏览器：现在开始播放了，请全力下载/缓冲音频文件
  if (player.value && player.value.audioRef) {
    player.value.audioRef.preload = "auto";
  }
  playIndex.value = player.value.aplayer.index;
  store.setPlayerState(player.value.audioRef.paused);
  store.setPlayerData(playList.value[playIndex.value].name, playList.value[playIndex.value].artist);
  ElMessage({
    message: store.getPlayerData.name + " - " + store.getPlayerData.artist,
    grouping: true,
    icon: h(MusicOne, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
};

// 暂停
const onPause = () => {
  // 告诉浏览器：暂停了，只需要保留元数据，不要在后台疯狂下载剩下的文件了
  // 注意：浏览器可能会继续下载一小段缓冲区，但不会下载完整首歌
  if (player.value && player.value.audioRef) {
    player.value.audioRef.preload = "metadata";
  }
  store.setPlayerState(player.value.audioRef.paused);
};

// 音频时间更新事件
const onTimeUp = () => {
  // 1. 基础防呆检查
  if (!player.value || !player.value.aplayer || !player.value.audioRef) return;

  // 2. 获取歌词数组
  // APlayer 会把你提供的 LRC 解析成这样的数组：
  // [[0, "作词 : 黄伟文/李荣浩"], [1, "作曲 : 李荣浩"], ...]
  const lyricsList = player.value.aplayer.lyrics[playIndex.value];

  // 3. 如果这首歌真的没歌词，显示“纯音乐”或歌名
  if (!lyricsList || lyricsList.length === 0) {
    store.setPlayerLrc(store.getPlayerData.name + " - " + store.getPlayerData.artist);
    return;
  }

  // 4. 【关键】计算“抢答”时间
  // 给当前播放时间 +0.3 秒，解决底部歌词慢半拍的问题
  // 如果觉得还是慢，把 0.5 改成 0.8；如果太快了，改成 0.2
  const currentTime = player.value.audioRef.currentTime + 0.3;

  // 5. 查找当前对应的歌词
  let currentLrc = "";
  
  for (let i = 0; i < lyricsList.length; i++) {
    const time = lyricsList[i][0]; // 歌词时间戳
    const text = lyricsList[i][1]; // 歌词文字

    if (time <= currentTime) {
      currentLrc = text;
    } else {
      // 因为数组是按时间排序的，超过当前时间就可以停止了
      break;
    }
  }

  // 6. 过滤无效信息 & 更新显示
  // 如果歌词是 "Loading" 或 "Not available"，我们选择不更新（保持上一句），而不是显示报错
  if (currentLrc && currentLrc !== "Loading" && currentLrc !== "Not available") {
    store.setPlayerLrc(currentLrc);
  }
};

// 切换播放暂停事件
const playToggle = () => {
  player.value.toggle();
};

// 切换音量事件
const changeVolume = (value) => {
  player.value.setVolume(value, false);
};

// 切换上下曲
const changeSong = (type) => {
  type === 0 ? player.value.skipBack() : player.value.skipForward();
  nextTick(() => {
    player.value.play();
  });
};

// 切换歌曲列表状态
const toggleList = () => {
  player.value.toggleList();
};

// 加载音频错误
const loadMusicError = () => {
  let notice = "";
  if (playList.value.length > 1) {
    notice = "播放歌曲出现错误，播放器将在 2s 后进行下一首";
  } else {
    notice = "播放歌曲出现错误";
  }
  ElMessage({
    message: notice,
    grouping: true,
    icon: h(PlayWrong, {
      theme: "filled",
      fill: "#EFEFEF",
      duration: 2000,
    }),
  });
  console.error(
    "播放歌曲: " + player.value.aplayer.audio[player.value.aplayer.index].name + " 出现错误",
  );
};

// 暴露子组件方法
defineExpose({ playToggle, changeVolume, changeSong, toggleList });
</script>

<style lang="scss" scoped>
.aplayer {
  width: 80%;
  border-radius: 6px;
  font-family: "HarmonyOS_Regular", sans-serif !important;
  :deep(.aplayer-body) {
    background-color: transparent;
    .aplayer-pic {
      display: none;
    }
    .aplayer-info {
      margin-left: 0;
      background-color: #ffffff40;
      border-color: transparent !important;
      .aplayer-music {
        flex-grow: initial;
        margin-bottom: 2px;
        overflow: initial;
        .aplayer-title {
          font-size: 16px;
          margin-right: 6px;
        }
        .aplayer-author {
          color: #efefef;
        }
      }
      .aplayer-lrc {
        text-align: left;
        margin: 7px 0 6px 6px;
        height: 44px;
        mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0)
        );
        -webkit-mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0)
        );
        &::before,
        &::after {
          display: none;
        }
        p {
          color: #efefef;
        }
        .aplayer-lrc-current {
          font-size: 0.95rem;
          margin-bottom: 4px !important;
        }
      }
      .aplayer-controller {
        display: none;
      }
    }
  }
  :deep(.aplayer-list) {
    margin-top: 6px;
    height: v-bind(listHeight);
    background-color: transparent;
    ol {
      &::-webkit-scrollbar-track {
        background-color: transparent;
      }
      li {
        border-color: transparent;
        &.aplayer-list-light {
          background: #ffffff40;
          border-radius: 6px;
        }
        &:hover {
          background: #ffffff26 !important;
          border-radius: 6px !important;
        }
        .aplayer-list-index,
        .aplayer-list-author {
          color: #efefef;
        }
      }
    }
  }
}
</style>
