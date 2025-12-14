<template>
  <div class="weather" v-if="weatherData.adCode.city && weatherData.weather.weather">
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <!-- 已移除风向和风力的 span -->
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { getAdcode, getWeather, getOtherWeather, getTXAdcode, getTXWeather } from "@/api";
import { Error } from "@icon-park/vue-next";
import { onMounted, reactive, h } from "vue";

// 高德开发者 Key
const mainKey = import.meta.env.VITE_WEATHER_KEY;
// 腾讯位置服务 Key
const txKey = import.meta.env.VITE_TX_WEATHER_KEY;

// 天气数据
const weatherData = reactive({
  adCode: {
    city: null, // 城市
    adcode: null, // 城市编码
  },
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    // 已移除风向和风力字段
  },
});

// 取出天气平均值 (备用接口使用)
const getTemperature = (min, max) => {
  try {
    const average = (Number(min) + Number(max)) / 2;
    return Math.round(average);
  } catch (error) {
    console.error("计算温度出现错误：", error);
    return "NaN";
  }
};

// 获取天气数据
const getWeatherData = async () => {
  let isSuccess = false; // 标记是否获取成功

  // ==============================================
  // 1. 优先尝试：腾讯位置服务
  // ==============================================
  if (txKey) {
    try {
      console.log("正在使用腾讯天气接口");
      
      // 1.1 获取位置
      const locationRes = await getTXAdcode(txKey);
      if (locationRes.status !== 0) throw "腾讯定位失败";

      const adInfo = locationRes.result.ad_info;
      const adcode = adInfo.adcode;

      // 1.2 获取天气
      const weatherRes = await getTXWeather(txKey, adcode);
      if (weatherRes.status !== 0) throw "腾讯天气请求失败";

      const realtimeData = weatherRes.result.realtime && weatherRes.result.realtime[0];
      
      if (!realtimeData || !realtimeData.infos) {
        throw "腾讯天气数据结构异常(缺少realtime/infos)";
      }

      // 赋值数据
      weatherData.adCode = {
        city: adInfo.district || adInfo.city || adInfo.province || "未知地区",
        adcode: adcode,
      };

      weatherData.weather = {
        weather: realtimeData.infos.weather,
        temperature: realtimeData.infos.temperature,
      };

      isSuccess = true; // 标记成功
      console.log("腾讯天气获取成功");

    } catch (error) {
      console.warn("腾讯天气接口失败，准备切换高德:", error);
    }
  }

  // ==============================================
  // 2. 降级方案：高德开放平台
  // ==============================================
  if (!isSuccess && mainKey) {
    try {
      console.log("正在使用高德天气接口");
      const adCodeRes = await getAdcode(mainKey);
      if (adCodeRes.infocode !== "10000") throw "高德地区查询失败";
      
      weatherData.adCode = {
        city: adCodeRes.city,
        adcode: adCodeRes.adcode,
      };

      const result = await getWeather(mainKey, weatherData.adCode.adcode);
      if (result.infocode !== "10000") throw "高德天气查询失败";

      weatherData.weather = {
        weather: result.lives[0].weather,
        temperature: result.lives[0].temperature,
      };
      
      isSuccess = true;
      console.log("高德天气获取成功");
    } catch (error) {
      console.warn("高德天气接口失败，准备切换备用接口:", error);
    }
  }

  // ==============================================
  // 3. 兜底方案：备用接口
  // ==============================================
  if (!isSuccess) {
    try {
      console.log("使用备用天气接口");
      const result = await getOtherWeather();
      const data = result.result;
      weatherData.adCode = {
        city: data.city.City || "未知地区",
      };
      weatherData.weather = {
        weather: data.condition.day_weather,
        temperature: getTemperature(data.condition.min_degree, data.condition.max_degree),
      };
    } catch (error) {
      console.error("所有天气接口均失败:", error);
      onError("天气信息获取失败");
    }
  }
};

// 报错信息
const onError = (message) => {
  // 假设这里引入了 ElMessage，如果不使用 Element Plus 请自行调整
  if (typeof ElMessage !== 'undefined') {
    ElMessage({
      message,
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
  } else {
    console.error(message);
  }
};

onMounted(() => {
  getWeatherData();
});
</script>

<style lang="scss" scoped>
.weather {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  span {
    margin-right: 6px;
  }
}
</style>
